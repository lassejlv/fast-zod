// Enum, Literal, and Union schemas

import { BaseSchema } from "./base";
import { ParseContext, ValidationError, Issue } from "./types";

// Literal schema - matches exact values
type Primitive = string | number | boolean | bigint | null | undefined;

export class LiteralSchema<
  T extends Primitive | Primitive[],
> extends BaseSchema<T extends Primitive[] ? T[number] : T> {
  private _values: Set<Primitive>;

  constructor(value: T) {
    super();
    if (Array.isArray(value)) {
      this._values = new Set(value as Primitive[]);
    } else {
      this._values = new Set([value as Primitive]);
    }
  }

  _parse(
    data: unknown,
    ctx: ParseContext,
  ): T extends Primitive[] ? T[number] : T {
    if (!this._values.has(data as Primitive)) {
      const expected = [...this._values]
        .map((v) => JSON.stringify(v))
        .join(" | ");
      this._fail(
        "invalid_literal",
        `Expected ${expected}, received ${JSON.stringify(data)}`,
        ctx,
        {
          expected,
          received: JSON.stringify(data),
        },
      );
    }
    return data as any;
  }
}

// Enum schema - matches one of a set of string values
export class EnumSchema<
  T extends readonly string[] | string[],
> extends BaseSchema<T[number]> {
  private _values: Set<string>;
  readonly enum: { [K in T[number]]: K };
  readonly options: T;

  constructor(values: T) {
    super();
    this._values = new Set(values);
    this.options = values;
    // Create enum-like object for access
    this.enum = {} as { [K in T[number]]: K };
    for (const value of values) {
      (this.enum as any)[value] = value;
    }
  }

  _parse(data: unknown, ctx: ParseContext): T[number] {
    if (typeof data !== "string" || !this._values.has(data)) {
      const expected = [...this._values].map((v) => `"${v}"`).join(" | ");
      this._fail(
        "invalid_enum_value",
        `Expected ${expected}, received ${JSON.stringify(data)}`,
        ctx,
        {
          expected,
          received: JSON.stringify(data),
        },
      );
    }
    return data as T[number];
  }

  extract<K extends T[number]>(...values: K[]): EnumSchema<K[]> {
    return new EnumSchema(values);
  }

  exclude<K extends T[number]>(
    ...values: K[]
  ): EnumSchema<Exclude<T[number], K>[]> {
    const remaining = [...this._values].filter(
      (v) => !values.includes(v as K),
    ) as Exclude<T[number], K>[];
    return new EnumSchema(remaining);
  }
}

// Native enum schema (TypeScript enums)
export class NativeEnumSchema<
  T extends Record<string, string | number>,
> extends BaseSchema<T[keyof T]> {
  private _values: Set<string | number>;

  constructor(private _enum: T) {
    super();
    // Extract values from TypeScript enum (handles both string and numeric enums)
    this._values = new Set(
      Object.values(_enum).filter(
        (v) => typeof _enum[v as keyof T] !== "number",
      ),
    );
  }

  get enum(): T {
    return this._enum;
  }

  _parse(data: unknown, ctx: ParseContext): T[keyof T] {
    if (!this._values.has(data as string | number)) {
      const expected = [...this._values]
        .map((v) => JSON.stringify(v))
        .join(" | ");
      this._fail(
        "invalid_enum_value",
        `Expected ${expected}, received ${JSON.stringify(data)}`,
        ctx,
        {
          expected,
          received: JSON.stringify(data),
        },
      );
    }
    return data as T[keyof T];
  }
}

// Union schema - matches any of the given schemas
export class UnionSchema<
  T extends readonly BaseSchema<any, any>[],
> extends BaseSchema<T[number]["_output"], T[number]["_input"]> {
  constructor(private _options: T) {
    super();
  }

  get options(): T {
    return this._options;
  }

  _parse(data: unknown, ctx: ParseContext): T[number]["_output"] {
    const issues: Issue[] = [];

    for (const option of this._options) {
      try {
        return option._parse(data, ctx);
      } catch (e) {
        if (e instanceof ValidationError) {
          issues.push(...e.issues);
        } else {
          throw e;
        }
      }
    }

    // None matched
    this._fail(
      "invalid_union",
      "Invalid input: does not match any union member",
      ctx,
    );
  }
}

// Discriminated union - more efficient matching based on discriminator key
export class DiscriminatedUnionSchema<
  Discriminator extends string,
  T extends readonly BaseSchema<any, any>[],
> extends BaseSchema<T[number]["_output"], T[number]["_input"]> {
  private _map: Map<unknown, BaseSchema<any, any>>;

  constructor(
    private _discriminator: Discriminator,
    private _options: T,
  ) {
    super();

    // Build lookup map for O(1) matching
    this._map = new Map();
    for (const option of _options) {
      // Try to extract discriminator value from the schema
      // This assumes the schema has a shape property with the discriminator
      const shape = (option as any)._shape ?? (option as any).shape;
      if (shape && shape[_discriminator]) {
        const discSchema = shape[_discriminator];
        // Handle literal schemas
        if (discSchema instanceof LiteralSchema) {
          for (const value of (discSchema as any)._values) {
            this._map.set(value, option);
          }
        }
      }
    }
  }

  get discriminator(): Discriminator {
    return this._discriminator;
  }

  get options(): T {
    return this._options;
  }

  _parse(data: unknown, ctx: ParseContext): T[number]["_output"] {
    if (typeof data !== "object" || data === null) {
      this._fail(
        "invalid_type",
        `Expected object, received ${data === null ? "null" : typeof data}`,
        ctx,
      );
    }

    const discriminatorValue = (data as Record<string, unknown>)[
      this._discriminator
    ];
    const matchedSchema = this._map.get(discriminatorValue);

    if (matchedSchema) {
      return matchedSchema._parse(data, ctx);
    }

    // Fallback to trying all options
    for (const option of this._options) {
      try {
        return option._parse(data, ctx);
      } catch {
        continue;
      }
    }

    this._fail(
      "invalid_union_discriminator",
      `Invalid discriminator value: ${JSON.stringify(discriminatorValue)}`,
      ctx,
    );
  }
}

// Intersection schema - must match all schemas
export class IntersectionSchema<
  A extends BaseSchema<any, any>,
  B extends BaseSchema<any, any>,
> extends BaseSchema<A["_output"] & B["_output"], A["_input"] & B["_input"]> {
  constructor(
    private _left: A,
    private _right: B,
  ) {
    super();
  }

  _parse(data: unknown, ctx: ParseContext): A["_output"] & B["_output"] {
    const leftResult = this._left._parse(data, ctx);
    const rightResult = this._right._parse(data, ctx);

    // Merge results (for objects)
    if (
      typeof leftResult === "object" &&
      leftResult !== null &&
      typeof rightResult === "object" &&
      rightResult !== null
    ) {
      return { ...leftResult, ...rightResult };
    }

    // For non-objects, just return the data if both pass
    return data as A["_output"] & B["_output"];
  }
}
