"use client";

import { useState } from "react";
import { TextArea, TextField } from "@/components/admin/form-fields";
import { Card } from "@/components/admin/ui";
import { useAdminForm } from "@/components/admin/use-admin-form";
import { Prose } from "@/components/content/prose";
import { Button } from "@/components/ui/button";
import { savePage } from "@/lib/admin/actions/content";

/** Markdown editor with live preview for the static pages. */
export function PageEditor({
  page,
}: {
  page: {
    slug: string;
    title: string;
    body_markdown: string;
    seo_description: string | null;
  };
}) {
  const [body, setBody] = useState(page.body_markdown);
  const [state, action, pending] = useAdminForm(savePage);
  return (
    <form action={action} className="grid gap-6 xl:grid-cols-2" noValidate>
      <input type="hidden" name="slug" value={page.slug} />
      <Card title="Edit">
        <div className="grid gap-4 p-5">
          <TextField
            label="Title"
            name="title"
            defaultValue={page.title}
            error={state?.errors?.title}
            required
          />
          <TextArea
            label="SEO description"
            name="seo_description"
            rows={2}
            defaultValue={page.seo_description ?? ""}
          />
          <div>
            <label
              htmlFor="f-body"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Content (Markdown)
            </label>
            <textarea
              id="f-body"
              name="body_markdown"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={24}
              className="block w-full rounded-lg border border-gray-200 p-3 font-mono text-sm focus:border-brand focus:ring-2 focus:ring-brand/15 focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              <code>## Heading</code> · <code>**bold**</code> ·{" "}
              <code>- list item</code> · <code>[link text](/faq)</code>
              {page.slug === "faq" &&
                " · Each ## heading becomes a question in the FAQ accordion."}
            </p>
          </div>
          <Button type="submit" loading={pending}>
            Save page
          </Button>
        </div>
      </Card>
      <Card title="Preview">
        <div className="max-h-[900px] overflow-y-auto p-6">
          <Prose markdown={body} />
        </div>
      </Card>
    </form>
  );
}
