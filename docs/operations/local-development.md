# Lokale Entwicklung

## Dienste

- Web: Port 3000
- API: Port 8080
- Demo-Mandant: `demo`

Startbefehle und Qualitätsprüfungen stehen im Repository-README.

## Konfiguration

`API_BASE_URL` ändert die serverseitige API-Basis des Webs.

Spring Boot akzeptiert übliche externe Konfigurationsquellen. Beispiele:

```bash
SERVER_PORT=8081 ./gradlew :services:api:bootRun
WASTE_TENANTS_DEMO_NAME="Demo Kommune" ./gradlew :services:api:bootRun
```

Die mitgelieferte Konfiguration enthält keine Geheimnisse oder produktiven Daten.

## Nicht enthalten

Es gibt noch keine Container, Deployments, Datenbank, externe Observability, produktive Readiness-Abhängigkeiten oder Runbooks. Diese werden erst nach der Plattformentscheidung ergänzt.
