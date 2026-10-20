import { env } from "node:process";

import type { CapacitorConfig } from "@capacitor/cli";

const hostedDemoUrl = env.CAPACITOR_SERVER_URL?.trim();
const hostedDemoHost = hostedDemoUrl ? new URL(hostedDemoUrl).hostname : undefined;

const config: CapacitorConfig = {
  appId: "com.supplychaineers.abfallpilot",
  appName: "Abfall App Pilot",
  webDir: "dist",
  backgroundColor: "#f6f8fb",
  ios: {
    contentInset: "automatic",
  },
  ...(hostedDemoUrl
    ? {
        server: {
          url: hostedDemoUrl,
          allowNavigation: hostedDemoHost ? [hostedDemoHost] : [],
          cleartext: false,
          errorPath: "offline.html",
        },
      }
    : {}),
};

export default config;
