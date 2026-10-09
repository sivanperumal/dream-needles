import Link from "next/link";
import { Card, PageHeader, Table, Td, Th } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata = { title: "Pages" };
const dateFmt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" });

export default async function PagesPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("pages")
    .select("slug, title, updated_at")
    .order("title");
  return (
    <>
      <PageHeader
        title="Pages"
        description="Text for Our Story, FAQ, policies and terms."
      />
      <Card>
        <Table>
          <thead>
            <tr>
              <Th>Page</Th>
              <Th>Address</Th>
              <Th>Last updated</Th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((p) => (
              <tr key={p.slug} className="hover:bg-gray-50">
                <Td>
                  <Link
                    href={`/admin/pages/${p.slug}`}
                    className="font-semibold text-brand hover:underline"
                  >
                    {p.title}
                  </Link>
                </Td>
                <Td className="font-mono text-xs">/{p.slug}</Td>
                <Td className="text-xs">
                  {dateFmt.format(new Date(p.updated_at))}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </>
  );
}
