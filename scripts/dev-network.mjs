import { networkInterfaces } from "node:os";

const PREFERRED_INTERFACES = ["Wi-Fi", "WiFi", "Ethernet", "en0", "eth0"];

function isIPv4(net) {
  return net.family === "IPv4" || net.family === 4;
}

export function getLanIp() {
  if (process.env.DEV_HOST) {
    return process.env.DEV_HOST;
  }

  const nets = networkInterfaces();

  for (const name of PREFERRED_INTERFACES) {
    const ifaces = nets[name];
    if (!ifaces) continue;
    for (const net of ifaces) {
      if (isIPv4(net) && !net.internal) {
        return net.address;
      }
    }
  }

  for (const ifaces of Object.values(nets)) {
    for (const net of ifaces ?? []) {
      if (isIPv4(net) && !net.internal) {
        return net.address;
      }
    }
  }

  return null;
}

export function getDevOrigins() {
  const ip = getLanIp();
  return ip ? [ip] : [];
}
