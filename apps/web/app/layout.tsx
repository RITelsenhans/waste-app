import "@waste/design-tokens/tokens.css";
import "@waste/ui/styles.css";
import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { DemoSessionControl } from "../components/demo-session-control";
import {
  DEMO_SESSION_COOKIE,
  isDemoAuthConfigured,
  isDemoAuthRequired,
  verifyDemoSession,
} from "../lib/demo-auth";
import "./styles.css";

export const metadata: Metadata = {
  applicationName: "Abfall APP Pilot",
  title: {
    default: "Abfall APP",
    template: "%s | Abfall APP",
  },
  description: "Technischer Projektstart der mandantenfähigen Abfall APP.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Abfall APP Pilot",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#006d6a",
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const demoAuthRequired = isDemoAuthRequired();
  const cookieStore = demoAuthRequired ? await cookies() : undefined;
  const showSessionControl =
    demoAuthRequired &&
    isDemoAuthConfigured() &&
    verifyDemoSession(cookieStore?.get(DEMO_SESSION_COOKIE)?.value);

  return (
    <html lang="de">
      <body>
        {showSessionControl && <DemoSessionControl />}
        {children}
      </body>
    </html>
  );
}
