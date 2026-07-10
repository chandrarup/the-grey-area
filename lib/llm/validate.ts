import { LLMValidationError } from "./errors";
import type { JSONSchema } from "./types";

function typeOf(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function check(value: unknown, schema: JSONSchema, path: string): string | null {
  const actual = typeOf(value);
  const expected = schema.type === "integer" ? "number" : schema.type;

  if (actual !== expected) {
    return `${path || "value"}: expected ${schema.type}, got ${actual}`;
  }
  if (schema.type === "integer" && !Number.isInteger(value)) {
    return `${path || "value"}: expected integer, got ${value}`;
  }
  if (schema.enum && !schema.enum.includes(value as string | number)) {
    return `${path || "value"}: ${JSON.stringify(value)} is not one of ${JSON.stringify(schema.enum)}`;
  }

  if (schema.type === "object") {
    const obj = value as Record<string, unknown>;
    for (const key of schema.required ?? []) {
      if (!(key in obj)) return `${path || "value"}: missing required property "${key}"`;
    }
    for (const [key, propSchema] of Object.entries(schema.properties ?? {})) {
      if (key in obj) {
        const error = check(obj[key], propSchema, path ? `${path}.${key}` : key);
        if (error) return error;
      }
    }
  }

  if (schema.type === "array" && schema.items) {
    for (let i = 0; i < (value as unknown[]).length; i++) {
      const error = check((value as unknown[])[i], schema.items, `${path}[${i}]`);
      if (error) return error;
    }
  }

  return null;
}

/** Throws LLMValidationError if `data` does not match `schema`. */
export function assertMatchesSchema(data: unknown, schema: JSONSchema): void {
  const error = check(data, schema, "");
  if (error) {
    throw new LLMValidationError(`Response did not match schema: ${error}`, data);
  }
}

/** Parses a JSON string and validates it against `schema` in one step. */
export function parseAndValidate(raw: string, schema: JSONSchema): unknown {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new LLMValidationError(`Response was not valid JSON: ${raw.slice(0, 500)}`, raw);
  }
  assertMatchesSchema(data, schema);
  return data;
}
