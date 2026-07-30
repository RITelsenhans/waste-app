import { spawnSync } from "node:child_process";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const committedOutput = resolve(packageRoot, "src/generated");
const temporaryRoot = await mkdtemp(resolve(tmpdir(), "waste-api-client-"));
const temporaryOutput = resolve(temporaryRoot, "generated");

async function readFiles(root, current = root) {
  const entries = await readdir(current, { withFileTypes: true });
  const files = new Map();

  for (const entry of entries) {
    const entryPath = resolve(current, entry.name);
    if (entry.isDirectory()) {
      const nested = await readFiles(root, entryPath);
      for (const [name, content] of nested) {
        files.set(name, content);
      }
    } else if (entry.isFile()) {
      files.set(relative(root, entryPath), await readFile(entryPath, "utf8"));
    }
  }

  return files;
}

try {
  const generator = resolve(packageRoot, "node_modules/@hey-api/openapi-ts/bin/run.js");
  const result = spawnSync(process.execPath, [generator], {
    cwd: packageRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      OPENAPI_OUTPUT: temporaryOutput,
    },
  });

  if (result.status !== 0) {
    process.stderr.write(result.stdout);
    process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  }

  const [committedFiles, generatedFiles] = await Promise.all([
    readFiles(committedOutput),
    readFiles(temporaryOutput),
  ]);
  const fileNames = new Set([...committedFiles.keys(), ...generatedFiles.keys()]);
  const changedFiles = [...fileNames]
    .filter((name) => committedFiles.get(name) !== generatedFiles.get(name))
    .sort();

  if (changedFiles.length > 0) {
    process.stderr.write(
      `Der generierte API-Client ist nicht aktuell:\n${changedFiles.map((name) => `- ${name}`).join("\n")}\n`,
    );
    process.stderr.write("Führe `pnpm contracts:generate` aus und prüfe die Änderungen.\n");
    process.exitCode = 1;
  } else {
    process.stdout.write("Der generierte API-Client entspricht dem OpenAPI-Vertrag.\n");
  }
} finally {
  await rm(temporaryRoot, { force: true, recursive: true });
}
