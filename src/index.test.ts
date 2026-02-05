import { test, expect, describe } from "bun:test";
import z from "./index";

describe("Primitives", () => {
  describe("string", () => {
    test("parses valid strings", () => {
      expect(z.string().parse("hello")).toBe("hello");
      expect(z.string().parse("")).toBe("");
    });

    test("rejects non-strings", () => {
      expect(() => z.string().parse(123)).toThrow();
      expect(() => z.string().parse(null)).toThrow();
      expect(() => z.string().parse(undefined)).toThrow();
    });

    test("min/max length", () => {
      const schema = z.string().min(2).max(5);
      expect(schema.parse("abc")).toBe("abc");
      expect(() => schema.parse("a")).toThrow();
      expect(() => schema.parse("abcdef")).toThrow();
    });

    test("regex", () => {
      const schema = z.string().regex(/^[a-z]+$/);
      expect(schema.parse("hello")).toBe("hello");
      expect(() => schema.parse("Hello")).toThrow();
    });

    test("trim", () => {
      expect(z.string().trim().parse("  hello  ")).toBe("hello");
    });

    test("toLowerCase/toUpperCase", () => {
      expect(z.string().toLowerCase().parse("HELLO")).toBe("hello");
      expect(z.string().toUpperCase().parse("hello")).toBe("HELLO");
    });

    test("nonempty", () => {
      expect(() => z.string().nonempty().parse("")).toThrow();
      expect(z.string().nonempty().parse("a")).toBe("a");
    });
  });

  describe("number", () => {
    test("parses valid numbers", () => {
      expect(z.number().parse(42)).toBe(42);
      expect(z.number().parse(3.14)).toBe(3.14);
      expect(z.number().parse(-10)).toBe(-10);
    });

    test("rejects non-numbers", () => {
      expect(() => z.number().parse("42")).toThrow();
      expect(() => z.number().parse(NaN)).toThrow();
    });

    test("min/max", () => {
      const schema = z.number().min(0).max(100);
      expect(schema.parse(50)).toBe(50);
      expect(() => schema.parse(-1)).toThrow();
      expect(() => schema.parse(101)).toThrow();
    });

    test("int", () => {
      expect(z.number().int().parse(42)).toBe(42);
      expect(() => z.number().int().parse(3.14)).toThrow();
    });

    test("positive/negative", () => {
      expect(z.number().positive().parse(1)).toBe(1);
      expect(() => z.number().positive().parse(-1)).toThrow();
      expect(z.number().negative().parse(-1)).toBe(-1);
      expect(() => z.number().negative().parse(1)).toThrow();
    });

    test("multipleOf", () => {
      expect(z.number().multipleOf(5).parse(10)).toBe(10);
      expect(() => z.number().multipleOf(5).parse(7)).toThrow();
    });
  });

  describe("boolean", () => {
    test("parses booleans", () => {
      expect(z.boolean().parse(true)).toBe(true);
      expect(z.boolean().parse(false)).toBe(false);
    });

    test("rejects non-booleans", () => {
      expect(() => z.boolean().parse(1)).toThrow();
      expect(() => z.boolean().parse("true")).toThrow();
    });
  });

  describe("bigint", () => {
    test("parses bigints", () => {
      expect(z.bigint().parse(BigInt(42))).toBe(BigInt(42));
    });

    test("rejects non-bigints", () => {
      expect(() => z.bigint().parse(42)).toThrow();
    });
  });

  describe("date", () => {
    test("parses dates", () => {
      const d = new Date();
      expect(z.date().parse(d)).toBe(d);
    });

    test("rejects invalid dates", () => {
      expect(() => z.date().parse(new Date("invalid"))).toThrow();
      expect(() => z.date().parse("2021-01-01")).toThrow();
    });
  });

  describe("special types", () => {
    test("any", () => {
      expect(z.any().parse(123)).toBe(123);
      expect(z.any().parse("string")).toBe("string");
      expect(z.any().parse(null)).toBe(null);
    });

    test("unknown", () => {
      expect(z.unknown().parse(123)).toBe(123);
      expect(z.unknown().parse(null)).toBe(null);
    });

    test("null", () => {
      expect(z.null().parse(null)).toBe(null);
      expect(() => z.null().parse(undefined)).toThrow();
    });

    test("undefined", () => {
      expect(z.undefined().parse(undefined)).toBe(undefined);
      expect(() => z.undefined().parse(null)).toThrow();
    });

    test("never", () => {
      expect(() => z.never().parse(undefined)).toThrow();
      expect(() => z.never().parse(null)).toThrow();
    });
  });
});

describe("Objects", () => {
  test("parses objects", () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });
    const result = schema.parse({ name: "John", age: 30 });
    expect(result).toEqual({ name: "John", age: 30 });
  });

  test("strips unknown keys by default", () => {
    const schema = z.object({ name: z.string() });
    const result = schema.parse({ name: "John", extra: "ignored" });
    expect(result).toEqual({ name: "John" });
  });

  test("strict rejects unknown keys", () => {
    const schema = z.object({ name: z.string() }).strict();
    expect(() => schema.parse({ name: "John", extra: "fail" })).toThrow();
  });

  test("passthrough keeps unknown keys", () => {
    const schema = z.object({ name: z.string() }).passthrough();
    const result = schema.parse({ name: "John", extra: "kept" });
    expect(result).toEqual({ name: "John", extra: "kept" });
  });

  test("partial", () => {
    const schema = z
      .object({
        name: z.string(),
        age: z.number(),
      })
      .partial();
    expect(schema.parse({})).toEqual({});
    expect(schema.parse({ name: "John" })).toEqual({ name: "John" });
  });

  test("pick", () => {
    const schema = z
      .object({
        name: z.string(),
        age: z.number(),
        email: z.string(),
      })
      .pick("name", "email");
    expect(schema.parse({ name: "John", email: "john@example.com" })).toEqual({
      name: "John",
      email: "john@example.com",
    });
  });

  test("omit", () => {
    const schema = z
      .object({
        name: z.string(),
        age: z.number(),
        password: z.string(),
      })
      .omit("password");
    expect(schema.parse({ name: "John", age: 30 })).toEqual({
      name: "John",
      age: 30,
    });
  });

  test("extend", () => {
    const schema = z.object({ name: z.string() }).extend({ age: z.number() });
    expect(schema.parse({ name: "John", age: 30 })).toEqual({
      name: "John",
      age: 30,
    });
  });

  test("merge", () => {
    const a = z.object({ name: z.string() });
    const b = z.object({ age: z.number() });
    const merged = a.merge(b);
    expect(merged.parse({ name: "John", age: 30 })).toEqual({
      name: "John",
      age: 30,
    });
  });
});

describe("Arrays", () => {
  test("parses arrays", () => {
    const schema = z.array(z.number());
    expect(schema.parse([1, 2, 3])).toEqual([1, 2, 3]);
  });

  test("validates elements", () => {
    const schema = z.array(z.string());
    expect(() => schema.parse([1, 2, 3])).toThrow();
  });

  test("min/max length", () => {
    const schema = z.array(z.number()).min(2).max(4);
    expect(schema.parse([1, 2, 3])).toEqual([1, 2, 3]);
    expect(() => schema.parse([1])).toThrow();
    expect(() => schema.parse([1, 2, 3, 4, 5])).toThrow();
  });

  test("nonempty", () => {
    const schema = z.array(z.string()).nonempty();
    expect(() => schema.parse([])).toThrow();
    expect(schema.parse(["a"])).toEqual(["a"]);
  });
});

describe("Tuples", () => {
  test("parses tuples", () => {
    const schema = z.tuple([z.string(), z.number(), z.boolean()]);
    expect(schema.parse(["hello", 42, true])).toEqual(["hello", 42, true]);
  });

  test("validates exact length", () => {
    const schema = z.tuple([z.string(), z.number()]);
    expect(() => schema.parse(["hello"])).toThrow();
    expect(() => schema.parse(["hello", 42, true])).toThrow();
  });

  test("rest elements", () => {
    const schema = z.tuple([z.string()]).rest(z.number());
    expect(schema.parse(["hello", 1, 2, 3])).toEqual(["hello", 1, 2, 3]);
  });
});

describe("Enums and Unions", () => {
  test("enum", () => {
    const schema = z.enum(["apple", "banana", "cherry"]);
    expect(schema.parse("apple")).toBe("apple");
    expect(() => schema.parse("orange")).toThrow();
  });

  test("literal", () => {
    expect(z.literal("hello").parse("hello")).toBe("hello");
    expect(() => z.literal("hello").parse("world")).toThrow();
    expect(z.literal(42).parse(42)).toBe(42);
    expect(z.literal(true).parse(true)).toBe(true);
  });

  test("literal array", () => {
    const schema = z.literal([200, 201, 204]);
    expect(schema.parse(200)).toBe(200);
    expect(schema.parse(201)).toBe(201);
    expect(() => schema.parse(404)).toThrow();
  });

  test("union", () => {
    const schema = z.union([z.string(), z.number()]);
    expect(schema.parse("hello")).toBe("hello");
    expect(schema.parse(42)).toBe(42);
    expect(() => schema.parse(true)).toThrow();
  });

  test("discriminatedUnion", () => {
    const schema = z.discriminatedUnion("type", [
      z.object({ type: z.literal("a"), value: z.string() }),
      z.object({ type: z.literal("b"), value: z.number() }),
    ]);
    expect(schema.parse({ type: "a", value: "hello" })).toEqual({
      type: "a",
      value: "hello",
    });
    expect(schema.parse({ type: "b", value: 42 })).toEqual({
      type: "b",
      value: 42,
    });
  });
});

describe("Modifiers", () => {
  test("optional", () => {
    const schema = z.string().optional();
    expect(schema.parse("hello")).toBe("hello");
    expect(schema.parse(undefined)).toBe(undefined);
    expect(() => schema.parse(null)).toThrow();
  });

  test("nullable", () => {
    const schema = z.string().nullable();
    expect(schema.parse("hello")).toBe("hello");
    expect(schema.parse(null)).toBe(null);
    expect(() => schema.parse(undefined)).toThrow();
  });

  test("nullish", () => {
    const schema = z.string().nullish();
    expect(schema.parse("hello")).toBe("hello");
    expect(schema.parse(null)).toBe(null);
    expect(schema.parse(undefined)).toBe(undefined);
  });

  test("default", () => {
    const schema = z.string().default("default");
    expect(schema.parse("hello")).toBe("hello");
    expect(schema.parse(undefined)).toBe("default");
  });

  test("default with function", () => {
    let counter = 0;
    const schema = z.number().default(() => ++counter);
    expect(schema.parse(undefined)).toBe(1);
    expect(schema.parse(undefined)).toBe(2);
    expect(schema.parse(42)).toBe(42);
  });

  test("catch", () => {
    const schema = z.string().catch("fallback");
    expect(schema.parse("hello")).toBe("hello");
    expect(schema.parse(123)).toBe("fallback");
  });
});

describe("Transforms", () => {
  test("transform", () => {
    const schema = z.string().transform((s) => s.length);
    expect(schema.parse("hello")).toBe(5);
  });

  test("refine", () => {
    const schema = z.number().refine((n) => n % 2 === 0, "Must be even");
    expect(schema.parse(4)).toBe(4);
    expect(() => schema.parse(3)).toThrow();
  });

  test("pipe", () => {
    const schema = z.string().pipe(z.string().min(5));
    expect(schema.parse("hello")).toBe("hello");
    expect(() => schema.parse("hi")).toThrow();
  });
});

describe("Coercion", () => {
  test("coerce.string", () => {
    expect(z.coerce.string().parse(123)).toBe("123");
    expect(z.coerce.string().parse(true)).toBe("true");
  });

  test("coerce.number", () => {
    expect(z.coerce.number().parse("42")).toBe(42);
    expect(z.coerce.number().parse(true)).toBe(1);
  });

  test("coerce.boolean", () => {
    expect(z.coerce.boolean().parse(1)).toBe(true);
    expect(z.coerce.boolean().parse(0)).toBe(false);
    expect(z.coerce.boolean().parse("")).toBe(false);
  });

  test("coerce.date", () => {
    const result = z.coerce.date().parse("2021-01-01");
    expect(result instanceof Date).toBe(true);
    expect(result.toISOString().startsWith("2021-01-01")).toBe(true);
  });

  test("stringbool", () => {
    expect(z.stringbool().parse("true")).toBe(true);
    expect(z.stringbool().parse("false")).toBe(false);
    expect(z.stringbool().parse("yes")).toBe(true);
    expect(z.stringbool().parse("no")).toBe(false);
    expect(z.stringbool().parse("1")).toBe(true);
    expect(z.stringbool().parse("0")).toBe(false);
  });
});

describe("String Formats", () => {
  test("email", () => {
    expect(z.email().parse("test@example.com")).toBe("test@example.com");
    expect(() => z.email().parse("invalid")).toThrow();
  });

  test("uuid", () => {
    expect(z.uuid().parse("550e8400-e29b-41d4-a716-446655440000")).toBe(
      "550e8400-e29b-41d4-a716-446655440000",
    );
    expect(() => z.uuid().parse("not-a-uuid")).toThrow();
  });

  test("url", () => {
    expect(z.url().parse("https://example.com")).toBe("https://example.com");
    expect(() => z.url().parse("not a url")).toThrow();
  });

  test("ipv4", () => {
    expect(z.ipv4().parse("192.168.1.1")).toBe("192.168.1.1");
    expect(() => z.ipv4().parse("256.1.1.1")).toThrow();
  });

  test("base64", () => {
    expect(z.base64().parse("SGVsbG8=")).toBe("SGVsbG8=");
    expect(() => z.base64().parse("not base64!")).toThrow();
  });
});

describe("SafeParse", () => {
  test("returns success on valid data", () => {
    const result = z.string().safeParse("hello");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("hello");
    }
  });

  test("returns error on invalid data", () => {
    const result = z.string().safeParse(123);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });
});

describe("Type Inference", () => {
  test("infers correct types", () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
      emails: z.array(z.string()),
      address: z
        .object({
          street: z.string(),
          city: z.string(),
        })
        .optional(),
    });

    type User = z.infer<typeof schema>;

    // This is a compile-time test - if the types are wrong, it won't compile
    const user: User = {
      name: "John",
      age: 30,
      emails: ["john@example.com"],
      address: { street: "123 Main St", city: "NYC" },
    };

    expect(schema.parse(user)).toEqual(user);
  });
});

describe("Records and Maps", () => {
  test("record with string keys", () => {
    const schema = z.record(z.number());
    expect(schema.parse({ a: 1, b: 2 })).toEqual({ a: 1, b: 2 });
    expect(() => schema.parse({ a: "not a number" })).toThrow();
  });

  test("map", () => {
    const schema = z.map(z.string(), z.number());
    const input = new Map([
      ["a", 1],
      ["b", 2],
    ]);
    const result = schema.parse(input);
    expect(result.get("a")).toBe(1);
    expect(result.get("b")).toBe(2);
  });

  test("set", () => {
    const schema = z.set(z.number());
    const input = new Set([1, 2, 3]);
    const result = schema.parse(input);
    expect(result.has(1)).toBe(true);
    expect(result.has(4)).toBe(false);
  });
});

describe("Error Messages", () => {
  test("custom error messages", () => {
    const schema = z.string().min(5, "Too short!");
    const result = schema.safeParse("hi");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("Too short");
    }
  });

  test("error function customization", () => {
    const schema = z.string().error("Custom error message");
    const result = schema.safeParse(123);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Custom error message");
    }
  });

  test("prettifyError", () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });
    const result = schema.safeParse({ name: 123, age: "invalid" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const pretty = z.prettifyError(result.error);
      expect(pretty).toContain("name");
      expect(pretty).toContain("age");
    }
  });
});
