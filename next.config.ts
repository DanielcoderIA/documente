import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración para que pdf-parse funcione en el servidor de Next.js
  // pdf-parse usa módulos de Node.js que no están disponibles en el Edge Runtime
  serverExternalPackages: ["pdf-parse", "canvas"],

  // Permitir imágenes de avatares de Google (Clerk) y Supabase Storage
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // fotos de perfil de Google
      },
    ],
  },

  // Headers de seguridad recomendados para producción
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
