import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Dream Needles · Crochet tools & handmade crochet",
    template: "%s · Dream Needles",
  },
  description:
    "Crochet hooks, knitting tools and handmade crochet flowers, toys, blankets, bags and more. Shipped across India.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/images/brand/favicon-32.png", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#4d0851",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${outfit.variable} h-full`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
