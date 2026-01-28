import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString, { prepare: false });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = drizzle(client, { schema }) as any;
