import { readFile } from "node:fs/promises";

const report = JSON.parse(
  await readFile(process.argv[2] ?? "build/quality-agent/quality-report.json", "utf8"),
);

if (report.overallStatus === "failed") {
  console.error(`Qualitätsbericht enthält ${report.statistics?.failed ?? 1} Fehler.`);
  process.exitCode = 1;
} else if (report.overallStatus === "warning") {
  console.warn(`Qualitätsbericht enthält ${report.statistics?.warnings ?? 1} Hinweise.`);
} else {
  console.log("Qualitätsbericht ist erfolgreich.");
}
