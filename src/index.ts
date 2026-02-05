// Fast Zod Clone - Main Entry Point
// A high-performance schema validation library inspired by Zod v4

// Re-export types
export { ValidationError } from "./types";
export type { Issue, ParseContext, ParseResult, Infer, Input } from "./types";

// Re-export base
export { BaseSchema } from "./base";

// Import all schemas
import {
  StringSchema,
  NumberSchema,
  BooleanSchema,
  BigIntSchema,
  DateSchema,
  SymbolSchema,
  UndefinedSchema,
  NullSchema,
  VoidSchema,
  AnySchema,
  UnknownSchema,
  NeverSchema,
  NaNSchema,
} from "./primitives";

import {
  ObjectSchema,
  StrictObjectSchema,
  LooseObjectSchema,
  RecordSchema,
  MapSchema,
  SetSchema,
} from "./object";

import { ArraySchema, TupleSchema } from "./array";

import {
  LiteralSchema,
  EnumSchema,
  NativeEnumSchema,
  UnionSchema,
  DiscriminatedUnionSchema,
  IntersectionSchema,
} from "./enum";

import { coerce, StringBoolSchema } from "./coerce";

import {
  EmailSchema,
  UuidSchema,
  GuidSchema,
  UrlSchema,
  UlidSchema,
  CuidSchema,
  Cuid2Schema,
  NanoidSchema,
  Ipv4Schema,
  Ipv6Schema,
  Base64Schema,
  Base64UrlSchema,
  EmojiSchema,
  JwtSchema,
  iso,
} from "./string-formats";

// Schema factory functions
export function string() {
  return new StringSchema();
}

export function number() {
  return new NumberSchema();
}

export function boolean() {
  return new BooleanSchema();
}

export function bigint() {
  return new BigIntSchema();
}

export function date() {
  return new DateSchema();
}

export function symbol() {
  return new SymbolSchema();
}

export const undefined_ = () => new UndefinedSchema();
export { undefined_ as undefined };

export const null_ = () => new NullSchema();
export { null_ as null };

export const void_ = () => new VoidSchema();
export { void_ as void };

export function any() {
  return new AnySchema();
}

export function unknown() {
  return new UnknownSchema();
}

export function never() {
  return new NeverSchema();
}

export function nan() {
  return new NaNSchema();
}

// Schema constraint type that avoids deep method checking
type SchemaLike = {
  _output: any;
  _input: any;
  _parse: (data: unknown, ctx: any) => any;
};

// Helper types for object output/input inference
type InferObjectOutput<T extends Record<string, SchemaLike>> = {
  [K in keyof T]: T[K]["_output"];
};
type InferObjectInput<T extends Record<string, SchemaLike>> = {
  [K in keyof T]: T[K]["_input"];
};

// Complex types
export function object<T extends Record<string, SchemaLike>>(
  shape: T,
): ObjectSchema<{
  [K in keyof T]: BaseSchema<T[K]["_output"], T[K]["_input"]>;
}> {
  return new ObjectSchema(shape as any);
}

export function strictObject<T extends Record<string, SchemaLike>>(
  shape: T,
): StrictObjectSchema<{
  [K in keyof T]: BaseSchema<T[K]["_output"], T[K]["_input"]>;
}> {
  return new StrictObjectSchema(shape as any);
}

export function looseObject<T extends Record<string, SchemaLike>>(
  shape: T,
): LooseObjectSchema<{
  [K in keyof T]: BaseSchema<T[K]["_output"], T[K]["_input"]>;
}> {
  return new LooseObjectSchema(shape as any);
}

export function array<T extends SchemaLike>(
  element: T,
): ArraySchema<BaseSchema<T["_output"], T["_input"]>> {
  return new ArraySchema(element as any);
}

export function tuple<T extends [SchemaLike, ...SchemaLike[]]>(
  items: T,
): TupleSchema<
  {
    [K in keyof T]: BaseSchema<
      T[K] extends SchemaLike ? T[K]["_output"] : never,
      T[K] extends SchemaLike ? T[K]["_input"] : never
    >;
  } & [BaseSchema<any, any>, ...BaseSchema<any, any>[]]
> {
  return new TupleSchema(items as any);
}

export function record<V extends SchemaLike>(
  valueSchema: V,
): RecordSchema<
  BaseSchema<string, string>,
  BaseSchema<V["_output"], V["_input"]>
>;
export function record<K extends SchemaLike, V extends SchemaLike>(
  keySchema: K,
  valueSchema: V,
): RecordSchema<
  BaseSchema<K["_output"], K["_input"]>,
  BaseSchema<V["_output"], V["_input"]>
>;
export function record(
  keyOrValue: SchemaLike,
  valueSchema?: SchemaLike,
): RecordSchema<any, any> {
  if (valueSchema === undefined) {
    return new RecordSchema(
      new StringSchema() as unknown as BaseSchema<string, string>,
      keyOrValue as unknown as BaseSchema<any, any>,
    );
  }
  return new RecordSchema(
    keyOrValue as unknown as BaseSchema<any, any>,
    valueSchema as unknown as BaseSchema<any, any>,
  );
}

export function map<K extends SchemaLike, V extends SchemaLike>(
  keySchema: K,
  valueSchema: V,
) {
  return new MapSchema(
    keySchema as unknown as BaseSchema<any, any>,
    valueSchema as unknown as BaseSchema<any, any>,
  );
}

export function set<T extends SchemaLike>(valueSchema: T) {
  return new SetSchema(valueSchema as unknown as BaseSchema<any, any>);
}

// Union and enum types
export function literal<
  T extends string | number | boolean | bigint | null | undefined,
>(value: T): LiteralSchema<T>;
export function literal<
  T extends (string | number | boolean | bigint | null | undefined)[],
>(values: T): LiteralSchema<T>;
export function literal(value: any) {
  return new LiteralSchema(value);
}

export const enum_ = <T extends readonly string[] | string[]>(values: T) =>
  new EnumSchema(values);
export { enum_ as enum };

export function nativeEnum<T extends Record<string, string | number>>(
  enumObj: T,
) {
  return new NativeEnumSchema(enumObj);
}

export function union<T extends readonly [SchemaLike, ...SchemaLike[]]>(
  options: T,
) {
  return new UnionSchema(
    options as unknown as readonly [
      BaseSchema<any, any>,
      ...BaseSchema<any, any>[],
    ],
  );
}

export function discriminatedUnion<
  D extends string,
  T extends readonly [SchemaLike, ...SchemaLike[]],
>(discriminator: D, options: T) {
  return new DiscriminatedUnionSchema(
    discriminator,
    options as unknown as readonly [
      BaseSchema<any, any>,
      ...BaseSchema<any, any>[],
    ],
  );
}

export function intersection<A extends SchemaLike, B extends SchemaLike>(
  left: A,
  right: B,
) {
  return new IntersectionSchema(
    left as unknown as BaseSchema<any, any>,
    right as unknown as BaseSchema<any, any>,
  );
}

// Utility functions
export function lazy<T extends BaseSchema<any, any>>(getter: () => T): T {
  // Create a proxy that lazily evaluates the schema
  let cached: T | undefined;

  const handler: ProxyHandler<BaseSchema<any, any>> = {
    get(_, prop) {
      if (!cached) {
        cached = getter();
      }
      const value = (cached as any)[prop];
      if (typeof value === "function") {
        return value.bind(cached);
      }
      return value;
    },
  };

  return new Proxy({} as any, handler) as T;
}

export function preprocess<T extends BaseSchema<any, any>>(
  fn: (data: unknown) => unknown,
  schema: T,
): T {
  const original = schema._parse.bind(schema);
  (schema as any)._parse = function (data: unknown, ctx: any) {
    return original(fn(data), ctx);
  };
  return schema;
}

// Transform standalone
import { BaseSchema } from "./base";

export function transform<Input, Output>(fn: (data: Input) => Output) {
  return new TransformOnlySchema(fn);
}

class TransformOnlySchema<I, O> extends BaseSchema<O, I> {
  constructor(private _fn: (data: I) => O) {
    super();
  }

  _parse(data: unknown, _ctx: any): O {
    return this._fn(data as I);
  }
}

// Coercion
export { coerce };

// String bool
export function stringbool(options?: { truthy?: string[]; falsy?: string[] }) {
  return new StringBoolSchema(options);
}

// String format validators (top-level, Zod v4 style)
export function email() {
  return new EmailSchema();
}

export function uuid() {
  return new UuidSchema();
}

export function guid() {
  return new GuidSchema();
}

export function url() {
  return new UrlSchema();
}

export function ulid() {
  return new UlidSchema();
}

export function cuid() {
  return new CuidSchema();
}

export function cuid2() {
  return new Cuid2Schema();
}

export function nanoid() {
  return new NanoidSchema();
}

export function ipv4() {
  return new Ipv4Schema();
}

export function ipv6() {
  return new Ipv6Schema();
}

export function base64() {
  return new Base64Schema();
}

export function base64url() {
  return new Base64UrlSchema();
}

export function emoji() {
  return new EmojiSchema();
}

export function jwt() {
  return new JwtSchema();
}

// ISO date/time
export { iso };

// Utility types
export type infer<T extends { _output: any }> = T["_output"];
export type input<T extends { _input: any }> = T["_input"];
export type output<T extends { _output: any }> = T["_output"];

// Pretty error formatting
export function prettifyError(error: ValidationError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
      return `  ✖ ${path}${issue.message}`;
    })
    .join("\n");
}

// Re-export ValidationError for convenience
import { ValidationError } from "./types";
export { ValidationError as ZodError };

// Default export as 'z' namespace
const z: {
  string: typeof string;
  number: typeof number;
  boolean: typeof boolean;
  bigint: typeof bigint;
  date: typeof date;
  symbol: typeof symbol;
  undefined: typeof undefined_;
  null: typeof null_;
  void: typeof void_;
  any: typeof any;
  unknown: typeof unknown;
  never: typeof never;
  nan: typeof nan;
  object: typeof object;
  strictObject: typeof strictObject;
  looseObject: typeof looseObject;
  array: typeof array;
  tuple: typeof tuple;
  record: typeof record;
  map: typeof map;
  set: typeof set;
  literal: typeof literal;
  enum: typeof enum_;
  nativeEnum: typeof nativeEnum;
  union: typeof union;
  discriminatedUnion: typeof discriminatedUnion;
  intersection: typeof intersection;
  lazy: typeof lazy;
  preprocess: typeof preprocess;
  transform: typeof transform;
  coerce: typeof coerce;
  stringbool: typeof stringbool;
  email: typeof email;
  uuid: typeof uuid;
  guid: typeof guid;
  url: typeof url;
  ulid: typeof ulid;
  cuid: typeof cuid;
  cuid2: typeof cuid2;
  nanoid: typeof nanoid;
  ipv4: typeof ipv4;
  ipv6: typeof ipv6;
  base64: typeof base64;
  base64url: typeof base64url;
  emoji: typeof emoji;
  jwt: typeof jwt;
  iso: typeof iso;
  prettifyError: typeof prettifyError;
  ZodError: typeof ValidationError;
} = {
  // Primitives
  string,
  number,
  boolean,
  bigint,
  date,
  symbol,
  undefined: undefined_,
  null: null_,
  void: void_,
  any,
  unknown,
  never,
  nan,

  // Complex types
  object,
  strictObject,
  looseObject,
  array,
  tuple,
  record,
  map,
  set,

  // Unions and enums
  literal,
  enum: enum_,
  nativeEnum,
  union,
  discriminatedUnion,
  intersection,

  // Utilities
  lazy,
  preprocess,
  transform,
  coerce,
  stringbool,

  // String formats
  email,
  uuid,
  guid,
  url,
  ulid,
  cuid,
  cuid2,
  nanoid,
  ipv4,
  ipv6,
  base64,
  base64url,
  emoji,
  jwt,
  iso,

  // Error handling
  prettifyError,
  ZodError: ValidationError,
};

export default z;
