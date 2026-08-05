import { mkdir, writeFile } from "node:fs/promises";

const analysis = process.env.QUALITY_AI_ANALYSIS;
if (!analysis) throw new Error("Die Codex-Analyse fehlt.");

const parsed = JSON.parse(analysis);
await mkdir("build/quality-agent", { recursive: true });
await writeFile("build/quality-agent/ai-analysis.json", JSON.stringify(parsed, null, 2));
