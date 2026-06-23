import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/cortinas",
  turbopack: {
    // node_modules y .next viven fuera de OneDrive (~/.dev-cache) para evitar que
    // la sincronización en la nube corrompa el dev server; esto le permite a
    // Turbopack seguir esos symlinks.
    root: "/Users/agarridob",
  },
};

export default nextConfig;
