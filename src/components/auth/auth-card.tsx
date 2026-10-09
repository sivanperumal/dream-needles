import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function AuthCard({
  back,
  children,
}: {
  back: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <>
      <Link
        href={back.href}
        className="flex w-fit items-center gap-2 text-[15px] text-brand hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> {back.label}
      </Link>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center py-8">
        <Link href="/" aria-label="Dream Needles home">
          <Image
            src="/images/brand/logo.svg"
            alt="Dream Needles"
            width={232}
            height={64}
            priority
            className="h-16 w-auto"
          />
        </Link>
        <div className="mt-8 w-full rounded-3xl bg-white p-8 shadow-xl shadow-brand/5 md:p-9">
          {children}
        </div>
        <p className="mt-10 text-sm">
          <Link href="/privacy-policy" className="text-brand hover:underline">
            Privacy policy
          </Link>
        </p>
      </div>
    </>
  );
}

export function AuthTerms() {
  return (
    <p className="mt-6 border-t border-gray-100 pt-5 text-center text-xs text-gray-500">
      By continuing, you agree to our{" "}
      <Link href="/terms" className="font-medium text-brand">
        Terms of service
      </Link>{" "}
      &amp;{" "}
      <Link href="/privacy-policy" className="font-medium text-brand">
        Privacy policy
      </Link>
    </p>
  );
}
