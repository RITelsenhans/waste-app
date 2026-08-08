# Qualitätsagent betreiben

Der Qualitätsagent prüft die geschützte Demo unter
<https://waste-app-web.vercel.app> morgens und abends und stellt anschließend einen
automatisch animierten HTML-Bericht als GitHub-Artefakt bereit. Er erzeugt keine
Beschwerden oder Sperrmüllaufträge. Pro Lauf erzeugt er genau einen eindeutig
markierten synthetischen 24/7-Testzugang und entfernt dessen Datensätze unmittelbar
nach dem Test wieder.

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

GitHub führt sowohl `schedule` als auch den manuellen `workflow_dispatch` nur aus,
wenn die Workflow-Datei im Default-Branch vorhanden ist. Der geprüfte Pull Request
muss deshalb zuerst nach `main` übernommen werden. Erst danach:

1. **Actions → Qualitätsagent** öffnen.
2. Für einen ersten Kontrolllauf **Run workflow** wählen und bestätigen.
3. Ergebnis und Artefakt prüfen.

Danach läuft er automatisch um 07:30 und 18:30 Uhr Berliner Zeit. Der Checkout bleibt
ausdrücklich auf dem bei Vercel/Railway eingestellten Produktionsbranch. Vor dem Merge
ist der Workflow vollständig inaktiv; ein direktes, ungeprüftes Umgehen dieser Grenze
ist nicht vorgesehen.

Vercel muss unter **Settings → Environment Variables** die Option **Automatically
expose System Environment Variables** aktiviert haben. Railway stellt seine
Git-Deploymentvariablen bei GitHub-basierten Deployments automatisch bereit. Der
Agent gibt weder Commitnachrichten noch Autorendaten aus.

## Technische Prüftiefe

Zusätzlich zu den Bürgerwegen kontrolliert jeder Lauf:

- ob Vercel und Railway exakt den aktuellen Commit des Produktionsbranches ausliefern,
- ob beide Deployments vom vorgesehenen Produktionsbranch stammen,
- ob Node.js 22, Java 21 sowie die festgelegten Next.js-, Spring-Boot- und
  Kotlin-Versionen aktiv sind,
- ob `pnpm audit` bekannte JavaScript-Advisories ab `high` meldet,
- ob GitHub offene hohe oder kritische Dependabot-Sicherheitswarnungen meldet,
- ob der letzte Security-/CodeQL-Lauf erfolgreich und höchstens acht Tage alt ist,
- ob reguläre Dependabot-Updates auf Prüfung warten.
- ob sich ein `DEMO-QA-`-Zugang über das echte Browserformular buchen, durch alle
  vier simulierten Torzustände führen und anschließend vollständig bereinigen lässt.

Reguläre Versionsupdates werden gelb als Hinweis gezeigt und machen den Lauf nicht
rot. Baselineabweichungen, nicht ausgerollte Commits sowie bekannte hohe oder
kritische Sicherheitswarnungen sind Fehler. Diese Prüfungen erkennen bekannte und
maschinell sichtbare Risiken; sie ersetzen weder Container- und Betriebssystemscans
noch Penetrationstest oder Betriebsfreigabe.

Nach Abschluss jeder Station öffnet **Details & Lösung** den realen Prüfgegenstand,
die empfohlene Nacharbeit und – bei GitHub-basierten Befunden – die Belegquelle. Die
Updateprüfung bettet Nummer und Titel der zum Laufzeitpunkt tatsächlich offenen
Dependabot-PRs in die Offline-Datei ein.

## Bericht öffnen

1. GitHub → **Actions → Qualitätsagent** → gewünschten Lauf öffnen.
2. In der Laufzusammenfassung unter **Animierten Bericht öffnen** den direkten Link
   `quality-agent-report direkt herunterladen` anklicken. Alternativ unter
   **Artifacts** `quality-agent-report` herunterladen.
3. ZIP entpacken und `quality-report.html` doppelklicken.

Die HTML-Datei benötigt keine Internetverbindung und durchläuft die Findings
selbstständig von links nach rechts. Gesamtergebnis, animierter Prüfer, Stationen,
aktives Finding und das rechts schrittweise wachsende Ergebnisprotokoll bleiben in
einer Bildschirmhöhe ohne vertikales Scrollen sichtbar. Erst der aufrufbare
Detaildialog zeigt längere Nachweise und Handlungsempfehlungen. Die Datei kann
weitergegeben oder später an einen freigegebenen Mailversand angehängt werden.
Zusätzlich steht die kompakte Ergebnisliste direkt in der GitHub-Laufzusammenfassung.

## Grenzen und Reaktion auf Fehler

- Der Agent sammelt keine Testeridentitäten und keine Forminhalte.
- Mängel- und Sperrmüll-End-to-End-Wege laufen weiterhin isoliert in CI. Gegen
  Railway wird nur der ausdrücklich synthetische, selbstbereinigende 24/7-Weg
  ausgeführt.
- Bei mehr als 500 Löschkandidaten wird nichts gelöscht. Ursache und Aufbewahrung sind
  dann manuell zu prüfen.
- Bei einem roten Lauf zuerst Trace/Fehlertext und HTML-Artefakt prüfen. Codex liefert
  bei konfiguriertem API-Key nur eine Empfehlung; es erstellt keinen PR automatisch.
- E-Mail-Zustellung benötigt noch eine Entscheidung zu Empfänger, freigegebenem SMTP-
  oder Mail-API-Dienst, Absenderdomain und Secret-Verwaltung.
