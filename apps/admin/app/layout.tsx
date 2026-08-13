import "@waste/design-tokens/tokens.css";
import "@waste/ui/styles.css";
import "./styles.css";

export const metadata = {
  title: "Abfall APP Admin",
  description: "Geschützte Pflege synthetischer kommunaler Pilotdaten",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
