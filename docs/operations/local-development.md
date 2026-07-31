# Lokale Entwicklung

## Dienste

- Web: Port 3000
- API: Port 8080
- Demo-Mandant: `demo`

Startbefehle und Qualitätsprüfungen stehen im Repository-README.

Beide Dienste gemeinsam:

```bash
pnpm dev
```

Der Befehl startet API und Web, zeigt beide lokalen URLs an und beendet beim Stoppen
auch beide Kindprozesse. Für getrennte Logs bleiben `pnpm dev:api` und `pnpm dev:web`
verfügbar.

## Konfiguration

`API_BASE_URL` ändert die serverseitige API-Basis des Webs.

Spring Boot akzeptiert übliche externe Konfigurationsquellen. Beispiele:

```bash
SERVER_PORT=8081 ./gradlew :services:api:bootRun
WASTE_TENANTS_DEMO_NAME="Demo Kommune" ./gradlew :services:api:bootRun
```

Die mitgelieferte Konfiguration enthält keine Geheimnisse oder produktiven Daten.

## Nicht enthalten

PostgreSQL ist als Zieldatenbank entschieden, aber noch nicht als Laufzeitabhängigkeit
eingeführt. Es gibt weiterhin keine Container, Deployments, externe Observability,
produktive Readiness-Abhängigkeiten oder Runbooks. Diese werden erst mit einer
datenführenden Story beziehungsweise nach der Plattformentscheidung ergänzt.
