# Decision Log

Stand: 31. Juli 2026

## Fehlende Voraussetzungen

| Thema                                                  | Status                                                                                                         | Auswirkung auf diesen Start                                                                           |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Git-Repository und Zielplattform                       | Öffentliches Repository `RITelsenhans/waste-app`; `main` ist mit GitHub Actions und Required Checks geschützt. | CI und Security Gates sind aktiv; zweiter Reviewer und künftige Organisationszuordnung bleiben offen. |
| Bestands-APIs und führende Datenquellen                | Nicht bereitgestellt.                                                                                          | Keine fachlichen Phase-1-Endpunkte außer Demo-Konfiguration und Readiness.                            |
| Pilotkommune und freigegebene Pilotdaten               | Nicht benannt.                                                                                                 | Ausschließlich synthetischer Demo-Mandant.                                                            |
| Betriebsplattform, Registry, Secrets und Observability | Nicht entschieden.                                                                                             | Keine Container- oder Deploymentumsetzung; keine produktiven Secrets.                                 |
| Ziel-JDK im Regio-IT-Betrieb                           | Nicht bestätigt.                                                                                               | Java-21-Bytecode als konservative LTS-Annahme; lokal darf JDK 21–26 verwendet werden.                 |
| Kartenanbieter                                         | Nicht entschieden.                                                                                             | Keine Kartenabhängigkeit.                                                                             |
| Verbindliche Browser-/Gerätematrix                     | Nicht freigegeben.                                                                                             | Baseline gemäß Spezifikation; Browser-E2E folgt separat.                                              |
| Remote-Konfigurationssystem/CMS                        | Nicht entschieden.                                                                                             | Spring-Konfiguration aus YAML/Umgebung als austauschbare Startimplementierung.                        |
| Datenschutz-, Barrierefreiheits- und Betriebsfreigaben | Nicht vorhanden.                                                                                               | Keine Pilot- oder Produktionsfreigabe ableitbar.                                                      |

## Für den technischen Start getroffene Entscheidungen

| ID    | Entscheidung                                                                                                                             | Begründung                                                                                                                                                                     |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D-001 | Der Demo-Mandant wird über den stabilen Pfad `/demo` aufgelöst.                                                                          | Entspricht dem URL-Konzept und benötigt keine unbekannte Domainkonfiguration.                                                                                                  |
| D-002 | Tenant-Konfiguration wird zunächst durch Spring Boot aus `application.yml` und überschreibbaren Umgebungsvariablen gebunden.             | Laufzeitkonfiguration ohne Datenbank oder produktives CMS; siehe ADR-0002.                                                                                                     |
| D-003 | Web läuft lokal auf 3000, API auf 8080.                                                                                                  | Übliche lokale Standardwerte, vollständig überschreibbar.                                                                                                                      |
| D-004 | Java-21-Bytecode, Spring Boot 4.1, Kotlin 2.3.21 und Gradle 9.6.1 bilden die API-Baseline.                                               | Kompatible Generation mit LTS-Ziel; Gradle 9.6.1 ist das empfohlene Fehlerkorrektur-Release der 9.6-Linie; siehe ADR-0001.                                                     |
| D-005 | Inter wird noch nicht eingebunden.                                                                                                       | Es liegt keine freigegebene, selbst gehostete Fontdatei samt Lizenznachweis vor; Systemschrift ist spezifikationskonformer Fallback.                                           |
| D-006 | Das vorhandene Regio-IT-Logo aus der bereitgestellten Präsentation wird unverändert als PNG verwendet.                                   | Vermeidet Rekonstruktion oder nicht freigegebene Markenänderungen.                                                                                                             |
| D-007 | Datenbank, Redis, PWA, Karten, Monitoring-Backend und Phase-2-Module werden nicht vorgetäuscht.                                          | Für den technischen Start nicht erforderlich und durch offene Betriebs-/Fachentscheidungen blockiert.                                                                          |
| D-008 | OpenAPI wird mit Redocly validiert und der TypeScript-Fetch-Client mit Hey API generiert.                                                | Verhindert Vertragsdrift ohne Java-basierte Generator-Zusatzlaufzeit; siehe ADR-0003.                                                                                          |
| D-009 | pnpm führt vor Skripten keine implizite Neuinstallation aus; Installation bleibt ein explizites Frozen-Gate.                             | Verhindert interaktive Modul-Purge-Abbrüche mit benutzerlokalem Corepack und versteckte Änderungen während Qualitätsprüfungen.                                                 |
| D-010 | Das UI-Paket startet mit `Action`, `Card` und `StatusBadge`; Tokens bleiben die einzige Quelle für Designwerte.                          | Belegt reale Wiederverwendung, vermeidet vorschnelle Abstraktionen und hält Fachlogik aus Primitives heraus; siehe ADR-0004.                                                   |
| D-011 | GitHub Actions führt auf `ubuntu-24.04` mit SHA-gepinnten Actions und Minimalrechten die lokalen Quality Gates aus.                      | Reproduzierbare Merge-Prüfung ohne Deployment oder privilegierte Pull-Request-Ausführung; siehe ADR-0005.                                                                      |
| D-012 | CodeQL, pnpm-Audit ab `high`, Dependency Review, Dependabot, Secret Scanning und Push Protection bilden die erste Supply-Chain-Baseline. | Deckt statische Analyse, bekannte Advisories, neue Abhängigkeiten und versehentlich eingecheckte Geheimnisse ab.                                                               |
| D-013 | `main` verlangt Pull Requests, aktuelle Required Checks und aufgelöste Gespräche; Administratoren dürfen die Regel nicht umgehen.        | Schützt den öffentlichen Hauptbranch vor ungeprüften Änderungen, Force Push und Löschung. Bis ein zweiter Reviewer benannt ist, sind noch keine Pflichtfreigaben konfiguriert. |
| D-014 | Dependabot gruppiert beide Kotlin-Plugins und vertagt inkompatible reguläre Toolchain-Updates über `update-types`.                       | Verhindert getrennte Kotlin-Versionen und wiederkehrende, bereits negativ geprüfte PRs; Sicherheitsupdates bleiben von den Filtern unberührt; siehe ADR-0005.                  |

## Offene Entscheidungen

Die 20 Grundsatzentscheidungen aus Abschnitt 23 der Produktspezifikation bleiben offen. Für den nächsten Auftrag sind besonders zu klären:

1. Künftige GitHub-Organisationszuordnung, zweiter Reviewer, Pflichtfreigaben und Einsatz einer Merge Queue.
2. Regio-IT-Freigabe für Spring Boot 4.1, Java 21 und die dokumentierten OSS-Abhängigkeiten.
3. Quelle, Schema, Validierung und Aktualisierungsweg produktiver Mandantenkonfiguration.
4. Pilotkommune, führende Phase-1-Datenquellen und synthetische Testdatensätze.
5. verbindliche Browsermatrix sowie Browser-/Accessibility-Testumgebung.
