# ADR-0005: GitHub Actions und Security Gates

- Status: angenommen
- Datum: 30. Juli 2026

## Kontext

Nach dem technischen Projektstart benötigt das Monorepository reproduzierbare
Merge-Prüfungen. Der Nutzer hat GitHub Actions als Ziel-CI bestätigt und die lokale
Git-Initialisierung freigegeben. Ein GitHub-Remote, die Organisationsrichtlinien, die
Repository-Sichtbarkeit und lizenzierte GitHub-Sicherheitsfunktionen sind noch nicht
bekannt.

Die Pipeline verarbeitet Pull-Request-Code. Externe Actions und zu weit gefasste
Tokenrechte sind daher Teil der Lieferkette und müssen selbst abgesichert werden.

## Entscheidung

- Das lokale Repository verwendet `main` als Startbranch. Remote, erster Commit und
  produktive Deployment-Workflows werden in diesem Schritt nicht angelegt.
- GitHub Actions führt auf Pull Requests und Änderungen an `main` die identischen
  Root-Prüfungen für Frozen Install, Formatierung, Linting, Typprüfung, Tests und Build
  aus.
- GitHub-hosted `ubuntu-24.04`, Node.js 22.14.0, pnpm 11.9.0 über Corepack und
  Eclipse Temurin 21 bilden die CI-Laufzeit. Sie liegen innerhalb der dokumentierten
  Projekt-Baselines.
- Fremde Actions werden ausschließlich mit vollständigen Commit-SHAs referenziert.
  Workflow- und Jobberechtigungen folgen dem Least-Privilege-Prinzip. Insbesondere
  wird kein `pull_request_target` verwendet.
- Eine separate Security-Pipeline führt den pnpm-Advisory-Check ab Schweregrad `high`
  und CodeQL mit `security-extended` für JavaScript/TypeScript und Java/Kotlin aus.
- Der am 23. Juli 2026 veröffentlichte High-Severity-Fehler
  CVE-2026-14257 in `brace-expansion` wird durch Version 5.0.8 geschlossen. Weil die
  von ESLint verwendete Legacy-`minimatch`-Linie den früheren CommonJS-Default-Export
  erwartet, enthält `patches/` einen minimalen Kompatibilitätspatch für beide
  Exportformen. Die Matching-Logik bleibt unverändert.
- Dependency Review blockiert neue Abhängigkeiten ab Schweregrad `high` sowie neu
  eingeführte starke Copyleft-Lizenzen der GPL-3.0-/AGPL-3.0-Familie. Diese
  Deny-Liste ist eine vorläufige technische Leitplanke und ersetzt keine juristische
  Lizenzfreigabe.
- Dependabot beobachtet npm/pnpm, Gradle und GitHub Actions wöchentlich.
- Secret Scanning, Push Protection, Branch-Regeln und die Required Checks werden nach
  Anlage des GitHub-Remotes in den Repository-Einstellungen aktiviert. Die lokale
  Konfiguration kann diese Plattformfunktionen nicht verbindlich einschalten.
- Es werden keine Deployment-Jobs, Cloud-Zugangsdaten oder produktiven Secrets
  eingeführt.

## Abhängigkeiten und Lizenzen

Die verwendeten Actions und ihre Bedarfs-/Lizenzprüfung stehen in
`docs/architecture/dependencies.md`. Alle Actions sind auf die dort dokumentierten
Release-Commits gepinnt. Die CodeQL-Action ist MIT-lizenziert; Ausführung und
Verfügbarkeit der CodeQL-Analyse unterliegen zusätzlich den GitHub-Bedingungen und dem
Tarif des Ziel-Repositories.

## Folgen

Lokale und CI-Prüfungen besitzen eine gemeinsame Befehlsquelle im Root-Paket. Ein
kleiner Policy-Test schützt SHA-Pinning, Minimalrechte und die vereinbarten Gates vor
unbeabsichtigter Abschwächung.

Für den ersten geschützten Merge wurden die Checknamen und Security-Einstellungen gemäß
`tooling/ci/README.md` aktiviert. Falls das Repository später auf `private` umgestellt
wird und Dependency Review, CodeQL oder Secret Scanning nicht lizenziert sind, muss die
Organisation eine gleichwertige, dokumentierte Alternative entscheiden; die Gates
werden nicht stillschweigend entfernt.

## Umsetzungsstand

Das öffentliche Repository
[`RITelsenhans/waste-app`](https://github.com/RITelsenhans/waste-app) wurde am 30. Juli 2026 angelegt. Die Workflows liefen auf `main` erfolgreich. Secret Scanning,
Push Protection, Dependabot Alerts, automatische Security Updates und Admin-Enforcement
sind aktiv.

`main` verlangt Pull Requests, aktuelle Quality-/Security-/Dependency-Checks und
aufgelöste Gespräche; Force Push und Löschung sind gesperrt. Weil noch kein zweiter
Reviewer benannt wurde, steht die Zahl verpflichtender Freigaben dokumentiert auf `0`.
Diese verbleibende Organisationsentscheidung ist keine technische Freigabe für
ungeprüfte Änderungen.

Dependabot gruppiert die Kotlin-Plugins `jvm` und `plugin.spring`, damit ihre gemeinsame
Version nicht durch getrennte Pull Requests auseinanderläuft. Reguläre Major-Updates
von `@types/node`, TypeScript und ESLint sowie reguläre Minor-Updates von Hey API werden
bis zu einem jeweils koordinierten Upgrade-Auftrag zurückgestellt. Die Regeln verwenden
ausschließlich `update-types`; diese Filter betreffen laut
[GitHub-Dokumentation](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference)
nicht die Dependabot-Sicherheitsupdates.
