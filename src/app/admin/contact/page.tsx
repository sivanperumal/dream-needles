import {
  Card,
  EmptyRow,
  PageHeader,
  Pill,
  Table,
  Td,
  Th,
} from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata = { title: "Contact messages" };
const dateFmt = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});

export default async function ContactMessagesPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("contact_submissions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  return (
    <>
      <PageHeader
        title="Contact messages"
        description="Read-only copy of Contact Us submissions (also sent to your Google Sheet). Reply by email."
      />
      <Card>
        <Table>
          <thead>
            <tr>
              <Th>From</Th>
              <Th>Message</Th>
              <Th>Received</Th>
              <Th>Google Sheet</Th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((m) => (
              <tr key={m.id}>
                <Td className="align-top">
                  <p className="font-semibold text-gray-900">{m.name}</p>
                  <a
                    href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject ?? "Your message"}`)}`}
                    className="text-sm text-brand hover:underline"
                  >
                    {m.email}
                  </a>
                  {m.phone && (
                    <p className="text-xs text-gray-500">{m.phone}</p>
                  )}
                </Td>
                <Td className="max-w-xl align-top">
                  {m.subject && (
                    <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                      {m.subject}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-line text-gray-800">
                    {m.message}
                  </p>
                </Td>
                <Td className="align-top text-xs whitespace-nowrap">
                  {dateFmt.format(new Date(m.created_at))}
                </Td>
                <Td className="align-top">
                  {m.sheet_synced ? (
                    <Pill tone="green">Synced</Pill>
                  ) : m.sheet_error ? (
                    <Pill tone="red">Failed</Pill>
                  ) : (
                    <Pill>Pending</Pill>
                  )}
                  {m.sheet_error && (
                    <p className="mt-1 max-w-48 text-xs text-rose-600">
                      {m.sheet_error}
                    </p>
                  )}
                </Td>
              </tr>
            ))}
            {!data?.length && <EmptyRow colSpan={4}>No messages yet.</EmptyRow>}
          </tbody>
        </Table>
      </Card>
    </>
  );
}
