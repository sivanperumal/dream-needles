import Image from "next/image";

/** Split-screen layout for sign-in (Figma 64:3 / 65:125): form left, yarn wall right. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh flex-1 lg:grid-cols-2">
      <main className="flex flex-col bg-brand-light/70 px-4 py-8 md:px-8">
        {children}
      </main>
      <div className="relative hidden lg:block">
        <Image
          src="/images/pages/auth-yarn-wall.jpg"
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
      </div>
    </div>
  );
}
