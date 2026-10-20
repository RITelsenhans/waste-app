import wasteConfig from "@waste/eslint-config";

const config = [
  ...wasteConfig,
  {
    ignores: ["dist/**", "ios/**"],
  },
  {
    rules: {
      "@next/next/no-html-link-for-pages": "off",
    },
  },
];

export default config;
