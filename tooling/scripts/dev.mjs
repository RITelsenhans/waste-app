import { spawn } from "node:child_process";
import process from "node:process";

const apiPort = process.env.SERVER_PORT ?? "8080";
const webPort = process.env.PORT ?? "3000";
const services = [
  {
    command: "dev:api",
    label: "API",
    url: `http://localhost:${apiPort}/v1/health/ready`,
  },
  { command: "dev:web", label: "Web", url: `http://localhost:${webPort}/demo` },
];

let stopping = false;
let stoppedServices = 0;

const children = services.map(({ command, label, url }) => {
  console.log(`[start] ${label}: ${url}`);
  const child = spawn("pnpm", [command], {
    env: process.env,
    stdio: "inherit",
  });

  child.on("error", (error) => {
    console.error(`[fehler] ${label} konnte nicht gestartet werden: ${error.message}`);
    stopAll("SIGTERM", 1);
  });

  child.on("exit", (code, signal) => {
    stoppedServices += 1;

    if (!stopping) {
      const reason = signal ? `Signal ${signal}` : `Exit-Code ${code ?? 1}`;
      console.error(`[ende] ${label} wurde beendet (${reason}).`);
      stopAll("SIGTERM", code ?? 1);
    }

    if (stoppedServices === services.length) {
      process.exit(process.exitCode ?? 0);
    }
  });

  return child;
});

function stopAll(signal, exitCode = 0) {
  if (stopping) {
    return;
  }

  stopping = true;
  process.exitCode = exitCode;
  for (const child of children) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
}

process.on("SIGINT", () => stopAll("SIGINT"));
process.on("SIGTERM", () => stopAll("SIGTERM"));
