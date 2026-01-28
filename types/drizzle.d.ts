declare module "drizzle-orm/postgres-js" {
  import type { Sql } from "postgres";
  export function drizzle(
    client: Sql | string,
    config?: { schema?: Record<string, unknown> }
  ): any;
}
