# ADR-0006: Browser- und Accessibility-Testbaseline

- Status: angenommen
- Datum: 31. Juli 2026

## Kontext

Die Spezifikation verlangt stabile Befehle für Browser-, Accessibility- und visuelle
Tests. Eine verbindliche Browser-/Gerätematrix, reale Testgeräte und der Prozess für
visuelle Referenzbilder sind noch nicht freigegeben. Der Demo-Mandant benötigt dennoch
früh eine automatisierte Prüfung des wichtigsten Nutzerwegs.

Neue Testbibliotheken müssen die Supply-Chain-Wartefrist, die Node-Baseline und die
Lizenzprüfung erfüllen. Playwright 1.62.1 wurde während dieses Auftrags erst innerhalb
der aktiven Wartefrist veröffentlicht und deshalb nicht übernommen.

## Entscheidung

- `@playwright/test` 1.61.1 führt Browserwege gegen die gemeinsam gestartete Web- und
  API-Anwendung aus. Die Version ist Apache-2.0-lizenziert, unterstützt Node.js 22 und
  liegt außerhalb der Supply-Chain-Wartefrist.
- `@axe-core/playwright` 4.12.1 ergänzt automatisierte WCAG-A-/AA-Prüfungen. Das
  unverändert und ausschließlich als Testwerkzeug verwendete Paket ist MPL-2.0-lizenziert.
- Das blockierende CI-Gate verwendet zunächst den mit Playwright versionierten
  Chromium-Browser in einem Desktop- und einem mobilen Projekt. Zusätzlich wird die
  Mindestbreite von 320 px geprüft.
- `pnpm test:e2e`, `pnpm test:a11y` und `pnpm test:visual` bleiben getrennte,
  dokumentierte Einstiegspunkte; `pnpm test:browser` führt die gesamte Startbaseline
  in CI aus.
- Der aktuelle visuelle Test prüft robuste Layoutinvarianten wie horizontalen Überlauf
  und mobile Navigation. Pixelbasierte Referenzbilder folgen erst mit einer
  plattformstabilen Baseline und einem freigegebenen Reviewprozess.

## Folgen

Der Demo-Nutzerweg, Tastatur-Sprunglink, 320-px-Layout, Fehlerzustand und automatisch
erkennbare Accessibility-Verstöße sind reproduzierbar geschützt. Das ersetzt weder die
verbindliche Matrix aus aktuellen und vorherigen Browserhauptversionen noch 200-%-Zoom,
High Contrast, Screenreader- und inklusive Nutzertests. Diese Freigaben bleiben im
Fragenkatalog offen.
