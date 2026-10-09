import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard, AuthTerms } from "@/components/auth/auth-card";
import { EmailForm } from "@/components/auth/login-forms";
import { safeNext } from "@/lib/safe-redirect";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false },
};

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <AuthCard back={{ href: "/", label: "Back to Shopping" }}>
      <p className="flex items-center gap-2 border-b border-gray-100 pb-4 text-[13px] text-gray-500">
        <span className="rounded-full bg-brand px-2.5 py-0.5 text-xs font-semibold text-white">
          Step 1
        </span>
        Email
      </p>
      <h1 className="mt-6 text-3xl font-bold text-gray-900">Sign in</h1>
      <p className="mt-1 mb-6 text-gray-600">
        Sign in or create an account with your email
      </p>
      <Suspense fallback={<EmailForm next="/account" />}>
        <LoginForm {...props} />
      </Suspense>
      <AuthTerms />
    </AuthCard>
  );
}

async function LoginForm({ searchParams }: PageProps<"/login">) {
  const { next, email } = await searchParams;
  return (
    <EmailForm
      next={safeNext(next)}
      defaultEmail={typeof email === "string" ? email : ""}
    />
  );
}
