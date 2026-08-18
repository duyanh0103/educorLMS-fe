import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "10.0.12.154",
    "10.100.1.150",
    "192.168.2.9",
    "172.16.0.79",
    "10.0.12.102",
    "192.168.1.242",
  ],
};

export default nextConfig;
