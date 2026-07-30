import wasteConfig from "@waste/eslint-config";

const uiConfig = [
  ...wasteConfig,
  {
    rules: {
      // This package emits framework-neutral anchors and has no knowledge of Next.js page paths.
      "@next/next/no-html-link-for-pages": "off",
    },
  },
];

export default uiConfig;
