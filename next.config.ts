import type { NextConfig } from "next";
import os from "os";

const nextConfig: NextConfig = {
  basePath: "/cortinas",
  turbopack: {
    // node_modules y .next viven fuera de OneDrive (~/.dev-cache) en máquinas
    // donde el proyecto está dentro de una carpeta sincronizada, para evitar
    // que la sincronización en la nube corrompa el dev server; esto le
    // permite a Turbopack seguir esos symlinks. os.homedir() se resuelve
    // dinámicamente para no romper el build en servidores como Vercel.
    root: os.homedir(),
  },
};

export default nextConfig;
