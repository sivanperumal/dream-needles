import { LogOut } from "lucide-react";
import { Suspense } from "react";
import { AccountTabs, AccountTabsList } from "@/components/account/account-ui";
import { signOut } from "@/lib/actions/auth";

/** Account area: header, tabs and sign-out (Figma 79:9675). Pages check the session themselves. */
export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <div className="min-h-[60vh] bg-[#fafbff] pb-20">
      <div className="container-page pt-8">
        <p className="text-xs font-medium tracking-wide text-gray-600 uppercase">
          Dream Needles account •{" "}
          <span className="font-semibold text-gray-900">My account</span>
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-extrabold text-[#210023] md:text-4xl">
            My Account
          </h1>
          <form action={signOut}>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand shadow-sm ring-1 ring-gray-100 hover:bg-brand-tint"
            >
              <LogOut className="size-4" aria-hidden="true" /> Sign out
            </button>
          </form>
        </div>
        <div className="mt-6 mb-8">
          <Suspense fallback={<AccountTabsList pathname="" />}>
            <AccountTabs />
          </Suspense>
        </div>
        {children}
      </div>
    </div>
  );
}
