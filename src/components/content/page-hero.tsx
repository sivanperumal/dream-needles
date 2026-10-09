import { Breadcrumbs, type Crumb } from "@/components/catalog/breadcrumbs";

export function PageHero({
  eyebrow,
  title,
  intro,
  crumbs,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  crumbs?: Crumb[];
  children?: React.ReactNode;
}) {
  return (
    <header className="bg-linear-to-b from-brand-light/60 to-transparent">
      <div className="container-page pt-6 pb-10 md:pb-14">
        {crumbs && <Breadcrumbs items={crumbs} />}
        <div className="mx-auto mt-8 max-w-3xl text-center">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-[#e8dcea] px-3 py-1 text-[11px] font-bold tracking-[1.1px] text-[#210023] uppercase">
            <span
              className="size-1.5 rounded-full bg-[#210023]"
              aria-hidden="true"
            />
            {eyebrow}
          </p>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#210023] md:text-5xl">
            {title}
          </h1>
          {intro && (
            <p className="mt-4 text-base text-gray-600 md:text-lg">{intro}</p>
          )}
          {children}
        </div>
      </div>
    </header>
  );
}
