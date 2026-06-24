import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  transpilePackages: [
    "@leanstart/commons",
    "@leanstart/dashboard-front",
    "@leanstart/empresas-front",
    "@leanstart/notificaciones-front",
  ],
};

export default nextConfig;
