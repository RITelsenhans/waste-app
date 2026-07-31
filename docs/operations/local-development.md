# Lokale Entwicklung

## Dienste

- Web: Port 3000
- Pilotpflege: Port 3001
- API: Port 8080
- projektlokales PostgreSQL: Port 55432
- Demo-Mandant: `demo`

Startbefehle und Qualitätsprüfungen stehen im Repository-README.

Beide Dienste gemeinsam:

```bash
pnpm dev
```

Der Befehl prüft zuerst alle Ports, baut die Design Tokens, initialisiert bei Bedarf
PostgreSQL unter `build/dev-postgres`, startet die Datenbank, führt beim API-Start die
Flyway-Migrationen aus und startet anschließend Bürgeransicht und Pflege-Unit. Beim
Stoppen mit `Ctrl+C` werden alle Prozessgruppen beendet. Die persistenten synthetischen
Daten bleiben für den nächsten Start erhalten. Für die normale lokale Nutzung ist kein
zweiter Startbefehl erforderlich.

Die Einzelbefehle `pnpm dev:api`, `pnpm dev:web` und `pnpm dev:admin` bleiben
ausschließlich für die gezielte technische Fehlersuche verfügbar.

## Konfiguration

`API_BASE_URL` ändert die serverseitige API-Basis des Webs.

Spring Boot akzeptiert übliche externe Konfigurationsquellen. Beispiele:

```bash
SERVER_PORT=8081 ./gradlew :services:api:bootRun
WASTE_TENANTS_DEMO_NAME="Demo Kommune" ./gradlew :services:api:bootRun
```

Die mitgelieferte Konfiguration enthält keine Geheimnisse oder produktiven Daten.

## Pilotgrenze

Die lokale Datenbank verwendet ausschließlich Loopback-Verbindungen und Trust-Zugriff
ohne Geheimnis. Die Pflege-API ist im Pilot ohne Anmeldung aktiviert. Es gibt weiterhin
keine Container, Deployments, externe Observability, Backups oder produktiven Runbooks.
Dieser Aufbau darf daher nicht in ein öffentlich erreichbares Netz übertragen werden.
