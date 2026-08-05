# Lokale Entwicklung

## Dienste

- Web: Port 3000
- Pilotpflege: Port 3001
- API: Port 8080
- projektlokales PostgreSQL: Port 55432
- lokales Testpostfach: SMTP-Port 1025, Oberfläche Port 8025
- Demo-Mandant: `demo`

Startbefehle und Qualitätsprüfungen stehen im Repository-README.

Beide Dienste gemeinsam:

```bash
pnpm dev
```

Der Befehl prüft zuerst alle Ports, baut die Design Tokens, initialisiert bei Bedarf
PostgreSQL unter `build/dev-postgres`, startet die Datenbank und Mailpit, führt beim
API-Start die Flyway-Migrationen aus und startet anschließend Bürgeransicht und
Pflege-Unit. Beim Stoppen mit `Ctrl+C` werden alle Prozessgruppen beendet. Die
persistenten synthetischen Daten und Testmails bleiben für den nächsten Start erhalten.
Für die normale lokale Nutzung ist kein zweiter Startbefehl erforderlich.

Mailpit muss auf macOS einmalig mit `brew install mailpit` installiert sein. Nach einer
Reklamation mit E-Mail-Adresse verarbeitet die API den persistenten Outbox-Eintrag im
Hintergrund. Die gestaltete Bestätigung ist anschließend unter
<http://localhost:8025> sichtbar. Es wird niemals eine Nachricht an das Internet
weitergeleitet.

Der Start setzt ausschließlich für PostgreSQL und dessen Hilfsprogramme die portable
Locale `C`. Dadurch funktioniert der projektlokale Datenbankstart auf macOS auch dann,
wenn das Terminal beispielsweise `LANG=C.UTF-8` exportiert, diese Locale vom
Homebrew-Build aber nicht bereitgestellt wird. Die Locale von Web und API wird nicht
verändert.

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
Der Mailversand ist außerhalb von `pnpm dev` standardmäßig deaktiviert. Für eine spätere
SMTP-Anbindung werden Host, Port, Anmeldung, STARTTLS, Absender und Anwendungs-URL über
Umgebungsvariablen gesetzt; Zugangsdaten werden nicht eingecheckt.

## Pilotgrenze

Die lokale Datenbank verwendet ausschließlich Loopback-Verbindungen und Trust-Zugriff
ohne Geheimnis. Die Pflege-API ist im Pilot ohne Anmeldung aktiviert. Es gibt weiterhin
keine Container, Deployments, externe Observability, Backups oder produktiven Runbooks.
Dieser Aufbau darf daher nicht in ein öffentlich erreichbares Netz übertragen werden.
