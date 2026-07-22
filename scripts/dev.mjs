import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getLanIp } from "./dev-network.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = process.env.PORT ?? "3000";
const lanIp = getLanIp();

if (lanIp) {
  process.env.DEV_HOST = lanIp;
}

function printNetworkUrls() {
  console.log("");
  console.log(`  Local:    http://localhost:${port}`);
  if (lanIp) {
    console.log(`  Network:  http://${lanIp}:${port}`);
    console.log("");
    console.log("  Phone tip: use the Network URL above (same Wi‑Fi).");
    console.log("  If it still fails, run once as Admin: npm run dev:firewall");
  } else {
    console.warn("\n  Could not detect LAN IP. Run ipconfig and use your Wi‑Fi IPv4 address.\n");
  }
  console.log("");
}

const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");

const child = spawn(process.execPath, [nextBin, "dev", "-H", "0.0.0.0", "-p", port], {
  cwd: root,
  env: process.env,
  stdio: ["inherit", "pipe", "pipe"]
});

let readyNoticePrinted = false;

function handleOutput(chunk, stream) {
  let text = chunk.toString();

  if (lanIp) {
    text = text.replaceAll(`http://0.0.0.0:${port}`, `http://${lanIp}:${port}`);
  }

  // Soften the old confusing Next warning if it still appears for some hosts
  if (text.includes("Blocked cross-origin request")) {
    text +=
      "\n  → Restart after next.config changes, or run: npm run dev:firewall\n";
  }

  stream.write(text);

  if (!readyNoticePrinted && text.includes("Ready in")) {
    readyNoticePrinted = true;
    printNetworkUrls();
  }
}

child.stdout.on("data", (chunk) => {
  handleOutput(chunk, process.stdout);
});

child.stderr.on("data", (chunk) => {
  handleOutput(chunk, process.stderr);
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
