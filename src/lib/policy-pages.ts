/** Static policy routes backed by the `pages` table. */
export const POLICY_PAGES = {
  "privacy-policy": "Privacy Policy",
  "shipping-policy": "Shipping Policy",
  "refund-policy": "Refund Policy",
  terms: "Terms of Service",
} as const;

export type PolicySlug = keyof typeof POLICY_PAGES;

export const isPolicySlug = (slug: string): slug is PolicySlug =>
  slug in POLICY_PAGES;
