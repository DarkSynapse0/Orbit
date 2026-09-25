import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// Display: technical grotesque. Body: Inter. Numbers/addresses: JetBrains Mono.
const fontDisplay = Space_Grotesk({
  variable: "--ff-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});
const fontSans = Inter({ variable: "--ff-sans", subsets: ["latin"], display: "swap" });
const fontMono = JetBrains_Mono({ variable: "--ff-mono", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Orbit — money that saves itself",
  description:
    "Orbit sets aside a little from your everyday spending and grows it with on-chain yield. Self-custodial, verifiable, withdraw anytime.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fontDisplay.variable} ${fontSans.variable} ${fontMono.variable} h-full antialiased`}
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
