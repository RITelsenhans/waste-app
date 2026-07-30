import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { generateCss } from "./generate-css.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const tokens = JSON.parse(await readFile(resolve(packageRoot, "tokens.json"), "utf8"));
const formattedOutput = await generateCss(tokens);

await writeFile(resolve(packageRoot, "src/tokens.css"), formattedOutput, "utf8");
