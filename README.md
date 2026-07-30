# Abfall APP

Technischer Projektstart für Phase 1 „Web Core Relaunch“. Der aktuelle Stand enthält nur die Engineering Foundation: ein Next.js-Web, eine Kotlin/Spring-Boot-API, gemeinsame Design Tokens und UI-Primitives, einen Demo-Mandanten und die ersten API-Verträge. Fachliche Phase-1- und sämtliche Phase-2-Funktionen sind noch nicht implementiert.

## Voraussetzungen

- Node.js 22.13 oder neuer
- pnpm 11.9 über Corepack
- JDK 21 bis 26; erzeugter Bytecode zielt auf Java 21
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

Terminal 1:

```bash
pnpm dev:api
```

Terminal 2:

```bash
pnpm dev:web
```

Danach:

- Web: <http://localhost:3000/demo>
- Readiness: <http://localhost:8080/v1/health/ready>
- Demo-Konfiguration: <http://localhost:8080/v1/tenants/demo/config>

Die Web-App verwendet standardmäßig `http://localhost:8080` als API. Eine andere Basis-URL kann mit `API_BASE_URL` gesetzt werden.

## Qualitätsprüfungen

```bash
pnpm contracts:check
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
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

Die GitHub-Actions-Workflows spiegeln diese Befehle. Nach Anlage eines GitHub-Remotes
sind Branch-Regeln und Security-Funktionen gemäß
[`tooling/ci/README.md`](tooling/ci/README.md) zu aktivieren. Es ist kein
Deployment-Workflow enthalten.

Weitere Entscheidungen und offene Voraussetzungen stehen im
[Decision Log](docs/decision-log.md) und in den [ADRs](docs/adr/).
