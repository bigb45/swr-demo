import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  async redirects() {
    // The /industries hub pages were retired; keep old locale-prefixed URLs
    // alive with permanent redirects into the shop.
    return [
      {
        source: "/:locale/industries",
        destination: "/:locale/shop",
        permanent: true,
      },
      {
        source: "/:locale/industries/:slug",
        destination: "/:locale/shop",
        permanent: true,
      },
    ];
  },
  images: {
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/pub/media/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/media/**",
      },
      {
        protocol: "http",
        hostname: "46.224.237.247",
        pathname: "/pub/media/**",
      },
      {
        protocol: "http",
        hostname: "46.224.237.247",
        pathname: "/media/**",
      },
      {
        protocol: "https",
        hostname: "bimblobs.blob.core.windows.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "app.nextpim.de",
        pathname: "/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
