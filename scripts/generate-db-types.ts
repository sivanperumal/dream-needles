/**
 * Generates src/types/database.ts from the migrations, in the same shape as
 * `supabase gen types typescript`, without needing the Supabase CLI or a
 * running project. Runs the migrations in PGlite and introspects the schema.
 *
 * Run: npm run db:types
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { createDb } from "../tests/db/harness";

const PG_TO_TS: Record<string, string> = {
  uuid: "string",
  text: "string",
  "timestamp with time zone": "string",
  date: "string",
  integer: "number",
  smallint: "number",
  bigint: "number",
  numeric: "number",
  real: "number",
  "double precision": "number",
  boolean: "boolean",
  jsonb: "Json",
  json: "Json",
  tsvector: "unknown",
  "text[]": "string[]",
  "uuid[]": "string[]",
  record: "Record<string, unknown>",
};

const tsType = (pgType: string) => PG_TO_TS[pgType] ?? "unknown";

type Column = {
  table_name: string;
  column_name: string;
  data_type: string;
  udt_name: string;
  is_nullable: "YES" | "NO";
  column_default: string | null;
  is_generated: "ALWAYS" | "NEVER";
};

type ForeignKey = {
  constraint_name: string;
  table_name: string;
  columns: string[];
  referenced_table: string;
  referenced_columns: string[];
  is_one_to_one: boolean;
};

type Fn = {
  name: string;
  arg_names: string[] | null;
  arg_types: string[];
  n_defaults: number;
  returns: string;
  returns_set: boolean;
};

async function main() {
  const db = await createDb({ seed: false });

  const columns = (
    await db.query<Column>(`
      select c.table_name, c.column_name, c.data_type, c.udt_name, c.is_nullable,
             c.column_default, c.is_generated
      from information_schema.columns c
      join information_schema.tables t
        on t.table_schema = c.table_schema and t.table_name = c.table_name
      where c.table_schema = 'public' and t.table_type = 'BASE TABLE'
      order by c.table_name, c.ordinal_position`)
  ).rows;

  const foreignKeys = (
    await db.query<ForeignKey>(`
      select con.conname as constraint_name,
             rel.relname as table_name,
             array(select attname from unnest(con.conkey) k
                   join pg_attribute a on a.attrelid = con.conrelid and a.attnum = k) as columns,
             frel.relname as referenced_table,
             array(select attname from unnest(con.confkey) k
                   join pg_attribute a on a.attrelid = con.confrelid and a.attnum = k) as referenced_columns,
             exists (
               select 1 from pg_index i
               where i.indrelid = con.conrelid and i.indisunique
                 and i.indkey::int2[] @> con.conkey and cardinality(i.indkey::int2[]) = cardinality(con.conkey)
             ) as is_one_to_one
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace n on n.oid = rel.relnamespace
      join pg_class frel on frel.oid = con.confrelid
      join pg_namespace fn on fn.oid = frel.relnamespace
      where con.contype = 'f' and n.nspname = 'public' and fn.nspname = 'public'
      order by con.conname`)
  ).rows;

  const functions = (
    await db.query<Fn>(`
      select p.proname as name,
             p.proargnames as arg_names,
             array(select format_type(t, null) from unnest(p.proargtypes::oid[]) t) as arg_types,
             p.pronargdefaults as n_defaults,
             format_type(p.prorettype, null) as returns,
             p.proretset as returns_set
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.prokind = 'f'
        and format_type(p.prorettype, null) <> 'trigger'
        and p.proname not like 'immutable_%'
        and p.proname not in ('search_normalize', 'search_tsquery', 'search_product_matches')
      order by p.proname`)
  ).rows;

  await db.close();

  const tables = [...new Set(columns.map((c) => c.table_name))];
  const pgType = (c: Column) =>
    c.data_type === "ARRAY" ? `${c.udt_name.slice(1)}[]` : c.data_type;

  const tableBlocks = tables.map((table) => {
    const cols = columns.filter((c) => c.table_name === table);
    const row = cols.map((c) => {
      const nullable = c.is_nullable === "YES" ? " | null" : "";
      return `          ${c.column_name}: ${tsType(pgType(c))}${nullable}`;
    });
    const insert = cols.map((c) => {
      const t = tsType(pgType(c));
      if (c.is_generated === "ALWAYS")
        return `          ${c.column_name}?: never`;
      const optional =
        c.is_nullable === "YES" || c.column_default !== null ? "?" : "";
      const nullable = c.is_nullable === "YES" ? " | null" : "";
      return `          ${c.column_name}${optional}: ${t}${nullable}`;
    });
    const update = cols.map((c) => {
      if (c.is_generated === "ALWAYS")
        return `          ${c.column_name}?: never`;
      const nullable = c.is_nullable === "YES" ? " | null" : "";
      return `          ${c.column_name}?: ${tsType(pgType(c))}${nullable}`;
    });
    const rels = foreignKeys
      .filter((fk) => fk.table_name === table)
      .map(
        (fk) => `          {
            foreignKeyName: "${fk.constraint_name}"
            columns: [${fk.columns.map((c) => `"${c}"`).join(", ")}]
            isOneToOne: ${fk.is_one_to_one}
            referencedRelation: "${fk.referenced_table}"
            referencedColumns: [${fk.referenced_columns.map((c) => `"${c}"`).join(", ")}]
          },`,
      );
    return `      ${table}: {
        Row: {
${row.join("\n")}
        }
        Insert: {
${insert.join("\n")}
        }
        Update: {
${update.join("\n")}
        }
        Relationships: [
${rels.join("\n")}
        ]
      }`;
  });

  const functionBlocks = functions.map((fn) => {
    const names = fn.arg_names ?? [];
    const firstOptional = fn.arg_types.length - fn.n_defaults;
    const args = fn.arg_types.map((type, i) => {
      // Composite-type args (computed fields like is_new(products)) are row types.
      const t = tables.includes(type)
        ? `Database["public"]["Tables"]["${type}"]["Row"]`
        : tsType(type);
      return `${names[i] ?? `arg${i}`}${i >= firstOptional ? "?" : ""}: ${t}`;
    });
    const returns = tsType(fn.returns);
    return `      ${fn.name}: {
        Args: ${args.length ? `{ ${args.join("; ")} }` : "Record<PropertyKey, never>"}
        Returns: ${fn.returns_set ? `${returns}[]` : returns}
      }`;
  });

  const output = `// Generated by scripts/generate-db-types.ts from supabase/migrations.
// Do not edit by hand — run \`npm run db:types\` after changing a migration.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
${tableBlocks.join("\n")}
    }
    Views: Record<string, never>
    Functions: {
${functionBlocks.join("\n")}
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
};

type PublicSchema = Database["public"];
export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"];
`;

  const target = join(__dirname, "..", "src", "types", "database.ts");
  writeFileSync(target, output);
  console.log(
    `Wrote ${tables.length} tables and ${functions.length} functions to src/types/database.ts`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
