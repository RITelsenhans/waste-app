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

Der Befehl prüft zuerst, ob beide Ports frei sind, startet die API, wartet auf deren
Readiness und startet anschließend das Web. Beim Stoppen mit `Ctrl+C` werden beide
Prozessgruppen beendet. Ist ein Port bereits belegt, nennt der Starter den betroffenen
Port und die notwendige Aktion verständlich. Für die normale lokale Nutzung ist kein
zweiter Startbefehl erforderlich.

Die Einzelbefehle `pnpm dev:api` und `pnpm dev:web` bleiben ausschließlich für die
gezielte technische Fehlersuche verfügbar.

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
