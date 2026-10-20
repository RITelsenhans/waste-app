# Abfall APP

Funktionaler, lokal testbarer Pilot für Phase 1 „Web Core Relaunch“ und die explizit
freigegebenen Phase-2-Wege Reklamation und Sperrmüll. Der Stand enthält ausschließlich
synthetische Demo-Daten und ist keine produktive Bereitstellung.

## Voraussetzungen

- Node.js 22.13 oder neuer
- pnpm 11.9 über Corepack
- JDK 21 bis 26; erzeugter Bytecode zielt auf Java 21
- PostgreSQL 17 (`brew install postgresql@17`); ein globaler Datenbankdienst ist nicht nötig
- Internetzugang beim ersten Installieren der Abhängigkeiten
- Für den optionalen iOS-Technikspike: Xcode mit installierter iOS-Simulator-Runtime

## Installation

Falls Corepack nicht nach `/usr/local/bin` schreiben darf, wird es einmalig benutzerlokal
aktiviert:

```bash
mkdir -p ~/.local/bin
corepack enable --install-directory ~/.local/bin
```

`~/.zshrc` muss dazu folgende Zeile enthalten; danach das Terminal neu öffnen oder
`source ~/.zshrc` ausführen:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

Anschließend:

```bash
pnpm install --frozen-lockfile
```

Der Gradle Wrapper lädt Gradle beim ersten Aufruf selbstständig.

## Lokal starten

PostgreSQL, API, Bürgeransicht und Pflege-Unit gemeinsam:

```bash
pnpm dev
```

`pnpm dev` legt beim ersten Start eine lokale Datenbank unter `build/dev-postgres` an,
führt die Flyway-Migrationen aus und beendet alle vier Prozesse gemeinsam mit `Ctrl+C`.

Die folgenden Einzelbefehle dienen nur der technischen Fehlersuche und erwarten eine
bereits erreichbare Datenbank:

Terminal 1:

```bash
pnpm dev:api
```

Terminal 2:

```bash
pnpm dev:web
```

Terminal 3:

```bash
pnpm dev:admin
```

Danach:

- Web: <http://localhost:3000/demo>
- Pflege-Unit: <http://localhost:3001>
- Readiness: <http://localhost:8080/v1/health/ready>
- Demo-Konfiguration: <http://localhost:8080/v1/tenants/demo/config>

## iOS-Technikspike

`apps/mobile` ist ein getrennter, installierbarer Capacitor-Technikspike. Er bettet die
Next.js-Anwendung nicht ein, verwendet aber dieselben Design Tokens, OpenAPI-Verträge und
synthetischen Pilotdaten. Während `pnpm dev` läuft, wird das native Projekt synchronisiert und
in Xcode geöffnet:

```bash
pnpm mobile:sync
pnpm mobile:open
```

Im Xcode-Simulator startet die App standardmäßig gegen `http://localhost:8080`. Eine abweichende
API wird vor dem Synchronisieren über `VITE_API_BASE_URL` gesetzt. Auf einem echten Gerät ist
eine erreichbare HTTPS-Pilot-API erforderlich. Die App ist kein freigegebener TestFlight- oder
Produktionsbuild; Details und Grenzen stehen in [ADR-0013](docs/adr/0013-ios-mobile-technical-spike.md).

Die Pflege-Unit läuft lokal ohne Anmeldung auf Loopback. Die veröffentlichte Pilotvariante besitzt
einen eigenen Passwortschutz und leitet administrative Aufrufe serverseitig mit einem separaten
Service-Geheimnis weiter; siehe ADR-0011. Die Web-App verwendet standardmäßig
`http://localhost:8080` als API. Eine andere Basis-URL kann mit `API_BASE_URL` gesetzt werden.

Für eine interne Managementvorführung kann dieselbe iOS-Hülle stattdessen die geschützte,
veröffentlichte Bürgerdemo laden. Damit stehen in der installierten App auch Kalender,
Abfall-ABC, Standorte und die Pilot-Services zur Verfügung:

```bash
CAPACITOR_SERVER_URL=https://waste-app-web.vercel.app/demo pnpm mobile:sync
```

Dieser Modus benötigt eine Internetverbindung und einmalig das Demo-Passwort. Er ist eine
explizite Vorführungsvariante und weder die dauerhafte Mobilarchitektur noch ein freigegebener
App-Store-Build. Kann die veröffentlichte Demo nicht geladen werden, zeigt die Hülle statt einer
weißen Fläche eine lokale Hinweisseite mit Wiederholen-Aktion. Ohne `CAPACITOR_SERVER_URL` bleibt
der getrennte Technikspike aus ADR-0013 aktiv.

## Geschützt im Browser teilen

Für die zeitlich begrenzte Kollegenvorführung steht eine GitHub-Codespaces-Konfiguration
bereit. Nach Anlage zweier Codespaces-Secrets genügt im Codespace:

```bash
pnpm dev:codespace
```

Die genaue GitHub-Klickfolge, Portfreigabe und der Rückbau stehen in der
[Codespaces-Demo-Anleitung](docs/operations/codespaces-demo.md). Diese Lösung ist nur für
synthetische Testdaten vorgesehen und kein produktives Deployment.

Beim ersten Browser-Test wird der versionierte Chromium-Browser installiert:

```bash
pnpm exec playwright install chromium
```

## Qualitätsprüfungen

```bash
pnpm contracts:check
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:browser
pnpm test:e2e
pnpm test:a11y
pnpm test:visual
pnpm build
pnpm ci:validate
pnpm security:audit
```

Einzelne API-Prüfungen:

```bash
./gradlew test
./gradlew integrationTest
./gradlew bootJar
```

Nach Änderungen unter `contracts/openapi/` wird der eingecheckte TypeScript-Client mit
`pnpm contracts:generate` aktualisiert. `pnpm contracts:check` prüft den Vertrag strikt,
erkennt nicht regenerierte Clientdateien und führt die Vertragstests aus.

Die GitHub-Actions-Workflows spiegeln diese Befehle. Das öffentliche
[GitHub-Repository](https://github.com/RITelsenhans/waste-app) schützt `main` mit den
dokumentierten Required Checks; Dependabot, CodeQL, Secret Scanning und Push Protection
sind aktiv. Details und noch offene Organisationsentscheidungen stehen unter
[`tooling/ci/README.md`](tooling/ci/README.md). Es ist kein Deployment-Workflow
enthalten.

Weitere Entscheidungen und offene Voraussetzungen stehen im
[Decision Log](docs/decision-log.md) und in den [ADRs](docs/adr/).

## Automatischer Qualitätsbericht

Der getrennte Qualitätsagent kann die veröffentlichte Demo zweimal täglich prüfen,
technische Alt-Daten begrenzt warten und einen selbstständig animierten HTML-Bericht
als GitHub-Artefakt bereitstellen. Einrichtung, Secrets und Sicherheitsgrenzen stehen
in der [Qualitätsagent-Anleitung](docs/operations/quality-agent.md).
