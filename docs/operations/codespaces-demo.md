# Geschützte Demo über GitHub Codespaces

Diese Anleitung ist die vorübergehende Browser-Freigabe, solange keine freigegebene
Regio-IT-Laufzeit vorhanden ist. Sie verwendet ausschließlich synthetische Daten und
ist weder ein produktives Deployment noch eine Freigabe für reale kommunale Daten.

## 1. Zwei Codespaces-Secrets anlegen

Die Werte einmal lokal erzeugen. Beide Befehle geben den jeweiligen Wert im Terminal
aus; die Werte nicht in Dateien, Chats oder das Repository kopieren:

```bash
openssl rand -base64 24
openssl rand -hex 32
```

Im Repository <https://github.com/RITelsenhans/waste-app>:

1. **Settings** öffnen.
2. Links **Secrets and variables** → **Codespaces** wählen.
3. **New repository secret** anklicken.
4. Als Namen `DEMO_ACCESS_PASSWORD` und als Wert das Ergebnis des ersten Befehls
   speichern.
5. Noch einmal **New repository secret** anklicken.
6. Als Namen `DEMO_SESSION_SECRET` und als Wert das Ergebnis des zweiten Befehls
   speichern.

Das erste Secret ist das Passwort für die Tester. Es muss mindestens 12 Zeichen lang
sein. Das zweite Secret signiert Sitzungen und muss mindestens 32 Zeichen lang sein; es
wird niemandem weitergegeben. GitHub stellt neu angelegte Codespaces-Secrets erst nach
einem Neustart auch einem bereits laufenden Codespace bereit.

## 2. Codespace aus dem Feature-Branch erstellen

1. Im Repository den Branch `feat/phase1-phase2-functional-pilot` auswählen.
2. **Code** → **Codespaces** öffnen.
3. **Create codespace on feat/phase1-phase2-functional-pilot** anklicken. Falls nur
   **New with options…** erscheint, dort denselben Branch wählen.
4. Warten, bis der Dev Container erstellt und `pnpm install --frozen-lockfile`
   erfolgreich beendet wurde.

Der Container stellt Node.js 22, Java 21, pnpm 11.9 und PostgreSQL 17 bereit. Es werden
keine produktiven Zugangsdaten übernommen.

## 3. Einen Befehl starten

Im Terminal des Codespace:

```bash
pnpm dev:codespace
```

Der Befehl bricht bei fehlenden Secrets ab. Bei Erfolg startet er PostgreSQL, API und
die Bürgeransicht. Die Pflege-Unit und Mailpit werden nicht gestartet; die
administrative API ist deaktiviert.

## 4. Nur Port 3000 freigeben

1. Im unteren Bereich des Codespace den Reiter **PORTS** öffnen.
2. In der Zeile **3000 – Geschützte Abfall-APP-Demo** mit der rechten Maustaste
   **Port Visibility** → **Public** wählen. Wenn Regio IT die Option
   **Private to Organization** anbietet und alle Tester Organisationsmitglieder sind,
   ist diese Option vorzuziehen.
3. In derselben Zeile **Copy Local Address** wählen. GitHub liefert dafür eine
   `https://…-3000.app.github.dev`-Adresse.
4. Den Link im privaten Browserfenster prüfen. Er muss zuerst **Abfall APP Demo** und
   ein Passwortfeld zeigen. Nach Anmeldung führt er zu `/demo`.
5. Link und `DEMO_ACCESS_PASSWORD` über getrennte Kommunikationswege an die
   eingeladenen Tester geben.

Niemals 3001, 8080, 55432, 1025 oder 8025 öffentlich stellen. Ein öffentlicher
Codespaces-Port besitzt keinen GitHub-Zugriffsschutz; deshalb darf die vorgeschaltete
Anmeldeseite nicht deaktiviert werden. Nach einem Neustart kann GitHub einen öffentlichen
Port wieder auf **Private** setzen.

## 5. Vor der Einladung kurz prüfen

- Ein privates Browserfenster zeigt ohne Passwort keine Bürgerseite.
- Ein falsches Passwort bleibt auf der Anmeldeseite.
- Nach der Anmeldung lädt `/demo` Termine, Abfall-ABC, Standorte und die synthetischen
  Pilotformulare.
- `https://<Codespace-Adresse>/v1/health/ready` liefert ohne Anmeldung `401` und nach
  Anmeldung `200`.
- Im Reiter **PORTS** ist ausschließlich 3000 geteilt.

## 6. Vorführung beenden und Umgebung entfernen

1. Im Terminal `Ctrl+C` drücken.
2. Auf <https://github.com/codespaces> beim Codespace das Menü **…** öffnen und
   **Stop codespace** wählen.
3. Sobald die Vorführung abgeschlossen ist, dort **Delete** wählen. Dadurch wird auch
   das nur für diese Demo genutzte PostgreSQL-Volume entfernt.
4. Unter **Settings** → **Secrets and variables** → **Codespaces** beide Secrets
   löschen oder mindestens `DEMO_ACCESS_PASSWORD` vor der nächsten Vorführung ersetzen.

Der Codespace wird bei Inaktivität automatisch gestoppt; ein gestoppter Codespace ist
nicht mehr über den Link erreichbar. Die Portfreigabe nach jedem Neustart kontrollieren.

## Fehlerbilder

- **`DEMO_ACCESS_PASSWORD fehlt`**: Codespaces-Secret anlegen, Codespace stoppen und
  neu starten.
- **Port 3000 fehlt**: Läuft `pnpm dev:codespace`? Falls ja, im Reiter **PORTS** über
  **Add port** die Nummer `3000` eintragen.
- **Public fehlt als Auswahl**: Eine Organisationsrichtlinie verbietet öffentliche
  Ports. Nicht umgehen; Regio-IT-Owner um **Private to Organization** oder eine
  freigegebene Laufzeit bitten.
- **Link zeigt nach Neustart GitHub-Anmeldung oder 404**: Port 3000 ist wieder privat
  oder der Prozess läuft nicht. Startbefehl und Portsichtbarkeit erneut prüfen.

Aktuelle GitHub-Referenzen: [Codespaces-Secrets](https://docs.github.com/en/codespaces/managing-codespaces-for-your-organization/managing-development-environment-secrets-for-your-repository-or-organization),
[Ports weiterleiten und teilen](https://docs.github.com/en/codespaces/developing-in-a-codespace/forwarding-ports-in-your-codespace?tool=webui),
[Codespaces-Sicherheit](https://docs.github.com/en/codespaces/reference/security-in-github-codespaces).
