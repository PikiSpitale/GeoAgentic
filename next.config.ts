import type { NextConfig } from "next";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
