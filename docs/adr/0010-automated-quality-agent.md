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
  Mängel- und Sperrmüllformulare werden bis unmittelbar vor das Absenden geprüft,
  damit kein entsprechender Bestand durch das Monitoring wächst. Der ausdrücklich
  synthetische 24/7-Zugang wird dagegen im echten Browser vollständig gebucht und
  bis zur Ausfahrt durchlaufen, damit auch Browser-CORS, Web-Proxy und API-Schreibweg
  erfasst werden.
- Die API bietet nur bei expliziter Laufzeitaktivierung drei durch ein separates,
  mindestens 32 Zeichen langes Token geschützte Monitoring-Endpunkte. Sie liefern
  ausschließlich aggregierte Zähler und nicht geheime Railway-Releaseinformationen
  beziehungsweise starten die begrenzte technische Wartung oder entfernen den exakt
  markierten eigenen 24/7-Testzugang. Die Webanwendung liefert
  Vercel-Releaseinformationen nur innerhalb der geschützten Demo-Sitzung. Der Agent
  vergleicht beide Deployment-SHAs und Branches mit dem ausgecheckten
  Produktionsbranch.
- Die freigegebene technische Baseline liegt maschinenlesbar im Repository. Der Lauf
  vergleicht Node.js, Java, Next.js, Spring Boot und Kotlin mit den deklarierten und
  tatsächlich gemeldeten Versionen. Zusätzlich prüft er `pnpm audit`, offene hohe
  beziehungsweise kritische Dependabot-Warnungen, Alter und Ergebnis des letzten
  Security-/CodeQL-Laufs sowie offene reguläre Dependabot-Updates. Ein normales
  Update ist ein gelber Hinweis; eine Baselineabweichung oder bekannte hohe
  Sicherheitswarnung ist ein roter Fehler. „Keine bekannten Funde“ ist keine
  allgemeine Garantie der Risikofreiheit.
- Automatisch löschbar sind nach 30 Tagen ausschließlich veröffentlichte Outbox-
  Ereignisse sowie Fall- und 24/7-Idempotenzschlüssel. Fachvorgänge, Ereignisverläufe,
  Termine, Hinweise und Inhaltsdaten werden nicht automatisch gelöscht. Mehr als 500
  Kandidaten blockieren den gesamten Lauf ohne Teil-Löschung.
- Zusätzlich darf der Agent genau seinen eigenen, höchstens eine Stunde alten
  24/7-Testzugang unmittelbar entfernen. Er muss dem Demo-Mandanten angehören, über
  das Browserformular mit einer exakt passenden `DEMO-QA-`-Kennung erzeugt worden
  sein und über den Monitoring-Token zusammen mit Referenz und Kennung bestätigt
  werden. Ereignisse, Idempotenzschlüssel und Antrag werden in einer Transaktion
  gelöscht. Andere Demo- oder Fachvorgänge erfüllen diese Bedingungen nicht.
- Jeder Lauf erzeugt JSON, eine GitHub-Zusammenfassung und eine selbstständig
  animierte, eigenständige HTML-Datei. Die Showansicht belegt genau eine
  Bildschirmhöhe ohne vertikales Scrollen und zeigt Gesamtergebnis, laufenden
  Prüfer, alle Stationen, das jeweils aktive Finding sowie rechts ein während des
  Rundgangs wachsendes Ergebnisprotokoll. Ein Durchklicken ist nicht erforderlich.
  Ergebniszeichen und Protokolleinträge erscheinen erst nach dem sichtbaren
  Abschluss der jeweiligen Station. Station, aktuelles Finding und Protokolleintrag
  öffnen denselben Dialog **Details & Lösung** mit tatsächlichem Prüfgegenstand,
  Handlungsempfehlung und – sofern vorhanden – GitHub-Belegquelle. Offene
  Dependabot-PRs werden mit Nummer und Titel in die Offline-Datei eingebettet. Der
  Rundgang läuft genau einmal und bleibt anschließend auf einem Abschlussscreen
  stehen; ein erneuter Ablauf benötigt die ausdrückliche Aktion
  **Prüflauf erneut ansehen**. Der Hauptbereich priorisiert dort die erforderlichen
  Maßnahmen und nennt risikobasierte Reaktionsfenster. Bestandene Prüfungen benötigen
  keine Änderung, operative Fehler sind am selben Tag, bekannte hohe
  Sicherheitsrisiken innerhalb von 24 Stunden und reguläre Updates innerhalb von 14
  Kalendertagen zu bearbeiten. Diese Zeitfenster sind Empfehlungen für den Pilot und
  keine vertraglichen SLA. Bei Zeitplänen bleibt GitHubs sichtbarer Auslöser technisch
  der Default-Branch `main`; Laufname, Zusammenfassung und HTML unterscheiden deshalb
  ausdrücklich zwischen dieser Workflow-Quelle und dem tatsächlich ausgecheckten
  Produktionsbranch samt geprüfter Revision. Nach dem Upload ergänzt der Workflow
  die GitHub-Zusammenfassung um den direkten, angemeldeten Artifact-Link. Das
  Artefakt bleibt 30 Tage erhalten. E-Mail-Versand wird erst ergänzt, wenn Empfänger,
  Absender und freigegebener Mailweg verbindlich vorliegen.
- Codex analysiert ausschließlich fehlgeschlagene Berichte und nur, wenn ein separates
  `OPENAI_API_KEY`-Secret konfiguriert ist. Die Action läuft read-only mit festem
  Ausgabeschema. Sie darf weder Dateien verändern noch Pull Requests, Merges oder
  Deployments auslösen. Ein Pull Request wird höchstens empfohlen.
- Workflow-Tokenrechte bleiben ausschließlich lesend und sind auf `actions`,
  `contents`, `pull-requests` und `security-events` begrenzt; alle Actions sind auf
  vollständige Commit-SHAs gepinnt. Passwörter und Tokens erscheinen in keinem
  Artefakt.

## Folgen

Der Pilot erhält einen reproduzierbaren Betriebsindikator mit sichtbaren Findings,
ohne Testpersonen zu verfolgen oder die Demo mit Monitorvorgängen zu verschmutzen.
Die technische Wartung ist reversibilitätsbewusst begrenzt; für fachliche Löschung
bleibt ein abgestimmtes Datenschutz- und Aufbewahrungskonzept erforderlich.

Geplante GitHub-Workflows und deren manueller `workflow_dispatch` werden nur
ausgeführt, wenn die Workflow-Datei im Default-Branch vorhanden ist. Solange
`quality-agent.yml` noch nicht geprüft nach `main` übernommen wurde, bleibt der
GitHub-Lauf deshalb vollständig inaktiv. Diese Aktivierungsgrenze darf nicht durch ein
ungeprüftes direktes Merge umgangen werden.
