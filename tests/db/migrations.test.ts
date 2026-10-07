import { describe, expect, it } from "vitest";
import { createDb } from "./harness";

describe("migrations", () => {
  it("apply cleanly on a fresh database", async () => {
    const db = await createDb({ seed: false });
    const { rows } = await db.query<{ count: number }>(
      "select count(*)::int as count from pg_tables where schemaname = 'public'",
    );
    expect(rows[0].count).toBe(19);
    await db.close();
  });
});
