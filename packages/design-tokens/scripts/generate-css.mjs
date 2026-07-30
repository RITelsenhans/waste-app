import { format } from "prettier";

function toKebabCase(value) {
  return value.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

function flatten(value, path = []) {
  return Object.entries(value).flatMap(([key, entry]) => {
    const nextPath = [...path, toKebabCase(key)];
    return typeof entry === "object" && entry !== null
      ? flatten(entry, nextPath)
      : [[nextPath.join("-"), entry]];
  });
}

export async function generateCss(tokens) {
  const declarations = flatten(tokens)
    .map(([name, value]) => `  --${name}: ${value};`)
    .join("\n");
  const output = `/* Generated from tokens.json. Do not edit directly. */\n:root {\n${declarations}\n}\n`;

  return format(output, { parser: "css", printWidth: 100 });
}
