# ADR-0011: Geschützte Admin-Pilotbereitstellung

- Status: angenommen
- Datum: 12. August 2026

## Kontext

Die vorhandene Pflege-Unit verwaltet ausschließlich synthetische Pilotdaten, war bisher aber nur
lokal erreichbar und besaß keine Anmeldung. Für den gemeinsamen Aachen-Pilot soll sie zeitlich
begrenzt veröffentlicht werden. Der vorgesehene Identity Provider, OIDC-Rollen und die endgültige
Betriebsplattform sind weiterhin nicht entschieden.

Ein reiner Passwortschutz der Oberfläche reicht nicht aus: Die administrative Railway-API wäre
sonst direkt aufrufbar. Gleichzeitig darf ein technisches API-Geheimnis weder im Browserbundle
noch in den Browserrequests erscheinen.

## Entscheidung

- `apps/admin` wird als eigene Next.js-Anwendung auf Vercel bereitgestellt.
- Der Pilot verwendet vorübergehend denselben menschlichen Zugangscode wie die geschützte
  Bürgerdemo. Admin- und Bürger-Sitzungen bleiben technisch getrennt, sind HMAC-signiert,
  `HttpOnly`, `Secure`, `SameSite=Strict` und höchstens acht Stunden gültig.
- Die Admin-App ruft Railway ausschließlich über einen gleichursprünglichen serverseitigen
  BFF-Pfad auf. Dieser prüft die Admin-Sitzung und ergänzt ein separates, mindestens 32 Zeichen
  langes Service-Geheimnis. Das Geheimnis wird nie an Browsercode ausgeliefert.
- Sämtliche `/v1/admin/*`-Endpunkte prüfen zusätzlich in der Kotlin-API, dass die Pilotpflege
  aktiviert und das Service-Geheimnis korrekt ist. Fehlende Konfiguration schließt den Zugang.
- Die auswählbaren Kommunen werden aus `/v1/tenants` geladen. Jeder Pflegeaufruf trägt den
  ausgewählten und serverseitig validierten Mandantenschlüssel; ein Mandantenwechsel lädt alle
  Daten neu.
- Der lokale Gesamtstart erzeugt pro Prozesslauf ein zufälliges Service-Geheimnis und reicht es
  ausschließlich an lokale API und Admin-BFF weiter.

## Folgen

Der ausgewählte Pilotkreis kann synthetische Inhalte und Vorgänge über einen stabilen,
passwortgeschützten Admin-Link pflegen. Direkte administrative Railway-Aufrufe bleiben ohne das
separate Service-Geheimnis gesperrt.

Dies ist ausdrücklich keine dauerhafte Administrationsidentität. Vor echten Daten, einem breiten
Nutzerkreis oder einer Produktionsfreigabe wird diese Ausnahme durch OIDC, Rollen je Mandant und
Aktion, Auditprotokoll, CSRF-/Rate-Limit-Konzept, Secret Management sowie Sicherheits- und
Betriebsfreigabe ersetzt.
