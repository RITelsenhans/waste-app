# Teststruktur

- `apps/web/tests`: TypeScript-Unit- und Basiskomponententests mit Vitest sowie
  Browserwege unter `apps/web/tests/browser` und die isolierte Codespaces-Anmeldung
  unter `apps/web/tests/demo-auth-browser` mit Playwright.
- `packages/api-client/tests`: Vertragstyp-, Request- und Fehlerabbildungstests für den generierten Client.
- `packages/design-tokens/tests`: Driftprüfung zwischen JSON-Quelle und generiertem CSS.
- `packages/ui/tests`: serverseitige Markup- und Semantiktests für UI-Zustände.
- `services/api/src/test/kotlin`: schnelle Kotlin-Unit-Tests.
- `services/api/src/integrationTest/kotlin`: Spring-HTTP-Integrationstests für API-Verträge und Fehlerfälle.
- `contracts/examples`: synthetische Vertragsbeispiele.
- `tooling/ci/tests`: Policy-Tests für GitHub-Actions-Pinning, Minimalrechte und
  konfigurierte Quality/Security Gates.
- `packages/test-fixtures`: künftig gemeinsam nutzbare, ausschließlich synthetische Fixtures.

Die vorläufige Browserbaseline führt Chromium auf Desktop- und Mobilprofilen aus und
prüft zusätzlich 320 px. axe-core prüft automatisch erkennbare WCAG-A-/AA-Verstöße.
Die verbindliche Cross-Browser-/Gerätematrix, manuelle Assistenztechniktests und ein
pixelbasierter visueller Baseline-Prozess bleiben offen; siehe ADR-0006.

Browser installieren und prüfen:

```bash
pnpm exec playwright install chromium
pnpm test:e2e
pnpm test:a11y
pnpm test:visual
```

`pnpm test:browser` führt die gesamte Browserbaseline aus und wird in CI verwendet.
Sie enthält zusätzlich Anmeldung, Abmeldung, Cookie-Manipulation/-Ablauf,
gleichursprünglichen API-Zugriff, deaktivierte Pflege und die Accessibility-Prüfung der
Anmeldeseite. Nur diesen Teil führt `pnpm test:demo-auth` aus.

Vertragsprüfungen:

```bash
pnpm contracts:check
```

Der Befehl validiert OpenAPI mit dem strikten Regelsatz, vergleicht eine frische
Clientgenerierung bytegenau mit dem eingecheckten Stand und führt die Clienttests aus.

API-Prüfungen:

```bash
./gradlew test
./gradlew integrationTest
./gradlew bootJar
```

CI- und Advisory-Prüfungen:

```bash
pnpm ci:validate
pnpm security:audit
```

Die GitHub-Workflows verwenden dieselben Root-Befehle. CodeQL und Dependency Review
benötigen zusätzlich ein GitHub-Repository mit den passenden Security-Funktionen.
