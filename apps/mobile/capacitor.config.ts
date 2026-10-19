import { env } from "node:process";

import type { CapacitorConfig } from "@capacitor/cli";

const hostedDemoUrl = env.CAPACITOR_SERVER_URL?.trim();

const config: CapacitorConfig = {
  appId: "de.regioit.abfall.pilot",
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
          cleartext: false,
        },
      }
    : {}),
};

export default config;
