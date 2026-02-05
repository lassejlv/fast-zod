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

**3.23x faster than Zod on average.**

```
============================================================
Benchmark: fast-zod vs zod
Iterations: 100,000
============================================================

String Parsing:
  fast-zod: 20.96 ns/op
  zod:      63.90 ns/op
  speedup:  3.05x

Number Parsing:
  fast-zod: 14.22 ns/op
  zod:      48.30 ns/op
  speedup:  3.40x

Object Parsing (3 fields):
  fast-zod: 99.14 ns/op
  zod:      220.38 ns/op
  speedup:  2.22x

Array Parsing (10 elements):
  fast-zod: 188.80 ns/op
  zod:      264.12 ns/op
  speedup:  1.40x

Nested Object Parsing:
  fast-zod: 439.74 ns/op
  zod:      975.15 ns/op
  speedup:  2.22x

safeParse (object):
  fast-zod: 100.42 ns/op
  zod:      160.22 ns/op
  speedup:  1.60x

Union Parsing (string | number):
  fast-zod: 18.43 ns/op
  zod:      106.48 ns/op
  speedup:  5.78x

String with validations (min, max, regex):
  fast-zod: 22.19 ns/op
  zod:      136.38 ns/op
  speedup:  6.15x

============================================================
Summary:
============================================================
  Average speedup: 3.23x
```

Run benchmarks yourself:

```bash
bun run benchmark/index.ts
```

## License

MIT
