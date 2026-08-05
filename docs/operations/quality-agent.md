# Qualitätsagent betreiben

Der Qualitätsagent prüft die geschützte Demo unter
<https://waste-app-web.vercel.app> morgens und abends und stellt anschließend einen
automatisch animierten HTML-Bericht als GitHub-Artefakt bereit. Er erzeugt keine
Beschwerden, Sperrmüllaufträge oder 24/7-Zugänge.

## Einmalige Aktivierung

### 1. Gemeinsames Monitoring-Token erzeugen

Lokal ausführen und die Ausgabe nicht in Chat, Commit oder Dokumentation kopieren:

```bash
openssl rand -hex 32
```

### 2. Railway konfigurieren

Im API-Service unter **Variables** setzen:

| Variable                                | Wert                  |
| --------------------------------------- | --------------------- |
| `WASTE_MONITORING_ENABLED`              | `true`                |
| `WASTE_MONITORING_TOKEN`                | Ausgabe aus Schritt 1 |
| `WASTE_MONITORING_CLEANUP_ENABLED`      | `true`                |
| `WASTE_MONITORING_RETENTION_DAYS`       | `30`                  |
| `WASTE_MONITORING_MAXIMUM_ROWS_PER_RUN` | `500`                 |

Railway deployt danach die API neu. Ohne `WASTE_MONITORING_ENABLED=true` antworten
die Monitoring-Pfade absichtlich mit 404; bei falschem Token mit 403.

### 3. GitHub-Secrets konfigurieren

Repository `RITelsenhans/waste-app` → **Settings → Secrets and variables → Actions →
New repository secret**:

- `DEMO_MONITOR_PASSWORD`: das bestehende Vercel-Demo-Passwort.
- `MONITORING_API_TOKEN`: exakt das in Railway gesetzte Token.
- `OPENAI_API_KEY`: optional; nur für die zusätzliche Codex-Ursachenanalyse bei
  fehlgeschlagenen Checks. Ohne dieses Secret laufen Prüfung, Wartung und Bericht
  vollständig deterministisch weiter.

### 4. Workflow aktivieren

GitHub startet `schedule` ausschließlich aus dem Default-Branch. Der Workflow muss
daher geprüft nach `main` übernommen werden. Solange das noch nicht erfolgt ist:

1. **Actions → Qualitätsagent** öffnen.
2. **Run workflow** wählen.
3. Branch `feat/phase1-phase2-functional-pilot` auswählen.
4. **Run workflow** bestätigen.

Nach Übernahme nach `main` läuft er automatisch um 07:30 und 18:30 Uhr Berliner Zeit.
Der Checkout bleibt ausdrücklich auf dem bei Vercel/Railway eingestellten
Produktionsbranch.

## Bericht öffnen

1. GitHub → **Actions → Qualitätsagent** → gewünschten Lauf öffnen.
2. Unter **Artifacts** `quality-agent-report` herunterladen.
3. ZIP entpacken und `quality-report.html` doppelklicken.

Die HTML-Datei benötigt keine Internetverbindung und durchläuft die Findings
selbstständig von links nach rechts. Sie kann als Datei weitergegeben oder später an
einen freigegebenen Mailversand angehängt werden. Zusätzlich steht die kompakte
Ergebnisliste direkt in der GitHub-Laufzusammenfassung.

## Grenzen und Reaktion auf Fehler

- Der Agent sammelt keine Testeridentitäten und keine Forminhalte.
- Schreibende End-to-End-Wege laufen weiterhin isoliert in CI, nicht gegen Railway.
- Bei mehr als 500 Löschkandidaten wird nichts gelöscht. Ursache und Aufbewahrung sind
  dann manuell zu prüfen.
- Bei einem roten Lauf zuerst Trace/Fehlertext und HTML-Artefakt prüfen. Codex liefert
  bei konfiguriertem API-Key nur eine Empfehlung; es erstellt keinen PR automatisch.
- E-Mail-Zustellung benötigt noch eine Entscheidung zu Empfänger, freigegebenem SMTP-
  oder Mail-API-Dienst, Absenderdomain und Secret-Verwaltung.
