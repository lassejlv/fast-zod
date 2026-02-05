// Base schema class - optimized for performance

import { ValidationError, Issue, ParseContext, ParseResult, ErrorCustomizer } from './types';

export abstract class BaseSchema<Output, Input = Output> {
  // These are phantom types for inference - never actually used at runtime
  declare readonly _output: Output;
  declare readonly _input: Input;

  protected _errorCustomizer?: ErrorCustomizer;

  // Abstract method that subclasses implement
  abstract _parse(data: unknown, ctx: ParseContext): Output;

  // Main parse method - throws on failure
  parse(data: unknown): Output {
    return this._parse(data, { path: [] });
  }

  // Safe parse - returns result object
  safeParse(data: unknown): ParseResult<Output> {
    try {
      const result = this._parse(data, { path: [] });
      return { success: true, data: result };
    } catch (e) {
      if (e instanceof ValidationError) {
        return { success: false, error: e };
      }
      throw e;
    }
  }

  // Async versions
  async parseAsync(data: unknown): Promise<Output> {
    return this.parse(data);
  }

  async safeParseAsync(data: unknown): Promise<ParseResult<Output>> {
    return this.safeParse(data);
  }

  // Error helper - inlined for performance
  protected _fail(code: string, message: string, ctx: ParseContext, extra?: Partial<Issue>): never {
    let finalMessage = message;
    if (this._errorCustomizer) {
      if (typeof this._errorCustomizer === 'string') {
        finalMessage = this._errorCustomizer;
      } else {
        const custom = this._errorCustomizer({ code, path: ctx.path, message, ...extra });
        if (custom) finalMessage = custom;
      }
    }
    throw ValidationError.fromIssue({
      code,
      path: ctx.path,
      message: finalMessage,
      ...extra,
    });
  }

  // Error customization
  error(customizer: ErrorCustomizer): this {
    const clone = Object.create(Object.getPrototypeOf(this));
    Object.assign(clone, this);
    clone._errorCustomizer = customizer;
    return clone;
  }

  // Modifiers return wrapper schemas
  optional(): OptionalSchema<this> {
    return new OptionalSchema(this);
  }

  nullable(): NullableSchema<this> {
    return new NullableSchema(this);
  }

  nullish(): NullishSchema<this> {
    return new NullishSchema(this);
  }

  default(value: Output | (() => Output)): DefaultSchema<this, Output> {
    return new DefaultSchema(this, value);
  }

  catch(value: Output | (() => Output)): CatchSchema<this, Output> {
    return new CatchSchema(this, value);
  }

  transform<NewOutput>(fn: (data: Output) => NewOutput): TransformSchema<this, NewOutput> {
    return new TransformSchema(this, fn);
  }

  refine(
    fn: (data: Output) => boolean,
    message: string | { message: string } = 'Invalid value'
  ): RefineSchema<this> {
    const msg = typeof message === 'string' ? message : message.message;
    return new RefineSchema(this, fn, msg);
  }

  // Pipe to another schema
  pipe<T extends BaseSchema<any, Output>>(schema: T): PipeSchema<this, T> {
    return new PipeSchema(this, schema);
  }
}

// Wrapper schemas for modifiers

class OptionalSchema<T extends BaseSchema<any, any>> extends BaseSchema<
  T['_output'] | undefined,
  T['_input'] | undefined
> {
  constructor(private _inner: T) {
    super();
  }

  _parse(data: unknown, ctx: ParseContext): T['_output'] | undefined {
    if (data === undefined) return undefined;
    return this._inner._parse(data, ctx);
  }

  unwrap(): T {
    return this._inner;
  }
}

class NullableSchema<T extends BaseSchema<any, any>> extends BaseSchema<
  T['_output'] | null,
  T['_input'] | null
> {
  constructor(private _inner: T) {
    super();
  }

  _parse(data: unknown, ctx: ParseContext): T['_output'] | null {
    if (data === null) return null;
    return this._inner._parse(data, ctx);
  }

  unwrap(): T {
    return this._inner;
  }
}

class NullishSchema<T extends BaseSchema<any, any>> extends BaseSchema<
  T['_output'] | null | undefined,
  T['_input'] | null | undefined
> {
  constructor(private _inner: T) {
    super();
  }

  _parse(data: unknown, ctx: ParseContext): T['_output'] | null | undefined {
    if (data === null || data === undefined) return data;
    return this._inner._parse(data, ctx);
  }

  unwrap(): T {
    return this._inner;
  }
}

class DefaultSchema<T extends BaseSchema<any, any>, D> extends BaseSchema<
  T['_output'],
  T['_input'] | undefined
> {
  constructor(
    private _inner: T,
    private _default: D | (() => D)
  ) {
    super();
  }

  _parse(data: unknown, ctx: ParseContext): T['_output'] {
    if (data === undefined) {
      const def = this._default;
      return typeof def === 'function' ? (def as () => D)() : def;
    }
    return this._inner._parse(data, ctx);
  }

  unwrap(): T {
    return this._inner;
  }
}

class CatchSchema<T extends BaseSchema<any, any>, D> extends BaseSchema<
  T['_output'],
  T['_input']
> {
  constructor(
    private _inner: T,
    private _catch: D | (() => D)
  ) {
    super();
  }

  _parse(data: unknown, ctx: ParseContext): T['_output'] {
    try {
      return this._inner._parse(data, ctx);
    } catch {
      const c = this._catch;
      return typeof c === 'function' ? (c as () => D)() : c;
    }
  }

  unwrap(): T {
    return this._inner;
  }
}

class TransformSchema<T extends BaseSchema<any, any>, Output> extends BaseSchema<
  Output,
  T['_input']
> {
  constructor(
    private _inner: T,
    private _transform: (data: T['_output']) => Output
  ) {
    super();
  }

  _parse(data: unknown, ctx: ParseContext): Output {
    const parsed = this._inner._parse(data, ctx);
    return this._transform(parsed);
  }
}

class RefineSchema<T extends BaseSchema<any, any>> extends BaseSchema<
  T['_output'],
  T['_input']
> {
  constructor(
    private _inner: T,
    private _refine: (data: T['_output']) => boolean,
    private _message: string
  ) {
    super();
  }

  _parse(data: unknown, ctx: ParseContext): T['_output'] {
    const parsed = this._inner._parse(data, ctx);
    if (!this._refine(parsed)) {
      this._fail('custom', this._message, ctx);
    }
    return parsed;
  }
}

class PipeSchema<
  A extends BaseSchema<any, any>,
  B extends BaseSchema<any, A['_output']>
> extends BaseSchema<B['_output'], A['_input']> {
  constructor(
    private _first: A,
    private _second: B
  ) {
    super();
  }

  _parse(data: unknown, ctx: ParseContext): B['_output'] {
    const first = this._first._parse(data, ctx);
    return this._second._parse(first, ctx);
  }
}

export {
  OptionalSchema,
  NullableSchema,
  NullishSchema,
  DefaultSchema,
  CatchSchema,
  TransformSchema,
  RefineSchema,
  PipeSchema,
};
