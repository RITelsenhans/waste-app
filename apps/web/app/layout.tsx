import "@waste/design-tokens/tokens.css";
import "@waste/ui/styles.css";
import type { Metadata } from "next";
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
  title: {
    default: "Abfall APP",
    template: "%s | Abfall APP",
  },
  description: "Technischer Projektstart der mandantenfähigen Abfall APP.",
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
