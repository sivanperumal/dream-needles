import { PolicyPage, policyMetadata } from "@/components/content/policy-page";

export const generateMetadata = () => policyMetadata("terms");

export default function Page() {
  return <PolicyPage slug="terms" />;
}
