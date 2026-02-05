// Core types for the schema validation library

export type Primitive =
  | string
  | number
  | boolean
  | bigint
  | symbol
  | undefined
  | null;

export interface Issue {
  code: string;
  path: (string | number)[];
  message: string;
  expected?: string;
  received?: string;
}

export class ValidationError extends Error {
  readonly issues: Issue[];

  constructor(issues: Issue[]) {
    super(issues[0]?.message ?? "Validation failed");
    this.name = "ValidationError";
    this.issues = issues;
  }

  static fromIssue(issue: Issue): ValidationError {
    return new ValidationError([issue]);
  }

  format(): string {
    return this.issues
      .map((i) => `${i.path.length ? i.path.join(".") + ": " : ""}${i.message}`)
      .join("\n");
  }
}

export interface ParseContext {
  path: (string | number)[];
  parent?: unknown;
}

export type ParseResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: ValidationError;
    };

// Type inference helpers - these work with BaseSchema, not the interface
export type Infer<T extends { _output: any }> = T["_output"];
export type Input<T extends { _input: any }> = T["_input"];

// Error customization
export type ErrorCustomizer = string | ((issue: Issue) => string | undefined);
