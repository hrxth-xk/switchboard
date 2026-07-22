import { getAllowedDevOrigins } from "./scripts/dev-network.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow phones / other devices on the same Wi‑Fi to load /_next/* in dev.
  // Private-network wildcards cover DHCP IP changes (192.168.0.105 → .107, etc.).
  allowedDevOrigins: getAllowedDevOrigins()
};

export default nextConfig;
