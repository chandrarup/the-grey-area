import type { JSONSchema } from "./types";

/**
 * OpenAI's strict json_schema mode requires "additionalProperties": false on
 * EVERY nested object node, not just the top level — a schema with a nested
 * object or array-of-objects that omits it is silently rejected. Anthropic
 * and Gemini both ignore the extra field, so it's safe to apply everywhere
 * rather than special-case OpenAI's request shape.
 */
export function withStrictObjects(schema: JSONSchema): JSONSchema {
  if (schema.type === "object") {
    return {
      ...schema,
      additionalProperties: false,
      properties: schema.properties
        ? Object.fromEntries(
            Object.entries(schema.properties).map(([key, value]) => [
              key,
              withStrictObjects(value),
            ]),
          )
        : schema.properties,
    };
  }

  if (schema.type === "array" && schema.items) {
    return { ...schema, items: withStrictObjects(schema.items) };
  }

  return schema;
}
