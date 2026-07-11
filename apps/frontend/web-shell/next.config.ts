import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Raíz del monorepo (3 niveles arriba de apps/frontend/web-shell).
    // `next` y los paquetes @leanstart/* viven en el node_modules de la raíz;
    // si el root apunta a web-shell/, Turbopack no puede resolverlos hacia arriba.
    root: path.resolve(__dirname, "../../.."),
  },
  transpilePackages: [
    "@leanstart/commons",
    "@leanstart/dashboard-front",
    "@leanstart/empresas-front",
    "@leanstart/notificaciones-front",
    "@leanstart/administrador-front",
    "@leanstart/mentor-front",
  ],
};

export default nextConfig;
