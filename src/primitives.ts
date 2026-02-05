// Primitive type schemas - optimized for speed

import { BaseSchema } from './base';
import { ParseContext } from './types';

// String schema with all validations
export class StringSchema extends BaseSchema<string> {
  private _min?: number;
  private _max?: number;
  private _length?: number;
  private _regex?: RegExp;
  private _includes?: string;
  private _startsWith?: string;
  private _endsWith?: string;
  private _trim = false;
  private _toLowerCase = false;
  private _toUpperCase = false;

  _parse(data: unknown, ctx: ParseContext): string {
    if (typeof data !== 'string') {
      this._fail('invalid_type', `Expected string, received ${typeof data}`, ctx, {
        expected: 'string',
        received: typeof data,
      });
    }

    let str = data;

    // Apply transformations first (if any)
    if (this._trim) str = str.trim();
    if (this._toLowerCase) str = str.toLowerCase();
    if (this._toUpperCase) str = str.toUpperCase();

    // Validations - check in optimal order (cheapest first)
    const len = str.length;

    if (this._length !== undefined && len !== this._length) {
      this._fail('invalid_length', `String must be exactly ${this._length} characters`, ctx);
    }

    if (this._min !== undefined && len < this._min) {
      this._fail('too_small', `String must be at least ${this._min} characters`, ctx);
    }

    if (this._max !== undefined && len > this._max) {
      this._fail('too_big', `String must be at most ${this._max} characters`, ctx);
    }

    if (this._startsWith !== undefined && !str.startsWith(this._startsWith)) {
      this._fail('invalid_string', `String must start with "${this._startsWith}"`, ctx);
    }

    if (this._endsWith !== undefined && !str.endsWith(this._endsWith)) {
      this._fail('invalid_string', `String must end with "${this._endsWith}"`, ctx);
    }

    if (this._includes !== undefined && !str.includes(this._includes)) {
      this._fail('invalid_string', `String must include "${this._includes}"`, ctx);
    }

    if (this._regex !== undefined && !this._regex.test(str)) {
      this._fail('invalid_string', `String must match pattern ${this._regex}`, ctx);
    }

    return str;
  }

  // Chainable validators - return new instance for immutability
  private _clone(): StringSchema {
    const clone = new StringSchema();
    clone._min = this._min;
    clone._max = this._max;
    clone._length = this._length;
    clone._regex = this._regex;
    clone._includes = this._includes;
    clone._startsWith = this._startsWith;
    clone._endsWith = this._endsWith;
    clone._trim = this._trim;
    clone._toLowerCase = this._toLowerCase;
    clone._toUpperCase = this._toUpperCase;
    clone._errorCustomizer = this._errorCustomizer;
    return clone;
  }

  min(length: number, message?: string): StringSchema {
    const clone = this._clone();
    clone._min = length;
    if (message) clone._errorCustomizer = message;
    return clone;
  }

  max(length: number, message?: string): StringSchema {
    const clone = this._clone();
    clone._max = length;
    if (message) clone._errorCustomizer = message;
    return clone;
  }

  length(length: number, message?: string): StringSchema {
    const clone = this._clone();
    clone._length = length;
    if (message) clone._errorCustomizer = message;
    return clone;
  }

  regex(pattern: RegExp, message?: string): StringSchema {
    const clone = this._clone();
    clone._regex = pattern;
    if (message) clone._errorCustomizer = message;
    return clone;
  }

  includes(str: string, message?: string): StringSchema {
    const clone = this._clone();
    clone._includes = str;
    if (message) clone._errorCustomizer = message;
    return clone;
  }

  startsWith(str: string, message?: string): StringSchema {
    const clone = this._clone();
    clone._startsWith = str;
    if (message) clone._errorCustomizer = message;
    return clone;
  }

  endsWith(str: string, message?: string): StringSchema {
    const clone = this._clone();
    clone._endsWith = str;
    if (message) clone._errorCustomizer = message;
    return clone;
  }

  trim(): StringSchema {
    const clone = this._clone();
    clone._trim = true;
    return clone;
  }

  toLowerCase(): StringSchema {
    const clone = this._clone();
    clone._toLowerCase = true;
    return clone;
  }

  toUpperCase(): StringSchema {
    const clone = this._clone();
    clone._toUpperCase = true;
    return clone;
  }

  nonempty(message?: string): StringSchema {
    return this.min(1, message ?? 'String must not be empty');
  }
}

// Number schema
export class NumberSchema extends BaseSchema<number> {
  private _min?: number;
  private _max?: number;
  private _int = false;
  private _positive = false;
  private _negative = false;
  private _nonnegative = false;
  private _nonpositive = false;
  private _finite = false;
  private _multipleOf?: number;

  _parse(data: unknown, ctx: ParseContext): number {
    if (typeof data !== 'number') {
      this._fail('invalid_type', `Expected number, received ${typeof data}`, ctx, {
        expected: 'number',
        received: typeof data,
      });
    }

    if (Number.isNaN(data)) {
      this._fail('invalid_type', 'Expected number, received NaN', ctx);
    }

    // Validations
    if (this._finite && !Number.isFinite(data)) {
      this._fail('not_finite', 'Number must be finite', ctx);
    }

    if (this._int && !Number.isInteger(data)) {
      this._fail('invalid_type', 'Expected integer', ctx);
    }

    if (this._positive && data <= 0) {
      this._fail('too_small', 'Number must be positive', ctx);
    }

    if (this._negative && data >= 0) {
      this._fail('too_big', 'Number must be negative', ctx);
    }

    if (this._nonnegative && data < 0) {
      this._fail('too_small', 'Number must be non-negative', ctx);
    }

    if (this._nonpositive && data > 0) {
      this._fail('too_big', 'Number must be non-positive', ctx);
    }

    if (this._min !== undefined && data < this._min) {
      this._fail('too_small', `Number must be >= ${this._min}`, ctx);
    }

    if (this._max !== undefined && data > this._max) {
      this._fail('too_big', `Number must be <= ${this._max}`, ctx);
    }

    if (this._multipleOf !== undefined && data % this._multipleOf !== 0) {
      this._fail('not_multiple_of', `Number must be a multiple of ${this._multipleOf}`, ctx);
    }

    return data;
  }

  private _clone(): NumberSchema {
    const clone = new NumberSchema();
    clone._min = this._min;
    clone._max = this._max;
    clone._int = this._int;
    clone._positive = this._positive;
    clone._negative = this._negative;
    clone._nonnegative = this._nonnegative;
    clone._nonpositive = this._nonpositive;
    clone._finite = this._finite;
    clone._multipleOf = this._multipleOf;
    clone._errorCustomizer = this._errorCustomizer;
    return clone;
  }

  min(value: number, message?: string): NumberSchema {
    const clone = this._clone();
    clone._min = value;
    if (message) clone._errorCustomizer = message;
    return clone;
  }

  max(value: number, message?: string): NumberSchema {
    const clone = this._clone();
    clone._max = value;
    if (message) clone._errorCustomizer = message;
    return clone;
  }

  gte(value: number, message?: string): NumberSchema {
    return this.min(value, message);
  }

  lte(value: number, message?: string): NumberSchema {
    return this.max(value, message);
  }

  gt(value: number, message?: string): NumberSchema {
    const clone = this._clone();
    clone._min = value + Number.EPSILON;
    if (message) clone._errorCustomizer = message;
    return clone;
  }

  lt(value: number, message?: string): NumberSchema {
    const clone = this._clone();
    clone._max = value - Number.EPSILON;
    if (message) clone._errorCustomizer = message;
    return clone;
  }

  int(message?: string): NumberSchema {
    const clone = this._clone();
    clone._int = true;
    if (message) clone._errorCustomizer = message;
    return clone;
  }

  positive(message?: string): NumberSchema {
    const clone = this._clone();
    clone._positive = true;
    if (message) clone._errorCustomizer = message;
    return clone;
  }

  negative(message?: string): NumberSchema {
    const clone = this._clone();
    clone._negative = true;
    if (message) clone._errorCustomizer = message;
    return clone;
  }

  nonnegative(message?: string): NumberSchema {
    const clone = this._clone();
    clone._nonnegative = true;
    if (message) clone._errorCustomizer = message;
    return clone;
  }

  nonpositive(message?: string): NumberSchema {
    const clone = this._clone();
    clone._nonpositive = true;
    if (message) clone._errorCustomizer = message;
    return clone;
  }

  finite(message?: string): NumberSchema {
    const clone = this._clone();
    clone._finite = true;
    if (message) clone._errorCustomizer = message;
    return clone;
  }

  multipleOf(value: number, message?: string): NumberSchema {
    const clone = this._clone();
    clone._multipleOf = value;
    if (message) clone._errorCustomizer = message;
    return clone;
  }

  step(value: number, message?: string): NumberSchema {
    return this.multipleOf(value, message);
  }
}

// Boolean schema
export class BooleanSchema extends BaseSchema<boolean> {
  _parse(data: unknown, ctx: ParseContext): boolean {
    if (typeof data !== 'boolean') {
      this._fail('invalid_type', `Expected boolean, received ${typeof data}`, ctx, {
        expected: 'boolean',
        received: typeof data,
      });
    }
    return data;
  }
}

// BigInt schema
export class BigIntSchema extends BaseSchema<bigint> {
  private _min?: bigint;
  private _max?: bigint;
  private _positive = false;
  private _negative = false;
  private _nonnegative = false;
  private _nonpositive = false;

  _parse(data: unknown, ctx: ParseContext): bigint {
    if (typeof data !== 'bigint') {
      this._fail('invalid_type', `Expected bigint, received ${typeof data}`, ctx, {
        expected: 'bigint',
        received: typeof data,
      });
    }

    if (this._positive && data <= 0n) {
      this._fail('too_small', 'BigInt must be positive', ctx);
    }

    if (this._negative && data >= 0n) {
      this._fail('too_big', 'BigInt must be negative', ctx);
    }

    if (this._nonnegative && data < 0n) {
      this._fail('too_small', 'BigInt must be non-negative', ctx);
    }

    if (this._nonpositive && data > 0n) {
      this._fail('too_big', 'BigInt must be non-positive', ctx);
    }

    if (this._min !== undefined && data < this._min) {
      this._fail('too_small', `BigInt must be >= ${this._min}`, ctx);
    }

    if (this._max !== undefined && data > this._max) {
      this._fail('too_big', `BigInt must be <= ${this._max}`, ctx);
    }

    return data;
  }

  private _clone(): BigIntSchema {
    const clone = new BigIntSchema();
    clone._min = this._min;
    clone._max = this._max;
    clone._positive = this._positive;
    clone._negative = this._negative;
    clone._nonnegative = this._nonnegative;
    clone._nonpositive = this._nonpositive;
    clone._errorCustomizer = this._errorCustomizer;
    return clone;
  }

  min(value: bigint): BigIntSchema {
    const clone = this._clone();
    clone._min = value;
    return clone;
  }

  max(value: bigint): BigIntSchema {
    const clone = this._clone();
    clone._max = value;
    return clone;
  }

  positive(): BigIntSchema {
    const clone = this._clone();
    clone._positive = true;
    return clone;
  }

  negative(): BigIntSchema {
    const clone = this._clone();
    clone._negative = true;
    return clone;
  }

  nonnegative(): BigIntSchema {
    const clone = this._clone();
    clone._nonnegative = true;
    return clone;
  }

  nonpositive(): BigIntSchema {
    const clone = this._clone();
    clone._nonpositive = true;
    return clone;
  }
}

// Date schema
export class DateSchema extends BaseSchema<Date> {
  private _min?: Date;
  private _max?: Date;

  _parse(data: unknown, ctx: ParseContext): Date {
    if (!(data instanceof Date)) {
      this._fail('invalid_type', `Expected Date, received ${typeof data}`, ctx, {
        expected: 'Date',
        received: typeof data,
      });
    }

    if (Number.isNaN(data.getTime())) {
      this._fail('invalid_date', 'Invalid date', ctx);
    }

    if (this._min !== undefined && data < this._min) {
      this._fail('too_small', `Date must be >= ${this._min.toISOString()}`, ctx);
    }

    if (this._max !== undefined && data > this._max) {
      this._fail('too_big', `Date must be <= ${this._max.toISOString()}`, ctx);
    }

    return data;
  }

  private _clone(): DateSchema {
    const clone = new DateSchema();
    clone._min = this._min;
    clone._max = this._max;
    clone._errorCustomizer = this._errorCustomizer;
    return clone;
  }

  min(date: Date): DateSchema {
    const clone = this._clone();
    clone._min = date;
    return clone;
  }

  max(date: Date): DateSchema {
    const clone = this._clone();
    clone._max = date;
    return clone;
  }
}

// Symbol schema
export class SymbolSchema extends BaseSchema<symbol> {
  _parse(data: unknown, ctx: ParseContext): symbol {
    if (typeof data !== 'symbol') {
      this._fail('invalid_type', `Expected symbol, received ${typeof data}`, ctx, {
        expected: 'symbol',
        received: typeof data,
      });
    }
    return data;
  }
}

// Undefined schema
export class UndefinedSchema extends BaseSchema<undefined> {
  _parse(data: unknown, ctx: ParseContext): undefined {
    if (data !== undefined) {
      this._fail('invalid_type', `Expected undefined, received ${typeof data}`, ctx, {
        expected: 'undefined',
        received: typeof data,
      });
    }
    return data;
  }
}

// Null schema
export class NullSchema extends BaseSchema<null> {
  _parse(data: unknown, ctx: ParseContext): null {
    if (data !== null) {
      this._fail('invalid_type', `Expected null, received ${typeof data}`, ctx, {
        expected: 'null',
        received: typeof data,
      });
    }
    return data;
  }
}

// Void schema (undefined)
export class VoidSchema extends BaseSchema<void> {
  _parse(data: unknown, ctx: ParseContext): void {
    if (data !== undefined) {
      this._fail('invalid_type', `Expected void (undefined), received ${typeof data}`, ctx, {
        expected: 'void',
        received: typeof data,
      });
    }
    return data;
  }
}

// Any schema
export class AnySchema extends BaseSchema<any> {
  _parse(data: unknown, _ctx: ParseContext): any {
    return data;
  }
}

// Unknown schema
export class UnknownSchema extends BaseSchema<unknown> {
  _parse(data: unknown, _ctx: ParseContext): unknown {
    return data;
  }
}

// Never schema
export class NeverSchema extends BaseSchema<never> {
  _parse(_data: unknown, ctx: ParseContext): never {
    this._fail('invalid_type', 'Never type cannot have any value', ctx);
  }
}

// NaN schema
export class NaNSchema extends BaseSchema<number> {
  _parse(data: unknown, ctx: ParseContext): number {
    if (typeof data !== 'number' || !Number.isNaN(data)) {
      this._fail('invalid_type', 'Expected NaN', ctx, {
        expected: 'NaN',
        received: String(data),
      });
    }
    return data;
  }
}
