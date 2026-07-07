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
  if (!lanIp) {
    console.warn("\nCould not detect LAN IP. Run ipconfig and use your Wi-Fi IPv4 address.\n");
    return;
  }

  console.log("");
  console.log(`  Local:    http://localhost:${port}`);
  console.log(`  Network:  http://${lanIp}:${port}`);
  console.log("");
}

const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");

const child = spawn(process.execPath, [nextBin, "dev", "-H", "0.0.0.0", "-p", port], {
  cwd: root,
  env: process.env
});

let readyNoticePrinted = false;

function handleOutput(chunk, stream) {
  let text = chunk.toString();

  if (lanIp) {
    text = text.replaceAll(`http://0.0.0.0:${port}`, `http://${lanIp}:${port}`);
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
