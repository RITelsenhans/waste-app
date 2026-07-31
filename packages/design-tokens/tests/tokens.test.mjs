import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { generateCss } from "../scripts/generate-css.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function relativeLuminance(hexColor) {
  const [red, green, blue] = hexColor
    .slice(1)
    .match(/../g)
    .map((value) => Number.parseInt(value, 16) / 255)
    .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(firstColor, secondColor) {
  const firstLuminance = relativeLuminance(firstColor);
  const secondLuminance = relativeLuminance(secondColor);

  return (
    (Math.max(firstLuminance, secondLuminance) + 0.05) /
    (Math.min(firstLuminance, secondLuminance) + 0.05)
  );
}

test("generated CSS is current and contains the required Regio-IT tokens", async () => {
  const tokens = JSON.parse(await readFile(resolve(packageRoot, "tokens.json"), "utf8"));
  const css = await readFile(resolve(packageRoot, "src/tokens.css"), "utf8");

  assert.equal(css, await generateCss(tokens));
  assert.match(css, /--brand-primary: #c8102e;/i);
  assert.match(css, /--text-strong: #17233a;/i);
  assert.match(css, /--accent-info: #008f8c;/i);
  assert.match(css, /--accent-info-strong: #006d6a;/i);
  assert.match(css, /--surface-page: #f6f8fb;/i);
  assert.match(css, /--control-target-min: 2.75rem;/i);
  assert.match(css, /--focus-width: 3px;/i);
});

test("required Regio-IT color pairs meet their intended contrast thresholds", async () => {
  const tokens = JSON.parse(await readFile(resolve(packageRoot, "tokens.json"), "utf8"));

  assert.ok(contrastRatio(tokens.brand.primary, tokens.text.inverse) >= 4.5);
  assert.ok(contrastRatio(tokens.text.strong, tokens.surface.page) >= 4.5);
  assert.ok(contrastRatio(tokens.text.muted, tokens.surface.page) >= 4.5);
  assert.ok(contrastRatio(tokens.focus.color, tokens.surface.page) >= 3);
  assert.ok(contrastRatio(tokens.accent.info, tokens.surface.card) >= 3);
  assert.ok(contrastRatio(tokens.accent.infoStrong, tokens.surface.card) >= 4.5);
});
