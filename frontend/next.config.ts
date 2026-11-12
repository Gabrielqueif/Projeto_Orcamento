import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["http://localhost:3000", "http://localhost:3001", "192.168.0.2:3000"],
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Orçamentos e obras viraram empreendimentos; links e favoritos antigos continuam funcionando.
  async redirects() {
    return [
      { source: "/orcamentos", destination: "/empreendimentos", permanent: true },
      { source: "/orcamentos/:path*", destination: "/empreendimentos/:path*", permanent: true },
      { source: "/obras", destination: "/empreendimentos", permanent: true },
      { source: "/obras/novo/:path*", destination: "/empreendimentos/novo", permanent: true },
    ];
  },
};

export default nextConfig;
