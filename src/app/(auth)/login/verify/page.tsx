import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthCard, AuthTerms } from "@/components/auth/auth-card";
import { ChangeEmailLink, CodeForm } from "@/components/auth/login-forms";
import { Skeleton } from "@/components/ui/skeleton";
import { safeNext } from "@/lib/safe-redirect";

export const metadata: Metadata = {
  title: "Enter your code",
  robots: { index: false },
};

export default function VerifyPage(props: PageProps<"/login/verify">) {
  return (
    <AuthCard back={{ href: "/login", label: "Back to Sign in" }}>
      <h1 className="text-3xl font-bold text-gray-900">
        Enter verification code
      </h1>
      <Suspense fallback={<Skeleton className="mt-6 h-40 w-full" />}>
        <VerifyForm {...props} />
      </Suspense>
      <AuthTerms />
    </AuthCard>
  );
}

async function VerifyForm({ searchParams }: PageProps<"/login/verify">) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";
  const next = safeNext(params.next);
  if (!email) redirect(`/login?next=${encodeURIComponent(next)}`);
  return (
    <>
      <p className="mt-2 text-gray-600">We&apos;ve sent a 6-digit code to</p>
      <p className="mb-6 flex flex-wrap items-center gap-x-3">
        <span className="font-semibold text-gray-900">{email}</span>
        <ChangeEmailLink next={next} />
      </p>
      <CodeForm email={email} next={next} />
      <p className="mt-4 text-center text-xs text-gray-500">
        Can&apos;t find it? Check your spam or promotions folder.
      </p>
    </>
  );
}
