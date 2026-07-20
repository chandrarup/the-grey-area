import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

let _sql: ReturnType<typeof postgres> | null = null;
let _db: Db | null = null;

export function getDb(): Db {
  if (_db) return _db;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add your Supabase Session pooler connection string to .env.local.",
    );
  }

  _sql = postgres(url, {
    prepare: false,
    max: 10,
  });
  _db = drizzle(_sql, { schema });
  return _db;
}

/** Lazy Drizzle client over Supabase Postgres (postgres.js). */
export const db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    const client = getDb();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

/** Close the pooled connection (CLI scripts). */
export async function closeDb(): Promise<void> {
  if (_sql) {
    await _sql.end({ timeout: 5 });
    _sql = null;
    _db = null;
  }
}
