import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

/** Renders admin-edited Markdown (pages table) with the site's typography. Raw HTML is not allowed. */
export function Prose({
  markdown,
  className,
}: {
  markdown: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-none text-[15px] leading-7 text-gray-700",
        "[&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#210023] first:[&_h2]:mt-0",
        "[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:font-semibold [&_h3]:text-gray-900",
        "[&_li]:mb-1 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5",
        "[&_em]:text-gray-500 [&_strong]:font-semibold [&_strong]:text-gray-900",
        "[&_a]:font-medium [&_a]:text-brand [&_a]:underline-offset-2 hover:[&_a]:underline",
        className,
      )}
    >
      <ReactMarkdown
        components={{
          a: ({ href = "", children }) =>
            href.startsWith("/") ? (
              <Link href={href}>{children}</Link>
            ) : (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}

/** Splits FAQ Markdown into { question, answer } pairs on "## " headings. */
export function parseFaq(markdown: string) {
  return markdown
    .split(/^## /m)
    .slice(1)
    .map((block) => {
      const [question, ...rest] = block.split("\n");
      return { question: question.trim(), answer: rest.join("\n").trim() };
    })
    .filter((item) => item.question);
}
