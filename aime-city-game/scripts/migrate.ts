import "dotenv/config";
import { resolve } from "node:path";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "@/db";

async function runMigrations() {
  try {
    // Railway launches private by default. A deliberate false opts out, but
    // owner-level permissions must be implemented before opening to the public.
    const privateAccess =
      process.env.AIME_PRIVATE_ACCESS === "true" ||
      (Boolean(process.env.RAILWAY_PROJECT_ID) && process.env.AIME_PRIVATE_ACCESS !== "false");

    if (privateAccess && (process.env.AIME_PRIVATE_PASSWORD?.length ?? 0) < 24) {
      throw new Error("Set AIME_PRIVATE_PASSWORD to a unique random password of at least 24 characters before deploying.");
    }

    console.log("Applying committed AIME CITY migrations…");
    await migrate(db, { migrationsFolder: resolve(process.cwd(), "drizzle") });
    console.log("AIME CITY migrations completed.");
  } catch (error) {
    // Do not log the connection string or a PostgreSQL error containing secrets.
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : undefined;
    console.error("Database preparation failed. Check the database connection, private-access variables and migration history.");
    if (code) console.error(`Database error code: ${code}`);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void runMigrations();
