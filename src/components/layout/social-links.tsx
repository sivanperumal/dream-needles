import { SocialIcon, type SocialNetwork } from "@/components/icons/social";
import { cn } from "@/lib/utils";

const NETWORKS: { key: SocialNetwork; label: string }[] = [
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "youtube", label: "YouTube" },
  { key: "whatsapp", label: "WhatsApp" },
];

/** Social icons; links come from store settings (empty ones are hidden). */
export function SocialLinks({
  links,
  className,
  itemClassName,
  iconClassName,
}: {
  links: Record<string, string>;
  className?: string;
  itemClassName?: string;
  iconClassName?: string;
}) {
  const configured = NETWORKS.filter((n) => links[n.key]);
  // Before links are set in admin, show the icons (unlinked) so the layout matches Figma.
  const items = configured.length ? configured : NETWORKS;
  return (
    <ul className={cn("flex items-center", className)}>
      {items.map(({ key, label }) => (
        <li key={key}>
          {links[key] ? (
            <a
              href={links[key]}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className={cn(
                "flex items-center justify-center transition-opacity hover:opacity-75",
                itemClassName,
              )}
            >
              <SocialIcon network={key} className={iconClassName} />
            </a>
          ) : (
            <span
              className={cn("flex items-center justify-center", itemClassName)}
              title={label}
            >
              <SocialIcon network={key} className={iconClassName} />
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
