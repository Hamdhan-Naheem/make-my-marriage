import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@make-my-marriage/shared"],
  async rewrites() {
    const apiOrigin = process.env.API_ORIGIN ?? "http://localhost:4000";

    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiOrigin.replace(/\/$/, "")}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
