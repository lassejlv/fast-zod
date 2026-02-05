// Object and Record schemas - optimized for fast property access

import { BaseSchema } from "./base";
import { ParseContext, ValidationError, Issue } from "./types";

type Shape = Record<string, BaseSchema<any, any>>;

type ObjectOutput<T extends Shape> = {
  [K in keyof T]: T[K]["_output"];
};

type ObjectInput<T extends Shape> = {
  [K in keyof T]: T[K]["_input"];
};

type UnknownKeysMode = "strip" | "strict" | "passthrough";

export class ObjectSchema<T extends Shape> extends BaseSchema<
  ObjectOutput<T>,
  ObjectInput<T>
> {
  private _shape: T;
  private _unknownKeys: UnknownKeysMode = "strip";
  private _catchall?: BaseSchema<any, any>;

  constructor(shape: T) {
    super();
    this._shape = shape;
  }

  get shape(): T {
    return this._shape;
  }

  _parse(data: unknown, ctx: ParseContext): ObjectOutput<T> {
    if (typeof data !== "object" || data === null || Array.isArray(data)) {
      this._fail(
        "invalid_type",
        `Expected object, received ${data === null ? "null" : Array.isArray(data) ? "array" : typeof data}`,
        ctx,
        {
          expected: "object",
          received:
            data === null
              ? "null"
              : Array.isArray(data)
                ? "array"
                : typeof data,
        },
      );
    }

    const input = data as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    const issues: Issue[] = [];

    // Parse known keys
    const shapeKeys = Object.keys(this._shape);
    for (let i = 0; i < shapeKeys.length; i++) {
      const key = shapeKeys[i];
      const schema = this._shape[key];
      const value = input[key];

      try {
        output[key] = schema._parse(value, {
          path: [...ctx.path, key],
          parent: input,
        });
      } catch (e) {
        if (e instanceof ValidationError) {
          issues.push(...e.issues);
        } else {
          throw e;
        }
      }
    }

    // Handle unknown keys
    if (this._unknownKeys !== "strip" || this._catchall) {
      const inputKeys = Object.keys(input);
      for (let i = 0; i < inputKeys.length; i++) {
        const key = inputKeys[i];
        if (!(key in this._shape)) {
          if (this._catchall) {
            try {
              output[key] = this._catchall._parse(input[key], {
                path: [...ctx.path, key],
                parent: input,
              });
            } catch (e) {
              if (e instanceof ValidationError) {
                issues.push(...e.issues);
              } else {
                throw e;
              }
            }
          } else if (this._unknownKeys === "strict") {
            issues.push({
              code: "unrecognized_keys",
              path: ctx.path,
              message: `Unrecognized key: "${key}"`,
            });
          } else if (this._unknownKeys === "passthrough") {
            output[key] = input[key];
          }
        }
      }
    }

    if (issues.length > 0) {
      throw new ValidationError(issues);
    }

    return output as ObjectOutput<T>;
  }

  private _clone<S extends Shape>(newShape?: S): ObjectSchema<S> {
    const clone = new ObjectSchema(newShape ?? (this._shape as unknown as S));
    clone._unknownKeys = this._unknownKeys;
    clone._catchall = this._catchall;
    clone._errorCustomizer = this._errorCustomizer;
    return clone;
  }

  // Unknown keys handling
  strict(): ObjectSchema<T> {
    const clone = this._clone<T>();
    clone._unknownKeys = "strict";
    return clone;
  }

  strip(): ObjectSchema<T> {
    const clone = this._clone<T>();
    clone._unknownKeys = "strip";
    return clone;
  }

  passthrough(): ObjectSchema<T> {
    const clone = this._clone<T>();
    clone._unknownKeys = "passthrough";
    return clone;
  }

  catchall<C extends BaseSchema<any, any>>(schema: C): ObjectSchema<T> {
    const clone = this._clone<T>();
    clone._catchall = schema;
    return clone;
  }

  // Shape manipulation
  extend<E extends Shape>(extension: E): ObjectSchema<T & E> {
    return new ObjectSchema({ ...this._shape, ...extension } as T & E);
  }

  merge<M extends ObjectSchema<any>>(other: M): ObjectSchema<T & M["shape"]> {
    return new ObjectSchema({ ...this._shape, ...other.shape } as T &
      M["shape"]);
  }

  pick<K extends keyof T>(...keys: K[]): ObjectSchema<Pick<T, K>> {
    const newShape: Partial<T> = {};
    for (const key of keys) {
      if (key in this._shape) {
        newShape[key] = this._shape[key];
      }
    }
    return new ObjectSchema(newShape as Pick<T, K>);
  }

  omit<K extends keyof T>(...keys: K[]): ObjectSchema<Omit<T, K>> {
    const newShape = { ...this._shape };
    for (const key of keys) {
      delete newShape[key];
    }
    return new ObjectSchema(newShape as Omit<T, K>);
  }

  partial(): ObjectSchema<{
    [K in keyof T]: BaseSchema<
      T[K]["_output"] | undefined,
      T[K]["_input"] | undefined
    >;
  }> {
    const newShape: Record<string, BaseSchema<any, any>> = {};
    for (const key of Object.keys(this._shape)) {
      newShape[key] = this._shape[key].optional() as unknown as BaseSchema<
        any,
        any
      >;
    }
    return new ObjectSchema(newShape) as any;
  }

  required(): ObjectSchema<T> {
    // For now just returns the same schema since all fields are required by default
    // In a full implementation, this would unwrap optional fields
    return this._clone();
  }

  keyof(): EnumSchema<(keyof T & string)[]> {
    const keys = Object.keys(this._shape) as (keyof T & string)[];
    return new EnumSchema(keys);
  }
}

// Strict object - fails on unknown keys
export class StrictObjectSchema<T extends Shape> extends ObjectSchema<T> {
  constructor(shape: T) {
    super(shape);
    (this as any)._unknownKeys = "strict";
  }
}

// Loose object - passes through unknown keys
export class LooseObjectSchema<T extends Shape> extends ObjectSchema<T> {
  constructor(shape: T) {
    super(shape);
    (this as any)._unknownKeys = "passthrough";
  }
}

// Record schema (dynamic keys)
export class RecordSchema<
  K extends BaseSchema<string>,
  V extends BaseSchema<any>,
> extends BaseSchema<
  Record<K["_output"], V["_output"]>,
  Record<K["_input"], V["_input"]>
> {
  constructor(
    private _keySchema: K,
    private _valueSchema: V,
  ) {
    super();
  }

  _parse(data: unknown, ctx: ParseContext): Record<K["_output"], V["_output"]> {
    if (typeof data !== "object" || data === null || Array.isArray(data)) {
      this._fail(
        "invalid_type",
        `Expected object, received ${data === null ? "null" : Array.isArray(data) ? "array" : typeof data}`,
        ctx,
        {
          expected: "object",
          received:
            data === null
              ? "null"
              : Array.isArray(data)
                ? "array"
                : typeof data,
        },
      );
    }

    const input = data as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    const issues: Issue[] = [];

    const keys = Object.keys(input);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];

      // Validate key
      try {
        this._keySchema._parse(key, {
          path: [...ctx.path, key],
          parent: input,
        });
      } catch (e) {
        if (e instanceof ValidationError) {
          issues.push(...e.issues);
        } else {
          throw e;
        }
        continue;
      }

      // Validate value
      try {
        output[key] = this._valueSchema._parse(input[key], {
          path: [...ctx.path, key],
          parent: input,
        });
      } catch (e) {
        if (e instanceof ValidationError) {
          issues.push(...e.issues);
        } else {
          throw e;
        }
      }
    }

    if (issues.length > 0) {
      throw new ValidationError(issues);
    }

    return output as Record<K["_output"], V["_output"]>;
  }
}

// Map schema
export class MapSchema<
  K extends BaseSchema<any>,
  V extends BaseSchema<any>,
> extends BaseSchema<
  Map<K["_output"], V["_output"]>,
  Map<K["_input"], V["_input"]>
> {
  constructor(
    private _keySchema: K,
    private _valueSchema: V,
  ) {
    super();
  }

  _parse(data: unknown, ctx: ParseContext): Map<K["_output"], V["_output"]> {
    if (!(data instanceof Map)) {
      this._fail("invalid_type", `Expected Map, received ${typeof data}`, ctx, {
        expected: "Map",
        received: typeof data,
      });
    }

    const output = new Map<K["_output"], V["_output"]>();
    const issues: Issue[] = [];
    let index = 0;

    for (const [key, value] of data) {
      try {
        const parsedKey = this._keySchema._parse(key, {
          path: [...ctx.path, index, "key"],
          parent: data,
        });
        const parsedValue = this._valueSchema._parse(value, {
          path: [...ctx.path, index, "value"],
          parent: data,
        });
        output.set(parsedKey, parsedValue);
      } catch (e) {
        if (e instanceof ValidationError) {
          issues.push(...e.issues);
        } else {
          throw e;
        }
      }
      index++;
    }

    if (issues.length > 0) {
      throw new ValidationError(issues);
    }

    return output;
  }
}

// Set schema
export class SetSchema<T extends BaseSchema<any>> extends BaseSchema<
  Set<T["_output"]>,
  Set<T["_input"]>
> {
  private _min?: number;
  private _max?: number;
  private _size?: number;

  constructor(private _valueSchema: T) {
    super();
  }

  _parse(data: unknown, ctx: ParseContext): Set<T["_output"]> {
    if (!(data instanceof Set)) {
      this._fail("invalid_type", `Expected Set, received ${typeof data}`, ctx, {
        expected: "Set",
        received: typeof data,
      });
    }

    const size = data.size;

    if (this._size !== undefined && size !== this._size) {
      this._fail(
        "invalid_size",
        `Set must have exactly ${this._size} elements`,
        ctx,
      );
    }

    if (this._min !== undefined && size < this._min) {
      this._fail(
        "too_small",
        `Set must have at least ${this._min} elements`,
        ctx,
      );
    }

    if (this._max !== undefined && size > this._max) {
      this._fail("too_big", `Set must have at most ${this._max} elements`, ctx);
    }

    const output = new Set<T["_output"]>();
    const issues: Issue[] = [];
    let index = 0;

    for (const value of data) {
      try {
        output.add(
          this._valueSchema._parse(value, {
            path: [...ctx.path, index],
            parent: data,
          }),
        );
      } catch (e) {
        if (e instanceof ValidationError) {
          issues.push(...e.issues);
        } else {
          throw e;
        }
      }
      index++;
    }

    if (issues.length > 0) {
      throw new ValidationError(issues);
    }

    return output;
  }

  private _clone(): SetSchema<T> {
    const clone = new SetSchema(this._valueSchema);
    clone._min = this._min;
    clone._max = this._max;
    clone._size = this._size;
    clone._errorCustomizer = this._errorCustomizer;
    return clone;
  }

  min(size: number): SetSchema<T> {
    const clone = this._clone();
    clone._min = size;
    return clone;
  }

  max(size: number): SetSchema<T> {
    const clone = this._clone();
    clone._max = size;
    return clone;
  }

  size(size: number): SetSchema<T> {
    const clone = this._clone();
    clone._size = size;
    return clone;
  }

  nonempty(): SetSchema<T> {
    return this.min(1);
  }
}

// Need to import this for keyof
import { EnumSchema } from "./enum";
