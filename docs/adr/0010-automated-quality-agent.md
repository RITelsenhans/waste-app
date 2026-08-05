# ADR-0010: Begrenzter automatischer Qualitätsagent für den Pilot

- Status: angenommen
- Datum: 5. August 2026

## Kontext

Die veröffentlichte Vercel-/Railway-Demo soll morgens und abends automatisch auf
Erreichbarkeit, zentrale Soll-Wege, fehlerhafte Zustände, technische Alt-Daten und
aggregierte Betriebszahlen geprüft werden. Die Auswertung soll ohne Durchklicken als
anschauliche Datei vorführbar sein. Personenbezogene Testeridentifikation ist nicht
Teil des Auftrags. Produktive Authentifizierung, zentrale Observability, verbindliche
Aufbewahrungsregeln und ein freigegebener Maildienst liegen noch nicht vor.

## Entscheidung

- GitHub Actions orchestriert den Qualitätslauf täglich um 07:30 und 18:30 Uhr in
  `Europe/Berlin`; ein manueller Start bleibt möglich.
- Ein eigener Playwright-Lauf meldet sich mit einem Repository-Secret an und prüft den
  veröffentlichten Produktionsbranch. Lesende Bürgerwege werden real ausgeführt.
  Schreibende Bürgerformulare werden bis unmittelbar vor das Absenden geprüft, damit
  kein Bestand synthetischer Beschwerden oder Aufträge durch das Monitoring wächst.
  Die vollständigen schreibenden Soll-Wege bleiben Bestandteil der isolierten CI-
  Browsertests.
- Die API bietet nur bei expliziter Laufzeitaktivierung zwei durch ein separates,
  mindestens 32 Zeichen langes Token geschützte Monitoring-Endpunkte. Sie liefern
  ausschließlich aggregierte Zähler beziehungsweise starten die begrenzte technische
  Wartung.
- Automatisch löschbar sind nach 30 Tagen ausschließlich veröffentlichte Outbox-
  Ereignisse sowie Fall- und 24/7-Idempotenzschlüssel. Fachvorgänge, Ereignisverläufe,
  Termine, Hinweise und Inhaltsdaten werden nicht automatisch gelöscht. Mehr als 500
  Kandidaten blockieren den gesamten Lauf ohne Teil-Löschung.
- Jeder Lauf erzeugt JSON, eine GitHub-Zusammenfassung und eine selbstständig
  animierte, eigenständige HTML-Datei. Das Artefakt bleibt 30 Tage erhalten. E-Mail-
  Versand wird erst ergänzt, wenn Empfänger, Absender und freigegebener Mailweg
  verbindlich vorliegen.
- Codex analysiert ausschließlich fehlgeschlagene Berichte und nur, wenn ein separates
  `OPENAI_API_KEY`-Secret konfiguriert ist. Die Action läuft read-only mit festem
  Ausgabeschema. Sie darf weder Dateien verändern noch Pull Requests, Merges oder
  Deployments auslösen. Ein Pull Request wird höchstens empfohlen.
- Workflow-Tokenrechte bleiben auf `contents: read` begrenzt; alle Actions sind auf
  vollständige Commit-SHAs gepinnt. Passwörter und Tokens erscheinen in keinem
  Artefakt.

## Folgen

Der Pilot erhält einen reproduzierbaren Betriebsindikator mit sichtbaren Findings,
ohne Testpersonen zu verfolgen oder die Demo mit Monitorvorgängen zu verschmutzen.
Die technische Wartung ist reversibilitätsbewusst begrenzt; für fachliche Löschung
bleibt ein abgestimmtes Datenschutz- und Aufbewahrungskonzept erforderlich.

Geplante GitHub-Workflows werden ausschließlich aus dem Default-Branch gestartet.
Solange `quality-agent.yml` noch nicht nach `main` übernommen wurde, ist nur der
manuelle Lauf auf dem Produktionsbranch möglich. Diese Aktivierungsgrenze darf nicht
durch ein ungeprüftes direktes Merge umgangen werden.
