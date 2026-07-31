# Agentenvertrag

## Umfang

- Maßgeblich ist die Produktspezifikation unter `docs/product/`.
- Der aktuelle Entwicklungsauftrag liefert einen ausdrücklich synthetischen,
  lokal testbaren Phase-1/2-Piloten.
- Aus Phase 2 sind ausschließlich das gemeinsame Vorgangsmodell,
  Mängel/Reklamationen und Sperrmüll freigegeben. Weitere Phase-2-Dienste bleiben
  außerhalb des Umfangs.
- Pilotfunktionen dürfen nicht als produktionsreif bezeichnet oder ohne die noch
  fehlenden Sicherheits-, Datenschutz-, Fachverfahrens- und Betriebsfreigaben
  ausgerollt werden.

## Architekturgrenzen

- Web: Next.js App Router, React und TypeScript.
- API/BFF: eigenständiger Kotlin/Spring-Boot-Service.
- Öffentliche Verträge werden contract-first unter `contracts/openapi/` gepflegt.
- Designwerte kommen aus `packages/design-tokens`; Mandantenwerte kommen aus Laufzeitkonfiguration.
- Geschäftsregeln gehören nicht ausschließlich in UI-Komponenten.

## Abhängigkeiten

- Neue Bibliotheken benötigen einen konkreten Bedarf, eine Lizenzprüfung und einen Eintrag in `docs/architecture/dependencies.md`.
- Geheimnisse, produktive Daten und personenbezogene Fixtures sind verboten.
- Architekturabweichungen benötigen ein ADR.

## Qualität

- Verträge: `pnpm contracts:check`; generierte Dateien unter `packages/api-client/src/generated` werden nicht manuell geändert.
- Web: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`.
- API: `./gradlew spotlessCheck`, `./gradlew test`, `./gradlew integrationTest`, `./gradlew bootJar`.
- CI/Security: `pnpm ci:validate`, `pnpm security:audit`; GitHub Actions bleiben auf
  vollständige Commit-SHAs und minimale Tokenrechte beschränkt.
- Server Components und semantisches HTML sind der Standard.
- Barrierefreiheit, Datenschutz, Mandantentrennung und verständliche Fehlerzustände sind bei jeder Änderung zu berücksichtigen.
- Tests werden nicht entfernt oder abgeschwächt, um Prüfungen erfolgreich erscheinen zu lassen.

## Abschluss eines Auftrags

Jede Übergabe nennt geänderte Dateien, ausgeführte Prüfungen, verbleibende Risiken und den empfohlenen nächsten Auftrag. ADRs, Vertrag und Dokumentation müssen mit dem Code übereinstimmen.
