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

Die Pflege-Unit besitzt im lokalen Pilot bewusst noch keine Anmeldung und darf nicht
öffentlich erreichbar gemacht werden. Die Web-App verwendet standardmäßig
`http://localhost:8080` als API. Eine andere Basis-URL kann mit `API_BASE_URL` gesetzt werden.

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
