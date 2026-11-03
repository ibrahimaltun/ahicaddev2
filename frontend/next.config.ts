import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone",
  async rewrites() {
    // Gelistirme ortaminda /api/* isteklerini backend'e yonlendir.
    // Uretimdeki Caddy/Nginx gibi yol degistirilmeden iletilir:
    // /api/v1/* -> <backend>/api/v1/*
    const backendOrigin =
      process.env.API_PROXY_ORIGIN || "http://localhost:8000";

    return [
      {
        source: "/api/:path*",
        destination: `${backendOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
