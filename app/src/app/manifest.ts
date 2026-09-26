import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Orbit — self-driving savings",
    short_name: "Orbit",
    description:
      "Set aside a little from everyday spending and grow it with on-chain USDC yield on Solana. Self-custodial, withdraw anytime.",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    background_color: "#0b0d10",
    theme_color: "#0b0d10",
    categories: ["finance"],
    icons: [
      { src: "/icon.png", sizes: "256x256", type: "image/png", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
