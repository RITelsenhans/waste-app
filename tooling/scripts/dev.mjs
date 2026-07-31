import { spawn } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { createServer } from "node:net";
import { resolve } from "node:path";
import process from "node:process";

const apiPort = readPort("SERVER_PORT", "8080");
const webPort = readPort("PORT", "3000");
const adminPort = readPort("ADMIN_PORT", "3001");
const databasePort = readPort("POSTGRES_PORT", "55432");
const apiReadyUrl = `http://127.0.0.1:${apiPort}/v1/health/ready`;
const databaseRoot = resolve("build/dev-postgres");
const databaseData = resolve(databaseRoot, "data");
const databaseSocket = resolve(databaseRoot, "socket");
const playwrightBuild = process.env.NEXT_DIST_DIR === ".next-playwright";
const playwrightSourceSnapshots = playwrightBuild
  ? [
      "apps/web/next-env.d.ts",
      "apps/web/tsconfig.json",
      "apps/admin/next-env.d.ts",
      "apps/admin/tsconfig.json",
    ].map((file) => ({ file, content: readFileSync(file, "utf8") }))
  : [];
const externalDatabaseUrl = process.env.POSTGRES_EXTERNAL_URL;
const postgresBin = externalDatabaseUrl ? undefined : findPostgresBin();
const databaseEnvironment = {
  SPRING_DATASOURCE_PASSWORD: "",
  SPRING_DATASOURCE_URL:
    externalDatabaseUrl ?? `jdbc:postgresql://127.0.0.1:${databasePort}/waste_app`,
  SPRING_DATASOURCE_USERNAME: "waste_app",
};
const apiBaseUrl = `http://127.0.0.1:${apiPort}`;

const services = {
  api: {
    args: [":services:api:bootRun"],
    env: {
      ...databaseEnvironment,
      WASTE_ADMIN_ORIGIN: `http://localhost:${adminPort}`,
      WASTE_WEB_ORIGIN: `http://localhost:${webPort}`,
    },
    executable: "./gradlew",
    label: "API",
    url: apiReadyUrl,
  },
  web: {
    args: ["node_modules/next/dist/bin/next", "dev", "-p", String(webPort)],
    cwd: "apps/web",
    env: { API_BASE_URL: apiBaseUrl, NEXT_PUBLIC_API_BASE_URL: apiBaseUrl },
    executable: process.execPath,
    label: "Bürgeransicht",
    url: `http://localhost:${webPort}/demo`,
  },
  admin: {
    args: ["node_modules/next/dist/bin/next", "dev", "-p", String(adminPort)],
    cwd: "apps/admin",
    env: { NEXT_PUBLIC_API_BASE_URL: apiBaseUrl },
    executable: process.execPath,
    label: "Pilotpflege",
    url: `http://localhost:${adminPort}`,
  },
  database: postgresBin
    ? {
        args: [
          "-D",
          databaseData,
          "-h",
          "127.0.0.1",
          "-p",
          String(databasePort),
          "-k",
          databaseSocket,
        ],
        executable: `${postgresBin}/postgres`,
        label: "PostgreSQL",
        url: `postgresql://127.0.0.1:${databasePort}/waste_app`,
      }
    : undefined,
};

const children = new Set();
let stopping = false;
let playwrightBuildCleaned = false;

process.on("SIGINT", () => stopAll("SIGTERM"));
process.on("SIGTERM", () => stopAll("SIGTERM"));

try {
  const localPorts = externalDatabaseUrl
    ? [apiPort, webPort, adminPort]
    : [apiPort, webPort, adminPort, databasePort];
  if (new Set(localPorts).size !== localPorts.length)
    throw new Error("Web, Pilotpflege, API und PostgreSQL benötigen unterschiedliche Ports.");
  const portChecks = [
    assertPortAvailable(apiPort, "API"),
    assertPortAvailable(webPort, "Bürgeransicht"),
    assertPortAvailable(adminPort, "Pilotpflege"),
  ];
  if (!externalDatabaseUrl) portChecks.push(assertPortAvailable(databasePort, "PostgreSQL"));
  await Promise.all(portChecks);

  await buildDesignTokens();
  if (services.database) {
    await prepareDatabase();
    startService(services.database);
    console.log("[warte] PostgreSQL wird initialisiert …");
    await waitForPostgres();
    await ensureDatabase();
  } else {
    console.log("[verwenden] Extern bereitgestelltes PostgreSQL für den Testlauf.");
  }

  startService(services.api);
  console.log("[warte] API und Datenmigrationen werden initialisiert …");
  await waitUntilReady(apiReadyUrl, 120_000);

  if (!stopping) {
    console.log(`[bereit] API: ${apiReadyUrl}`);
    startService(services.web);
    startService(services.admin);
    console.log("\n[bereit] Funktionaler Pilot gestartet:");
    console.log(`         Bürgeransicht: ${services.web.url}`);
    console.log(`         Pflege-Unit:    ${services.admin.url}`);
    console.log("         Beenden:        Ctrl+C\n");
  }
} catch (error) {
  console.error(`[fehler] ${error instanceof Error ? error.message : String(error)}`);
  stopAll("SIGTERM", 1);
}

function readPort(variableName, fallback) {
  const value = process.env[variableName] ?? fallback;
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65_535)
    throw new Error(`${variableName} muss ein gültiger TCP-Port sein, erhalten: ${value}`);
  return port;
}

function findPostgresBin() {
  const candidates = [
    process.env.POSTGRES_BIN_DIR,
    "/opt/homebrew/opt/postgresql@17/bin",
    "/usr/local/opt/postgresql@17/bin",
  ].filter(Boolean);
  const match = candidates.find(
    (candidate) => existsSync(`${candidate}/postgres`) && existsSync(`${candidate}/initdb`),
  );
  if (!match)
    throw new Error(
      "PostgreSQL 17 wurde nicht gefunden. Installiere es einmalig mit `brew install postgresql@17` oder setze POSTGRES_BIN_DIR.",
    );
  return match;
}

async function assertPortAvailable(port, label) {
  const available = await new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", (error) => (error.code === "EADDRINUSE" ? resolve(false) : reject(error)));
    server.once("listening", () => server.close(() => resolve(true)));
    server.listen({ exclusive: true, host: "127.0.0.1", port });
  });
  if (!available)
    throw new Error(
      `${label}-Port ${port} ist bereits belegt. Beende den alten Entwicklungsprozess mit Ctrl+C und starte danach erneut \`pnpm dev\`.`,
    );
}

async function buildDesignTokens() {
  console.log("[vorbereiten] Design Tokens werden aktualisiert …");
  await run(process.execPath, ["packages/design-tokens/scripts/build.mjs"], {
    label: "Design Tokens",
  });
}

async function prepareDatabase() {
  if (!postgresBin) throw new Error("PostgreSQL-Binärverzeichnis fehlt.");
  await mkdir(databaseSocket, { recursive: true });
  if (!existsSync(resolve(databaseData, "PG_VERSION"))) {
    await mkdir(databaseData, { recursive: true });
    console.log("[vorbereiten] Lokale PostgreSQL-Datenbank wird einmalig angelegt …");
    await run(
      `${postgresBin}/initdb`,
      [
        "--username=waste_app",
        "--auth=trust",
        "--encoding=UTF8",
        "--locale=C",
        "--no-instructions",
        "-D",
        databaseData,
      ],
      { label: "PostgreSQL-Initialisierung" },
    );
  }
}

async function waitForPostgres() {
  if (!postgresBin) throw new Error("PostgreSQL-Binärverzeichnis fehlt.");
  const deadline = Date.now() + 30_000;
  while (!stopping && Date.now() < deadline) {
    const result = await run(
      `${postgresBin}/pg_isready`,
      ["-h", "127.0.0.1", "-p", String(databasePort), "-U", "waste_app"],
      { allowFailure: true, quiet: true },
    );
    if (result.code === 0) return;
    await delay(250);
  }
  throw new Error("PostgreSQL wurde innerhalb von 30 Sekunden nicht bereit.");
}

async function ensureDatabase() {
  if (!postgresBin) throw new Error("PostgreSQL-Binärverzeichnis fehlt.");
  const check = await run(
    `${postgresBin}/psql`,
    [
      "-h",
      "127.0.0.1",
      "-p",
      String(databasePort),
      "-U",
      "waste_app",
      "-d",
      "postgres",
      "-tAc",
      "SELECT 1 FROM pg_database WHERE datname = 'waste_app'",
    ],
    { quiet: true },
  );
  if (check.output.trim() !== "1") {
    console.log("[vorbereiten] Datenbank waste_app wird angelegt …");
    await run(
      `${postgresBin}/createdb`,
      ["-h", "127.0.0.1", "-p", String(databasePort), "-U", "waste_app", "waste_app"],
      { label: "Datenbankanlage" },
    );
  }
}

function startService({ args, cwd, env, executable, label, url }) {
  console.log(`[start] ${label}: ${url}`);
  const child = spawn(executable, args, {
    cwd,
    detached: process.platform !== "win32",
    env: { ...process.env, ...env },
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

async function waitUntilReady(url, timeout) {
  const deadline = Date.now() + timeout;
  while (!stopping && Date.now() < deadline) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1_000) });
      if (response.ok) return;
    } catch {
      /* kontrollierter Start */
    }
    await delay(250);
  }
  if (!stopping) throw new Error("Die API wurde innerhalb von 120 Sekunden nicht bereit.");
}

function run(
  executable,
  args,
  { allowFailure = false, env, label = executable, quiet = false } = {},
) {
  return new Promise((resolve, reject) => {
    let output = "";
    const child = spawn(executable, args, {
      env: { ...process.env, ...env },
      stdio: quiet ? ["ignore", "pipe", "pipe"] : "inherit",
    });
    if (quiet) {
      child.stdout.on("data", (chunk) => {
        output += chunk;
      });
      child.stderr.on("data", (chunk) => {
        output += chunk;
      });
    }
    child.once("error", reject);
    child.once("close", (code, signal) => {
      const result = { code: code ?? 1, output };
      if (code === 0 || allowFailure) resolve(result);
      else
        reject(
          new Error(
            `${label} ist fehlgeschlagen (${signal ? `Signal ${signal}` : `Exit-Code ${code ?? 1}`}).`,
          ),
        );
    });
  });
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function stopAll(signal, exitCode = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = exitCode;
  if (children.size > 0) console.log("[stopp] PostgreSQL, API und Oberflächen werden beendet …");
  for (const child of children) terminateProcessTree(child, signal);
  exitWhenStopped();
}

function terminateProcessTree(child, signal) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  try {
    if (process.platform === "win32" || child.pid === undefined) child.kill(signal);
    else process.kill(-child.pid, signal);
  } catch (error) {
    if (error.code !== "ESRCH")
      console.error(`[warnung] Prozess ${child.pid ?? "unbekannt"} blieb aktiv: ${error.message}`);
  }
}

function exitWhenStopped() {
  if (stopping && children.size === 0) {
    cleanupPlaywrightBuild();
    process.exit(process.exitCode ?? 0);
  }
}

function cleanupPlaywrightBuild() {
  if (!playwrightBuild || playwrightBuildCleaned) return;
  playwrightBuildCleaned = true;
  for (const snapshot of playwrightSourceSnapshots) writeFileSync(snapshot.file, snapshot.content);
  rmSync(resolve("apps/web/.next-playwright"), { force: true, recursive: true });
  rmSync(resolve("apps/admin/.next-playwright"), { force: true, recursive: true });
}
