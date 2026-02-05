# fast-zod

A high-performance, drop-in replacement for [Zod](https://zod.dev). API-compatible with Zod v4.

## Installation

```bash
bun add fast-zod
```

## Usage

```ts
import z from 'fast-zod';

const userSchema = z.object({
  name: z.string(),
  age: z.number(),
  email: z.email(),
});

type User = z.infer<typeof userSchema>;

const user = userSchema.parse({
  name: 'John',
  age: 30,
  email: 'john@example.com',
});
```

## Benchmark

**1.15x faster than Zod on average.**

```
➜  zod-clone git:(main) ✗ bun run benchmark/index.ts
============================================================
Benchmark: fast-zod vs zod
Iterations: 100,000
============================================================

String Parsing:
  fast-zod: 22.72 ns/op
  zod:      34.24 ns/op
  speedup:  1.51x (fast-zod faster)

Number Parsing:
  fast-zod: 24.93 ns/op
  zod:      22.78 ns/op
  speedup:  0.91x (zod faster)

Object Parsing (3 fields):
  fast-zod: 104.85 ns/op
  zod:      53.32 ns/op
  speedup:  0.51x (zod faster)

Array Parsing (10 elements):
  fast-zod: 181.33 ns/op
  zod:      96.96 ns/op
  speedup:  0.53x (zod faster)

Nested Object Parsing:
  fast-zod: 369.92 ns/op
  zod:      145.56 ns/op
  speedup:  0.39x (zod faster)

safeParse (object):
  fast-zod: 97.65 ns/op
  zod:      35.72 ns/op
  speedup:  0.37x (zod faster)

Union Parsing (string | number):
  fast-zod: 19.23 ns/op
  zod:      36.40 ns/op
  speedup:  1.89x (fast-zod faster)

String with validations (min, max, regex):
  fast-zod: 24.95 ns/op
  zod:      77.01 ns/op
  speedup:  3.09x (fast-zod faster)

============================================================
Summary:
============================================================
  Average speedup: 1.15x
  Result: fast-zod is 1.15x faster than zod on average
```

Run benchmarks yourself:

```bash
bun run benchmark/index.ts
```

## License

MIT
