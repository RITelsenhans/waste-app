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

Bei einem Zeitplan zeigt GitHub in der Laufübersicht trotzdem den Default-Branch
`main`, weil die Workflow-Definition von dort gestartet wird. Das ändert den geprüften
Stand nicht: Der Schritt **Produktionsstand auschecken** lädt ausdrücklich
`feat/phase1-phase2-functional-pilot`. Laufname, Zusammenfassung und HTML nennen daher
getrennt die Workflow-Quelle, den geprüften Produktionsbranch und dessen Revision.

Vercel muss unter **Settings → Environment Variables** die Option **Automatically
expose System Environment Variables** aktiviert haben. Railway stellt seine
Git-Deploymentvariablen bei GitHub-basierten Deployments automatisch bereit. Der
Agent gibt weder Commitnachrichten noch Autorendaten aus.

## Technische Prüftiefe

Zusätzlich zu den Bürgerwegen kontrolliert jeder Lauf:

- ob Vercel und Railway den aktuellen Commit des Produktionsbranches oder einen im
  Repository nachgewiesenen, inhaltsgleichen Git-Tree ausliefern,
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
rot. Eine andere Commit-ID bei identischem Git-Tree ist bestanden und wird mit beiden
Revisionen sowie dem gemeinsamen Tree im Bericht erklärt; dies deckt insbesondere von
Vercel übersprungene inhaltsgleiche Builds ab. Baselineabweichungen, nicht
ausgerollte Inhalte sowie bekannte hohe oder kritische Sicherheitswarnungen sind
Fehler. Diese Prüfungen erkennen bekannte und
maschinell sichtbare Risiken; sie ersetzen weder Container- und Betriebssystemscans
noch Penetrationstest oder Betriebsfreigabe.

Für die Alarmierung gilt: **Rot** bedeutet eine nachgewiesene Abweichung der
Anwendung, des veröffentlichten Deployments oder der Sicherheitsbaseline. Fehlt dem
Prüfwerkzeug selbst eine notwendige Eingabe, erscheint genau ein gelber Hinweis
**Monitoring unvollständig**. Daraus werden keine roten Folgefehler abgeleitet;
unabhängige Prüfungen laufen weiter. Ein roter GitHub-Job ohne erzeugten Bericht ist
zunächst ein technischer Agentenausfall und noch kein Produktionsalarm.

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

GitHub speichert für **jeden** Lauf ein eigenes Artefakt namens
`quality-agent-report` für 30 Tage. Es enthält `quality-report.html`,
`quality-report.json`, `quality-summary.md` und bei Browserfehlern zusätzlich Trace und
Screenshot. Das Artefakt liegt nicht dauerhaft im Repository und nicht auf Vercel oder
Railway, sondern ausschließlich am jeweiligen GitHub-Actions-Lauf.

Die HTML-Datei benötigt keine Internetverbindung und durchläuft die Findings
selbstständig von links nach rechts. Gesamtergebnis, animierter Prüfer, Stationen,
aktives Finding und das rechts schrittweise wachsende Ergebnisprotokoll bleiben in
einer Bildschirmhöhe ohne vertikales Scrollen sichtbar. Erst der aufrufbare
Detaildialog zeigt längere Nachweise und Handlungsempfehlungen. Nach dem einmaligen
Rundgang bleibt ein Abschlussscreen stehen: Er nennt im Hauptbereich die priorisierten
To-dos mit konkreter Maßnahme und empfohlenem Zeitfenster, während rechts alle
Findings anklickbar bleiben. Nur **Prüflauf erneut ansehen** startet die Animation
bewusst neu. Die Zeitfenster sind risikobasierte Pilotempfehlungen und keine
vertraglichen SLA. Die Datei kann
weitergegeben oder später an einen freigegebenen Mailversand angehängt werden.
Zusätzlich steht die kompakte Ergebnisliste direkt in der GitHub-Laufzusammenfassung.

## Bericht über Microsoft 365 versenden

Der Workflow kann den fertigen Bericht über Microsoft Graph an ein freigegebenes
Microsoft-365-Postfach senden. Fehlen Zugangswerte, wird der Versand neutral
übersprungen. Ein Authentifizierungs- oder Zustellfehler erscheint getrennt in der
GitHub-Zusammenfassung; er verändert den fachlichen Produktstatus des Prüfberichts
nicht.

Vor der Aktivierung muss die Regio-IT-Administration:

1. eine eigene, nicht-interaktive Entra-ID-App für den Qualitätsagenten anlegen,
2. die Microsoft-Graph-**Application Permission** `Mail.Send` hinzufügen und per
   Administratorzustimmung freigeben,
3. die App in Exchange Online per **Application RBAC** auf genau das freigegebene
   Absenderpostfach begrenzen; ein unbeschränkter mandantenweiter Zugriff ist für den
   Betrieb nicht akzeptiert,
4. zunächst ein zeitlich begrenztes Client-Secret mit verantworteter Ablaufkontrolle
   erzeugen und
5. folgende GitHub-Actions-Secrets vollständig setzen:

| GitHub-Secret                 | Inhalt                                      |
| ----------------------------- | ------------------------------------------- |
| `M365_TENANT_ID`              | Verzeichnis-/Mandanten-ID                   |
| `M365_CLIENT_ID`              | Anwendungs-/Client-ID                       |
| `M365_CLIENT_SECRET`          | Wert des zeitlich begrenzten Client-Secrets |
| `QUALITY_REPORT_EMAIL_SENDER` | freigegebenes Absenderpostfach              |
| `QUALITY_REPORT_EMAIL_TO`     | Empfänger, kommasepariert                   |

E-Mail-Adressen und Zugangswerte werden nicht in Workflow, Dokumentation oder
Repository eingetragen. Der Betreff beginnt mit `[GRÜN]`, `[GELB]` oder `[ROT]` und
die Nachricht enthält Maßnahmen, GitHub-Lauf, angemeldeten Artifact-Link sowie
`quality-report.html` als Anhang. Nach dem ersten manuellen Kontrolllauf muss die
GitHub-Zusammenfassung ausdrücklich melden, dass Microsoft Graph die Nachricht
angenommen hat. Diese Annahme bestätigt noch nicht die endgültige Zustellung oder die
Spam-Prüfung im Empfängerpostfach.

Das Client-Secret ist eine Startlösung. Für den späteren Betrieb ist eine
secretfreie, föderierte Identität zu bevorzugen.

## Grenzen und Reaktion auf Fehler

- Der Agent sammelt keine Testeridentitäten und keine Forminhalte.
- Mängel- und Sperrmüll-End-to-End-Wege laufen weiterhin isoliert in CI. Gegen
  Railway wird nur der ausdrücklich synthetische, selbstbereinigende 24/7-Weg
  ausgeführt.
- Bei mehr als 500 Löschkandidaten wird nichts gelöscht. Ursache und Aufbewahrung sind
  dann manuell zu prüfen.
- Bei einem roten Lauf zuerst Trace/Fehlertext und HTML-Artefakt prüfen. Codex liefert
  bei konfiguriertem API-Key nur eine Empfehlung; es erstellt keinen PR automatisch.
- Microsoft-365-Versand bleibt deaktiviert, bis die fünf GitHub-Secrets vollständig
  gesetzt und die App auf das freigegebene Postfach beschränkt wurde.
