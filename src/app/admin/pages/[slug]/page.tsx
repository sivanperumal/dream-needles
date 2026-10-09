import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageEditor } from "@/components/admin/page-editor";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata = { title: "Edit page" };

export default async function EditPage({
  params,
}: PageProps<"/admin/pages/[slug]">) {
  const { slug } = await params;
  const { supabase } = await requireAdmin();
  const { data: page } = await supabase
    .from("pages")
    .select("slug, title, body_markdown, seo_description")
    .eq("slug", slug)
    .maybeSingle();
  if (!page) notFound();
  return (
    <>
      <PageHeader
        title={page.title}
        back={{ href: "/admin/pages", label: "Pages" }}
        actions={
          <Link
            href={`/${page.slug}`}
            target="_blank"
            className="flex items-center gap-1 text-sm font-medium text-brand hover:underline"
          >
            View page <ExternalLink className="size-3.5" aria-hidden="true" />
          </Link>
        }
      />
      <PageEditor page={page} />
    </>
  );
}
