import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "de.regioit.abfall.pilot",
  appName: "Abfall App Pilot",
  webDir: "dist",
  backgroundColor: "#f6f8fb",
  ios: {
    contentInset: "automatic",
  },
};

export default config;
