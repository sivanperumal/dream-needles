import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PGlite, type Transaction } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { unaccent } from "@electric-sql/pglite/contrib/unaccent";

const root = join(__dirname, "..", "..");

function sqlFiles(dir: string): string[] {
  return readdirSync(join(root, dir))
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => join(root, dir, f));
}

/** Fresh database with the Supabase stub, every migration and (optionally) the seeds. */
export async function createDb({ seed = true } = {}): Promise<PGlite> {
  const db = new PGlite({ extensions: { pg_trgm, unaccent } });
  await db.exec(readFileSync(join(__dirname, "supabase-stub.sql"), "utf8"));
  const files = [
    ...sqlFiles("supabase/migrations"),
    ...(seed ? sqlFiles("supabase/seed") : []),
  ];
  for (const file of files) {
    try {
      await db.exec(readFileSync(file, "utf8"));
    } catch (error) {
      throw new Error(`Failed running ${file}: ${(error as Error).message}`);
    }
  }
  return db;
}

type Role = "anon" | "authenticated" | "service_role";

/** Run `fn` as an API role, optionally signed in as `userId`, then roll back. */
export async function as<T>(
  db: PGlite,
  role: Role,
  userId: string | null,
  fn: (tx: Transaction) => Promise<T>,
): Promise<T> {
  let result: T | undefined;
  let failure: unknown;
  await db
    .transaction(async (tx) => {
      await tx.exec(`set local role ${role}`);
      await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [
        userId ?? "",
      ]);
      try {
        result = await fn(tx);
      } catch (error) {
        failure = error;
      }
      await tx.rollback();
    })
    .catch(() => undefined);
  if (failure) throw failure;
  return result as T;
}

/** Create an auth user (the trigger creates the profile) and optionally make them admin. */
export async function createUser(
  db: PGlite,
  id: string,
  email: string,
  admin = false,
) {
  await db.query("insert into auth.users (id, email) values ($1, $2)", [
    id,
    email,
  ]);
  if (admin)
    await db.query("update public.profiles set role = 'admin' where id = $1", [
      id,
    ]);
}
