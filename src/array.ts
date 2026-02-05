// Array and Tuple schemas - optimized for fast iteration

import { BaseSchema } from './base';
import { ParseContext, ValidationError, Issue } from './types';

export class ArraySchema<T extends BaseSchema<any, any>> extends BaseSchema<
  T['_output'][],
  T['_input'][]
> {
  private _min?: number;
  private _max?: number;
  private _length?: number;

  constructor(private _element: T) {
    super();
  }

  get element(): T {
    return this._element;
  }

  _parse(data: unknown, ctx: ParseContext): T['_output'][] {
    if (!Array.isArray(data)) {
      this._fail('invalid_type', `Expected array, received ${typeof data}`, ctx, {
        expected: 'array',
        received: typeof data,
      });
    }

    const len = data.length;

    // Check size constraints first (cheap)
    if (this._length !== undefined && len !== this._length) {
      this._fail('invalid_length', `Array must have exactly ${this._length} elements`, ctx);
    }

    if (this._min !== undefined && len < this._min) {
      this._fail('too_small', `Array must have at least ${this._min} elements`, ctx);
    }

    if (this._max !== undefined && len > this._max) {
      this._fail('too_big', `Array must have at most ${this._max} elements`, ctx);
    }

    // Parse elements
    const output: T['_output'][] = new Array(len);
    const issues: Issue[] = [];

    for (let i = 0; i < len; i++) {
      try {
        output[i] = this._element._parse(data[i], {
          path: [...ctx.path, i],
          parent: data,
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

    return output;
  }

  private _clone(): ArraySchema<T> {
    const clone = new ArraySchema(this._element);
    clone._min = this._min;
    clone._max = this._max;
    clone._length = this._length;
    clone._errorCustomizer = this._errorCustomizer;
    return clone;
  }

  min(length: number, message?: string): ArraySchema<T> {
    const clone = this._clone();
    clone._min = length;
    if (message) clone._errorCustomizer = message;
    return clone;
  }

  max(length: number, message?: string): ArraySchema<T> {
    const clone = this._clone();
    clone._max = length;
    if (message) clone._errorCustomizer = message;
    return clone;
  }

  length(length: number, message?: string): ArraySchema<T> {
    const clone = this._clone();
    clone._length = length;
    if (message) clone._errorCustomizer = message;
    return clone;
  }

  nonempty(message?: string): ArraySchema<T> {
    return this.min(1, message ?? 'Array must not be empty');
  }
}

// Tuple schema with fixed positions
type TupleItems = [BaseSchema<any, any>, ...BaseSchema<any, any>[]];

type TupleOutput<T extends TupleItems> = {
  [K in keyof T]: T[K] extends BaseSchema<infer O, any> ? O : never;
};

type TupleInput<T extends TupleItems> = {
  [K in keyof T]: T[K] extends BaseSchema<any, infer I> ? I : never;
};

export class TupleSchema<
  T extends TupleItems,
  Rest extends BaseSchema<any, any> | null = null
> extends BaseSchema<
  Rest extends BaseSchema<any, any>
    ? [...TupleOutput<T>, ...Rest['_output'][]]
    : TupleOutput<T>,
  Rest extends BaseSchema<any, any>
    ? [...TupleInput<T>, ...Rest['_input'][]]
    : TupleInput<T>
> {
  constructor(
    private _items: T,
    private _rest: Rest = null as Rest
  ) {
    super();
  }

  get items(): T {
    return this._items;
  }

  _parse(data: unknown, ctx: ParseContext): any {
    if (!Array.isArray(data)) {
      this._fail('invalid_type', `Expected array, received ${typeof data}`, ctx, {
        expected: 'array',
        received: typeof data,
      });
    }

    const itemCount = this._items.length;

    // Check length constraints
    if (this._rest === null) {
      if (data.length !== itemCount) {
        this._fail(
          'invalid_length',
          `Expected array of length ${itemCount}, received ${data.length}`,
          ctx
        );
      }
    } else {
      if (data.length < itemCount) {
        this._fail(
          'too_small',
          `Expected at least ${itemCount} elements, received ${data.length}`,
          ctx
        );
      }
    }

    const output: unknown[] = new Array(data.length);
    const issues: Issue[] = [];

    // Parse fixed items
    for (let i = 0; i < itemCount; i++) {
      try {
        output[i] = this._items[i]._parse(data[i], {
          path: [...ctx.path, i],
          parent: data,
        });
      } catch (e) {
        if (e instanceof ValidationError) {
          issues.push(...e.issues);
        } else {
          throw e;
        }
      }
    }

    // Parse rest items
    if (this._rest !== null) {
      for (let i = itemCount; i < data.length; i++) {
        try {
          output[i] = this._rest._parse(data[i], {
            path: [...ctx.path, i],
            parent: data,
          });
        } catch (e) {
          if (e instanceof ValidationError) {
            issues.push(...e.issues);
          } else {
            throw e;
          }
        }
      }
    }

    if (issues.length > 0) {
      throw new ValidationError(issues);
    }

    return output;
  }

  rest<R extends BaseSchema<any, any>>(schema: R): TupleSchema<T, R> {
    return new TupleSchema(this._items, schema);
  }
}
