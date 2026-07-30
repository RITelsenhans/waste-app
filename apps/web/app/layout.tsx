import "@waste/design-tokens/tokens.css";
import "@waste/ui/styles.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./styles.css";

export const metadata: Metadata = {
  title: {
    default: "Abfall APP",
    template: "%s | Abfall APP",
  },
  description: "Technischer Projektstart der mandantenfähigen Abfall APP.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
