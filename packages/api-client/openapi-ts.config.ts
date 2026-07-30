import { defineConfig } from "@hey-api/openapi-ts";

const outputPath = process.env.OPENAPI_OUTPUT ?? "./src/generated";

export default defineConfig({
  input: "../../contracts/openapi/abfall-api.yaml",
  output: {
    path: outputPath,
    postProcess: [
      {
        command: "prettier",
        args: ["--config", "../../prettier.config.mjs", "--write", "{{path}}"],
      },
    ],
  },
  plugins: ["@hey-api/client-fetch", "@hey-api/typescript", "@hey-api/sdk"],
});
