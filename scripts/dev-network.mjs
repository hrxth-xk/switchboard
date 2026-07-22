import { networkInterfaces } from "node:os";

const PREFERRED_INTERFACES = ["Wi-Fi", "WiFi", "WLAN", "Ethernet", "en0", "eth0"];

function isIPv4(net) {
  return net.family === "IPv4" || net.family === 4;
}

function isPrivateLanIp(address) {
  if (!address || address.startsWith("127.")) return false;
  if (address.startsWith("10.")) return true;
  if (address.startsWith("192.168.")) return true;
  const match = address.match(/^172\.(\d+)\./);
  if (!match) return false;
  const second = Number(match[1]);
  return second >= 16 && second <= 31;
}

/** Every non-loopback IPv4 address on this machine. */
export function getAllLanIps() {
  const nets = networkInterfaces();
  const ips = [];

  for (const ifaces of Object.values(nets)) {
    for (const net of ifaces ?? []) {
      if (isIPv4(net) && !net.internal && isPrivateLanIp(net.address)) {
        ips.push(net.address);
      }
    }
  }

  return [...new Set(ips)];
}

export function getLanIp() {
  if (process.env.DEV_HOST && isPrivateLanIp(process.env.DEV_HOST)) {
    return process.env.DEV_HOST;
  }

  const nets = networkInterfaces();

  for (const name of PREFERRED_INTERFACES) {
    const ifaces = nets[name];
    if (!ifaces) continue;
    for (const net of ifaces) {
      if (isIPv4(net) && !net.internal && isPrivateLanIp(net.address)) {
        return net.address;
      }
    }
  }

  return getAllLanIps()[0] ?? null;
}

/**
 * Origins Next.js should accept for /_next/* when opening the app from a phone.
 * Uses private-network wildcards so DHCP IP changes don't break mobile again.
 */
export function getAllowedDevOrigins() {
  const patterns = ["192.168.*.*", "10.*.*.*"];

  for (let octet = 16; octet <= 31; octet += 1) {
    patterns.push(`172.${octet}.*.*`);
  }

  return [...new Set([...getAllLanIps(), ...patterns])];
}

/** @deprecated Prefer getAllowedDevOrigins */
export function getDevOrigins() {
  return getAllowedDevOrigins();
}
