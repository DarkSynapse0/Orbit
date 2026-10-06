import type { Metadata } from "next";
import { Figtree, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// Figtree — the project-wide sans (matches helium.com). Variable font, so the full
// weight range loads; used for both headlines (--ff-display) and body (--ff-sans).
// Numbers stay on JetBrains Mono.
const fontFigtree = Figtree({
  variable: "--ff-display",
  subsets: ["latin"],
  display: "swap",
});
const fontSans = Figtree({ variable: "--ff-sans", subsets: ["latin"], display: "swap" });
const fontMono = JetBrains_Mono({ variable: "--ff-mono", subsets: ["latin"], display: "swap" });

// Set NEXT_PUBLIC_SITE_URL to your production origin for correct canonical + OG URLs.
// The default must be the real deployed domain so share-preview (og:image) URLs resolve.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://orbit-five-topaz.vercel.app";
const TITLE = "Orbit — money that saves itself";
const DESCRIPTION =
  "Orbit sets aside a little from your everyday spending and grows it with on-chain USDC yield on Solana. Self-custodial, verifiable, withdraw anytime.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s · Orbit",
  },
  description: DESCRIPTION,
  applicationName: "Orbit",
  category: "finance",
  keywords: [
    "Orbit",
    "self-driving savings",
    "automatic savings",
    "percentage savings",
    "Solana savings app",
    "on-chain yield",
    "USDC yield",
    "DeFi savings",
    "self-custody",
    "non-custodial savings",
    "crypto savings",
    "save and invest",
  ],
  authors: [{ name: "Orbit" }],
  creator: "Orbit",
  publisher: "Orbit",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "Orbit",
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Orbit — self-driving savings on Solana",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.png"],
  },
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    shortcut: ["/favicon.ico"],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  colorScheme: "light dark" as const,
};

// Structured data so search engines understand what Orbit is.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Orbit",
      url: SITE_URL,
      logo: `${SITE_URL}/icon.png`,
      description: DESCRIPTION,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Orbit",
      description: DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "SoftwareApplication",
      name: "Orbit",
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      url: SITE_URL,
      description: DESCRIPTION,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fontFigtree.variable} ${fontSans.variable} ${fontMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Set the theme class before paint to avoid a flash. Defaults to light. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'){document.documentElement.classList.add('dark')}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
