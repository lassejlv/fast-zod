// Benchmark: fast-zod vs zod
import z from "../src/index";
import * as zod from "zod";

const ITERATIONS = 100_000;

function bench(name: string, fn: () => void): number {
  // Warmup
  for (let i = 0; i < 1000; i++) fn();

  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    fn();
  }
  const end = performance.now();
  const totalMs = end - start;
  const avgNs = (totalMs * 1_000_000) / ITERATIONS;
  return avgNs;
}

console.log("=".repeat(60));
console.log("Benchmark: fast-zod vs zod");
console.log(`Iterations: ${ITERATIONS.toLocaleString()}`);
console.log("=".repeat(60));
console.log("");

// Test data
const validString = "hello world";
const validNumber = 42;
const validObject = { name: "John", age: 30, email: "john@example.com" };
const validArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const validNestedObject = {
  user: {
    name: "John",
    age: 30,
    emails: ["john@example.com", "john.doe@company.com"],
    address: {
      street: "123 Main St",
      city: "New York",
      zip: "10001",
    },
  },
  metadata: {
    createdAt: "2024-01-01",
    updatedAt: "2024-01-02",
  },
};

// ============= String Parsing =============
console.log("String Parsing:");

const fastZodString = z.string();
const zodString = zod.string();

const fastZodStringTime = bench("fast-zod", () =>
  fastZodString.parse(validString),
);
const zodStringTime = bench("zod", () => zodString.parse(validString));
const stringSpeedup = zodStringTime / fastZodStringTime;

console.log(`  fast-zod: ${fastZodStringTime.toFixed(2)} ns/op`);
console.log(`  zod:      ${zodStringTime.toFixed(2)} ns/op`);
console.log(
  `  speedup:  ${stringSpeedup.toFixed(2)}x ${stringSpeedup > 1 ? "(fast-zod faster)" : "(zod faster)"}`,
);
console.log("");

// ============= Number Parsing =============
console.log("Number Parsing:");

const fastZodNumber = z.number();
const zodNumber = zod.number();

const fastZodNumberTime = bench("fast-zod", () =>
  fastZodNumber.parse(validNumber),
);
const zodNumberTime = bench("zod", () => zodNumber.parse(validNumber));
const numberSpeedup = zodNumberTime / fastZodNumberTime;

console.log(`  fast-zod: ${fastZodNumberTime.toFixed(2)} ns/op`);
console.log(`  zod:      ${zodNumberTime.toFixed(2)} ns/op`);
console.log(
  `  speedup:  ${numberSpeedup.toFixed(2)}x ${numberSpeedup > 1 ? "(fast-zod faster)" : "(zod faster)"}`,
);
console.log("");

// ============= Object Parsing =============
console.log("Object Parsing (3 fields):");

const fastZodObject = z.object({
  name: z.string(),
  age: z.number(),
  email: z.string(),
});
const zodObject = zod.object({
  name: zod.string(),
  age: zod.number(),
  email: zod.string(),
});

const fastZodObjectTime = bench("fast-zod", () =>
  fastZodObject.parse(validObject),
);
const zodObjectTime = bench("zod", () => zodObject.parse(validObject));
const objectSpeedup = zodObjectTime / fastZodObjectTime;

console.log(`  fast-zod: ${fastZodObjectTime.toFixed(2)} ns/op`);
console.log(`  zod:      ${zodObjectTime.toFixed(2)} ns/op`);
console.log(
  `  speedup:  ${objectSpeedup.toFixed(2)}x ${objectSpeedup > 1 ? "(fast-zod faster)" : "(zod faster)"}`,
);
console.log("");

// ============= Array Parsing =============
console.log("Array Parsing (10 elements):");

const fastZodArray = z.array(z.number());
const zodArray = zod.array(zod.number());

const fastZodArrayTime = bench("fast-zod", () =>
  fastZodArray.parse(validArray),
);
const zodArrayTime = bench("zod", () => zodArray.parse(validArray));
const arraySpeedup = zodArrayTime / fastZodArrayTime;

console.log(`  fast-zod: ${fastZodArrayTime.toFixed(2)} ns/op`);
console.log(`  zod:      ${zodArrayTime.toFixed(2)} ns/op`);
console.log(
  `  speedup:  ${arraySpeedup.toFixed(2)}x ${arraySpeedup > 1 ? "(fast-zod faster)" : "(zod faster)"}`,
);
console.log("");

// ============= Nested Object Parsing =============
console.log("Nested Object Parsing:");

const fastZodNested = z.object({
  user: z.object({
    name: z.string(),
    age: z.number(),
    emails: z.array(z.string()),
    address: z.object({
      street: z.string(),
      city: z.string(),
      zip: z.string(),
    }),
  }),
  metadata: z.object({
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
});

const zodNested = zod.object({
  user: zod.object({
    name: zod.string(),
    age: zod.number(),
    emails: zod.array(zod.string()),
    address: zod.object({
      street: zod.string(),
      city: zod.string(),
      zip: zod.string(),
    }),
  }),
  metadata: zod.object({
    createdAt: zod.string(),
    updatedAt: zod.string(),
  }),
});

const fastZodNestedTime = bench("fast-zod", () =>
  fastZodNested.parse(validNestedObject),
);
const zodNestedTime = bench("zod", () => zodNested.parse(validNestedObject));
const nestedSpeedup = zodNestedTime / fastZodNestedTime;

console.log(`  fast-zod: ${fastZodNestedTime.toFixed(2)} ns/op`);
console.log(`  zod:      ${zodNestedTime.toFixed(2)} ns/op`);
console.log(
  `  speedup:  ${nestedSpeedup.toFixed(2)}x ${nestedSpeedup > 1 ? "(fast-zod faster)" : "(zod faster)"}`,
);
console.log("");

// ============= safeParse =============
console.log("safeParse (object):");

const fastZodSafeTime = bench("fast-zod", () =>
  fastZodObject.safeParse(validObject),
);
const zodSafeTime = bench("zod", () => zodObject.safeParse(validObject));
const safeSpeedup = zodSafeTime / fastZodSafeTime;

console.log(`  fast-zod: ${fastZodSafeTime.toFixed(2)} ns/op`);
console.log(`  zod:      ${zodSafeTime.toFixed(2)} ns/op`);
console.log(
  `  speedup:  ${safeSpeedup.toFixed(2)}x ${safeSpeedup > 1 ? "(fast-zod faster)" : "(zod faster)"}`,
);
console.log("");

// ============= Union Parsing =============
console.log("Union Parsing (string | number):");

const fastZodUnion = z.union([z.string(), z.number()]);
const zodUnion = zod.union([zod.string(), zod.number()]);

const fastZodUnionTime = bench("fast-zod", () =>
  fastZodUnion.parse(validString),
);
const zodUnionTime = bench("zod", () => zodUnion.parse(validString));
const unionSpeedup = zodUnionTime / fastZodUnionTime;

console.log(`  fast-zod: ${fastZodUnionTime.toFixed(2)} ns/op`);
console.log(`  zod:      ${zodUnionTime.toFixed(2)} ns/op`);
console.log(
  `  speedup:  ${unionSpeedup.toFixed(2)}x ${unionSpeedup > 1 ? "(fast-zod faster)" : "(zod faster)"}`,
);
console.log("");

// ============= String with validations =============
console.log("String with validations (min, max, regex):");

const fastZodStringVal = z
  .string()
  .min(5)
  .max(100)
  .regex(/^[a-z ]+$/i);
const zodStringVal = zod
  .string()
  .min(5)
  .max(100)
  .regex(/^[a-z ]+$/i);

const fastZodStringValTime = bench("fast-zod", () =>
  fastZodStringVal.parse(validString),
);
const zodStringValTime = bench("zod", () => zodStringVal.parse(validString));
const stringValSpeedup = zodStringValTime / fastZodStringValTime;

console.log(`  fast-zod: ${fastZodStringValTime.toFixed(2)} ns/op`);
console.log(`  zod:      ${zodStringValTime.toFixed(2)} ns/op`);
console.log(
  `  speedup:  ${stringValSpeedup.toFixed(2)}x ${stringValSpeedup > 1 ? "(fast-zod faster)" : "(zod faster)"}`,
);
console.log("");

// ============= Summary =============
console.log("=".repeat(60));
console.log("Summary:");
console.log("=".repeat(60));

const avgSpeedup =
  (stringSpeedup +
    numberSpeedup +
    objectSpeedup +
    arraySpeedup +
    nestedSpeedup +
    safeSpeedup +
    unionSpeedup +
    stringValSpeedup) /
  8;
console.log(`  Average speedup: ${avgSpeedup.toFixed(2)}x`);

if (avgSpeedup > 1) {
  console.log(
    `  Result: fast-zod is ${avgSpeedup.toFixed(2)}x faster than zod on average`,
  );
} else {
  console.log(
    `  Result: zod is ${(1 / avgSpeedup).toFixed(2)}x faster than fast-zod on average`,
  );
}
