# Teststruktur

- `apps/web/tests`: TypeScript-Unit- und Basiskomponententests mit Vitest.
- `packages/api-client/tests`: Vertragstyp-, Request- und Fehlerabbildungstests für den generierten Client.
- `packages/design-tokens/tests`: Driftprüfung zwischen JSON-Quelle und generiertem CSS.
- `packages/ui/tests`: serverseitige Markup- und Semantiktests für UI-Zustände.
- `services/api/src/test/kotlin`: schnelle Kotlin-Unit-Tests.
- `services/api/src/integrationTest/kotlin`: Spring-HTTP-Integrationstests für API-Verträge und Fehlerfälle.
- `contracts/examples`: synthetische Vertragsbeispiele.
- `tooling/ci/tests`: Policy-Tests für GitHub-Actions-Pinning, Minimalrechte und
  konfigurierte Quality/Security Gates.
- `packages/test-fixtures`: künftig gemeinsam nutzbare, ausschließlich synthetische Fixtures.

Browser-E2E, automatisierte Accessibility-Scans und visuelle Regressionen sind noch nicht eingerichtet. Dafür müssen Browsermatrix, CI-Laufzeit und Baseline-Prozess entschieden werden.

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
