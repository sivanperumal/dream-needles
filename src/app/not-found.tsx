import Link from "next/link";

/** Shown for unknown URLs and missing products/collections. */
export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-brand-light/40 px-4 py-24 text-center">
      <p className="text-6xl font-extrabold text-brand">404</p>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">
        We dropped a stitch
      </h1>
      <p className="mt-2 max-w-md text-gray-600">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-hover"
        >
          Back to home
        </Link>
        <Link
          href="/collections/whats-new"
          className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand ring-1 ring-purple-200"
        >
          See What&apos;s New
        </Link>
      </div>
    </main>
  );
}
