// Coercion schemas - convert input types before validation

import { BaseSchema } from './base';
import { ParseContext } from './types';
import { StringSchema, NumberSchema, BooleanSchema, BigIntSchema, DateSchema } from './primitives';

// Coerce to string
export class CoerceStringSchema extends StringSchema {
  _parse(data: unknown, ctx: ParseContext): string {
    // Coerce to string first
    const coerced = String(data);
    // Then run normal string validation
    return super._parse(coerced, ctx);
  }
}

// Coerce to number
export class CoerceNumberSchema extends NumberSchema {
  _parse(data: unknown, ctx: ParseContext): number {
    // Coerce to number first
    const coerced = Number(data);
    // Then run normal number validation
    return super._parse(coerced, ctx);
  }
}

// Coerce to boolean
export class CoerceBooleanSchema extends BooleanSchema {
  _parse(data: unknown, ctx: ParseContext): boolean {
    // Coerce to boolean first
    const coerced = Boolean(data);
    // Then run normal boolean validation
    return super._parse(coerced, ctx);
  }
}

// Coerce to bigint
export class CoerceBigIntSchema extends BigIntSchema {
  _parse(data: unknown, ctx: ParseContext): bigint {
    // Coerce to bigint first
    let coerced: bigint;
    try {
      coerced = BigInt(data as any);
    } catch {
      this._fail('invalid_type', `Cannot coerce ${typeof data} to bigint`, ctx);
    }
    // Then run normal bigint validation
    return super._parse(coerced, ctx);
  }
}

// Coerce to date
export class CoerceDateSchema extends DateSchema {
  _parse(data: unknown, ctx: ParseContext): Date {
    // Coerce to date first
    let coerced: Date;
    if (data instanceof Date) {
      coerced = data;
    } else if (typeof data === 'string' || typeof data === 'number') {
      coerced = new Date(data);
    } else {
      this._fail('invalid_type', `Cannot coerce ${typeof data} to Date`, ctx);
    }
    // Then run normal date validation
    return super._parse(coerced, ctx);
  }
}

// String boolean schema (env-style parsing)
export class StringBoolSchema extends BaseSchema<boolean> {
  private _truthy: Set<string>;
  private _falsy: Set<string>;

  constructor(options?: { truthy?: string[]; falsy?: string[] }) {
    super();
    this._truthy = new Set(
      options?.truthy ?? ['true', '1', 'yes', 'on', 'y', 'enabled']
    );
    this._falsy = new Set(
      options?.falsy ?? ['false', '0', 'no', 'off', 'n', 'disabled']
    );
  }

  _parse(data: unknown, ctx: ParseContext): boolean {
    if (typeof data !== 'string') {
      this._fail('invalid_type', `Expected string, received ${typeof data}`, ctx);
    }

    const lower = data.toLowerCase();

    if (this._truthy.has(lower)) {
      return true;
    }

    if (this._falsy.has(lower)) {
      return false;
    }

    this._fail('invalid_value', `Cannot parse "${data}" as boolean`, ctx);
  }
}

// Coerce namespace for easy access
export const coerce = {
  string: () => new CoerceStringSchema(),
  number: () => new CoerceNumberSchema(),
  boolean: () => new CoerceBooleanSchema(),
  bigint: () => new CoerceBigIntSchema(),
  date: () => new CoerceDateSchema(),
};
