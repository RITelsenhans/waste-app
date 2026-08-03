import { spawn } from "node:child_process";
import process from "node:process";

const accessPassword = process.env.DEMO_ACCESS_PASSWORD;
const sessionSecret = process.env.DEMO_SESSION_SECRET;

if (!accessPassword || accessPassword.length < 12) {
  fail("DEMO_ACCESS_PASSWORD fehlt oder ist kürzer als 12 Zeichen.");
}
if (!sessionSecret || sessionSecret.length < 32) {
  fail("DEMO_SESSION_SECRET fehlt oder ist kürzer als 32 Zeichen.");
}

console.log("[sicher] Codespaces-Freigabemodus mit Anmeldung wird gestartet.");
console.log("[sicher] Pilotpflege, Mailversand und öffentliche API-Ports bleiben deaktiviert.");

const child = spawn(process.execPath, ["tooling/scripts/dev.mjs"], {
  env: {
    ...process.env,
    DEMO_AUTH_REQUIRED: "true",
    DEMO_COOKIE_SECURE: process.env.DEMO_COOKIE_SECURE ?? "true",
    DEMO_SHARE_MODE: "true",
    NEXT_PUBLIC_API_BASE_URL: "",
    WASTE_MAIL_ENABLED: "false",
    WASTE_PILOT_ADMIN_ENABLED: "false",
  },
  stdio: "inherit",
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.once("error", (error) =>
  fail(`Freigabemodus konnte nicht gestartet werden: ${error.message}`),
);
child.once("close", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});

function fail(message) {
  console.error(`[fehler] ${message}`);
  process.exit(1);
}
