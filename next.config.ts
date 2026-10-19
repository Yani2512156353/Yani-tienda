import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Las imagenes de productos viven en el bucket publico de Supabase Storage.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
