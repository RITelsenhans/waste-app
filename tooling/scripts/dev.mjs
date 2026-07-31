import { spawn } from "node:child_process";
import { createServer } from "node:net";
import process from "node:process";

const apiPort = readPort("SERVER_PORT", "8080");
const webPort = readPort("PORT", "3000");
const apiReadyUrl = `http://127.0.0.1:${apiPort}/v1/health/ready`;
const services = {
  api: {
    args: [":services:api:bootRun"],
    executable: "./gradlew",
    label: "API",
    url: apiReadyUrl,
  },
  web: {
    args: ["node_modules/next/dist/bin/next", "dev"],
    cwd: "apps/web",
    executable: process.execPath,
    label: "Web",
    url: `http://localhost:${webPort}/demo`,
  },
};

const children = new Set();
let stopping = false;

process.on("SIGINT", () => stopAll("SIGTERM"));
process.on("SIGTERM", () => stopAll("SIGTERM"));

try {
  if (apiPort === webPort) {
    throw new Error(`API und Web dürfen nicht denselben Port ${apiPort} verwenden.`);
  }

  await assertPortAvailable(apiPort, "API");
  await assertPortAvailable(webPort, "Web");

  await buildDesignTokens();
  startService(services.api);
  console.log("[warte] API wird initialisiert …");
  await waitUntilReady(apiReadyUrl);

  if (!stopping) {
    console.log(`[bereit] API: ${apiReadyUrl}`);
    startService(services.web);
  }
} catch (error) {
  console.error(`[fehler] ${error instanceof Error ? error.message : String(error)}`);
  stopAll("SIGTERM", 1);
}

function readPort(variableName, fallback) {
  const value = process.env[variableName] ?? fallback;
  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`${variableName} muss ein gültiger TCP-Port sein, erhalten: ${value}`);
  }

  return port;
}

async function assertPortAvailable(port, label) {
  const available = await new Promise((resolve, reject) => {
    const server = createServer();

    server.once("error", (error) => {
      if (error.code === "EADDRINUSE") {
        resolve(false);
        return;
      }

      reject(error);
    });
    server.once("listening", () => server.close(() => resolve(true)));
    server.listen({ exclusive: true, port });
  });

  if (!available) {
    throw new Error(
      `${label}-Port ${port} ist bereits belegt. Beende den alten Entwicklungsprozess mit Ctrl+C und starte danach erneut \`pnpm dev\`.`,
    );
  }
}

async function buildDesignTokens() {
  console.log("[vorbereiten] Design Tokens werden aktualisiert …");

  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["packages/design-tokens/scripts/build.mjs"], {
      env: process.env,
      stdio: "inherit",
    });

    child.once("error", reject);
    child.once("close", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      const reason = signal ? `Signal ${signal}` : `Exit-Code ${code ?? 1}`;
      reject(new Error(`Design Tokens konnten nicht erzeugt werden (${reason}).`));
    });
  });
}

function startService({ args, cwd, executable, label, url }) {
  console.log(`[start] ${label}: ${url}`);
  const child = spawn(executable, args, {
    cwd,
    detached: process.platform !== "win32",
    env: process.env,
    stdio: "inherit",
  });

  children.add(child);

  child.once("error", (error) => {
    console.error(`[fehler] ${label} konnte nicht gestartet werden: ${error.message}`);
    stopAll("SIGTERM", 1);
  });

  child.once("close", (code, signal) => {
    children.delete(child);

    if (!stopping) {
      const reason = signal ? `Signal ${signal}` : `Exit-Code ${code ?? 1}`;
      console.error(`[ende] ${label} wurde beendet (${reason}).`);
      stopAll("SIGTERM", code ?? 1);
    }

    exitWhenStopped();
  });

  return child;
}

async function waitUntilReady(url) {
  const deadline = Date.now() + 120_000;

  while (!stopping && Date.now() < deadline) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1_000) });
      if (response.ok) {
        return;
      }
    } catch {
      // Die API darf während des kontrollierten Starts noch nicht erreichbar sein.
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  if (!stopping) {
    throw new Error("Die API wurde innerhalb von 120 Sekunden nicht bereit.");
  }
}

function stopAll(signal, exitCode = 0) {
  if (stopping) {
    return;
  }

  stopping = true;
  process.exitCode = exitCode;

  if (children.size > 0) {
    console.log("[stopp] API und Web werden beendet …");
  }

  for (const child of children) {
    terminateProcessTree(child, signal);
  }

  exitWhenStopped();
}

function terminateProcessTree(child, signal) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  try {
    if (process.platform === "win32" || child.pid === undefined) {
      child.kill(signal);
    } else {
      process.kill(-child.pid, signal);
    }
  } catch (error) {
    if (error.code !== "ESRCH") {
      console.error(`[warnung] Prozess ${child.pid ?? "unbekannt"} blieb aktiv: ${error.message}`);
    }
  }
}

function exitWhenStopped() {
  if (stopping && children.size === 0) {
    process.exit(process.exitCode ?? 0);
  }
}
