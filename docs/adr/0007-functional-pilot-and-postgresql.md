# ADR-0007: Funktionaler Phase-1/2-Pilot mit PostgreSQL

- Status: angenommen
- Datum: 31. Juli 2026

## Kontext

Der technische Projektstart und die visuelle Demo reichen nicht für fachliche
Nutzertests. Der Auftraggeber hat den Umfang am 31. Juli 2026 ausdrücklich auf einen
größeren, lokal testbaren Pilot erweitert. Freigegeben sind funktionale Phase-1-Wege,
eine getrennte Pflegeoberfläche sowie die Phase-2-Pilotwege Mängel/Reklamationen und
Sperrmüll. Reale Pilotdaten, Bestands-APIs, OIDC, Objekt- und Malwareprüfung,
Fachverfahren und produktive Betriebsfreigaben liegen weiterhin nicht vor.

## Entscheidung

- `apps/web` bleibt die Bürgeranwendung. Eine getrennte Anwendung `apps/admin`
  übernimmt die lokale Pflege synthetischer Termine, Abfall-ABC-Einträge, Standorte
  und Meldungen sowie die Bearbeitung synthetischer Vorgänge.
- PostgreSQL 17 bildet die persistente Pilotdatenbank. Das API verwendet Spring JDBC
  ohne ORM und versioniert das Schema mit Flyway. PostgreSQL 17 ist bis November 2029
  unterstützt und steht lokal in Version 17.10 zur Verfügung.
- Öffentliche und administrative HTTP-Verträge werden gemeinsam contract-first unter
  `contracts/openapi` gepflegt. Fachregeln, Statusübergänge, Idempotenz und
  Slotkapazitäten werden kanonisch im Kotlin-Service umgesetzt.
- `pnpm dev` startet eine projektlokale PostgreSQL-Instanz, API, Bürger-Web und
  Pflegeoberfläche. Daten und Logs liegen ausschließlich unter dem ignorierten
  Verzeichnis `build/`.
- Der Pilot verwendet nur synthetische Daten. Administrative Endpunkte sind lokal
  aktiv und besitzen noch keine produktive Authentifizierung. Sie müssen vor jeder
  externen Bereitstellung deaktiviert oder hinter den freizugebenden OIDC-/Rollenadapter
  gestellt werden.
- Fotos werden im Pilot nur ausgewählt; höchstens drei zulässige Dateinamen werden am
  Vorgang vermerkt. Binärspeicherung, Bildvorschau, Metadatenentfernung und Malwareprüfung sind
  ohne freigegebenen Objekt- und Scanservice kein erfülltes Produktionsmerkmal.
- Gastzugriff verwendet im Pilot eine nicht erratbare öffentliche Referenz plus einen
  getrennten Zugriffsschlüssel. Um eine identische idempotente Pilotantwort liefern zu
  können, liegt dieser Schlüssel derzeit im Klartext in der rein lokalen Datenbank; vor
  jeder externen Nutzung ist er nur gehasht abzulegen oder durch eine separate
  Tokenstrategie zu ersetzen. Aufbewahrung, Löschung, Nachrichten, Zahlungen,
  Behälterservice und externe Fachverfahrensübergabe bleiben außerhalb dieses
  Pilotumfangs.

## Folgen

Anwender können zusammenhängende Bürger- und Pflegewege mit persistenten synthetischen
Daten testen. Der Pilot ist eine belastbare fachliche Lernumgebung, aber keine
Phase-2-Produktionsabnahme. Vor einer Pilotbereitstellung sind insbesondere OIDC und
Rollen, CSRF-/CORS-Konzept, sichere Uploadstrecke, Datenschutz- und Löschkonzept,
Outbox-Zieladapter, Monitoring, Backups, Penetrations- und Wiederherstellungstests zu
entscheiden und umzusetzen.
