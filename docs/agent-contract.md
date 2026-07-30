# Agentenvertrag

## Umfang

- Maßgeblich ist die Produktspezifikation unter `docs/product/`.
- Der aktuelle Stand ist ausschließlich der technische Start von Phase 1.
- Phase-2-Funktionen dürfen nicht implementiert oder sichtbar aktiviert werden.

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
