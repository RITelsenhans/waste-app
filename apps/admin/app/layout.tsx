import "@waste/design-tokens/tokens.css";
import "@waste/ui/styles.css";
import "./styles.css";

export const metadata = {
  title: "Abfall Pilotpflege",
  description: "Lokale Pflege synthetischer Pilotdaten",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
