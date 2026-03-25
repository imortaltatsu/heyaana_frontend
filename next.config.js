/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "t.me",
      },
      {
        protocol: "https",
        hostname: "*.telegram.org",
      },
    ],
  },
  serverExternalPackages: ["@coinbase/cdp-sdk", "@base-org/account"],
};

module.exports = nextConfig;
