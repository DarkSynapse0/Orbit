import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// Content-Security-Policy. Allows Google Identity Services (script + button iframe),
// self-hosted next/font, Google-hosted avatars, and connections to our API, Google,
// and Solana RPC. Dev adds unsafe-eval + localhost websockets for HMR/Turbopack.
const csp = [
  `default-src 'self'`,
  `base-uri 'self'`,
  `object-src 'none'`,
  `frame-ancestors 'none'`,
  `form-action 'self'`,
  `script-src 'self' 'unsafe-inline' https://accounts.google.com https://apis.google.com${isDev ? " 'unsafe-eval'" : ""}`,
  `style-src 'self' 'unsafe-inline' https://accounts.google.com https://fonts.googleapis.com`,
  `img-src 'self' data: blob: https:`,
  `font-src 'self' data: https://fonts.gstatic.com`,
  `frame-src 'self' https://accounts.google.com`,
  [
    `connect-src 'self'`,
    API_URL,
    `https://accounts.google.com`,
    `https://*.googleusercontent.com`,
    `https://*.solana.com`,
    `https://api.devnet.solana.com`,
    `https://api.mainnet-beta.solana.com`,
    isDev ? "ws: http://localhost:* http://127.0.0.1:*" : "",
  ]
    .filter(Boolean)
    .join(" "),
]
  .filter(Boolean)
  .join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
