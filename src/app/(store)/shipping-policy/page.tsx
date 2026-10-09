import { PolicyPage, policyMetadata } from "@/components/content/policy-page";

export const generateMetadata = () => policyMetadata("shipping-policy");

export default function Page() {
  return <PolicyPage slug="shipping-policy" />;
}
