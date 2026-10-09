import type { Metadata } from "next";
import { Suspense } from "react";
import { Toaster } from "sonner";
import { AdminShell } from "@/components/admin/admin-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/admin/auth";
import { signOut } from "@/lib/actions/auth";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · Dream Needles" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <Suspense fallback={<Skeleton className="m-8 h-96" />}>
        <AdminShell topbar={<AdminUser />}>
          <AdminGate>{children}</AdminGate>
        </AdminShell>
      </Suspense>
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}

/** Renders admin pages only for admins (redirects everyone else). */
async function AdminGate({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return children;
}

async function AdminUser() {
  const { profile } = await requireAdmin();
  return (
    <>
      <span className="hidden text-sm text-gray-600 sm:inline">
        {profile.full_name || profile.email}
      </span>
      <form action={signOut}>
        <button
          type="submit"
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Sign out
        </button>
      </form>
    </>
  );
}
