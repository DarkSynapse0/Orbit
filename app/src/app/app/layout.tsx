import type { Metadata } from "next";

// The signed-in dashboard is private, gated behind auth, and has no SEO value.
// Keep it out of the index while letting crawlers still reach the marketing site.
export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return children;
}
