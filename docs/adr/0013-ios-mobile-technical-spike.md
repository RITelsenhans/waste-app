# ADR-0013: Getrennter iOS-Technikspike mit Capacitor

- Status: angenommen
- Datum: 19. Oktober 2026

## Kontext

Der funktionale Pilot ist als eigenständige Next.js-Webanwendung vorhanden. Für die nächste
Bewertung wird kurzfristig ein auf einem iPhone installierbarer Nachweis benötigt, vergleichbar
mit dem bereits bekannten BurnRateApp-Vorgehen. Die Produktspezifikation führt native Apps noch
nicht im Abnahmeumfang und nennt Kotlin Multiplatform mit nativen Oberflächen als bevorzugte
spätere Anschlussarchitektur. Produktive Daten, App-Store-Freigabe, Geräteverwaltung und ein
verbindlicher Mobilbetrieb sind nicht vorhanden.

## Entscheidung

- Unter `apps/mobile` entsteht ein eigener React-/Vite-Client in einer Capacitor-8-Hülle. Die
  Next.js-Webanwendung wird nicht eingebettet und bleibt eigenständig.
- Das iOS-Projekt verwendet Swift Package Manager. Der Bundle Identifier des Spikes lautet
  `de.regioit.abfall.pilot`; Name und Oberfläche kennzeichnen ihn sichtbar als synthetischen
  Technikpilot.
- Der Client verwendet die gemeinsamen Design Tokens und den generierten OpenAPI-Client. Die
  API bleibt Quelle der Mandanten-, Adress- und Termindaten; Geschäftsregeln werden nicht in
  die App kopiert.
- Lokal gespeichert wird ausschließlich der Suchtext der synthetischen Pilotadresse über
  Capacitor Preferences. Personenbezogene Daten, Zugangsschlüssel und Fachdaten werden nicht
  offline abgelegt.
- Im iOS-Simulator spricht die App mit `http://localhost:8080`; die Pilot-API erlaubt dafür
  exakt den Origin `capacitor://localhost`. Für Geräte- oder Pilotverteilung ist eine HTTPS-URL
  explizit zu konfigurieren.
- Der Spike bewertet Build, Installation, lokale Einstellung und API-Verbindung. Er ist keine
  Ablösung der in der Produktspezifikation bevorzugten nativen Zielarchitektur.

## Folgen

Der kritische technische Pfad lässt sich mit geringem Zusatzaufwand im iOS-Simulator und später
auf einem signierten Testgerät erproben. Web und Mobile teilen Vertrag, Daten und Designwerte,
haben aber getrennte Oberflächen und Builds.

Vor einem TestFlight- oder Produktivpiloten bleiben insbesondere Apple-Developer-Team und
Signierung, Bundle-ID-Freigabe, HTTPS-Endpunkt, Authentisierung, sichere Gerätespeicherung,
Datenschutz- und Barrierefreiheitsprüfung, Push-Konzept, Offlineverhalten, Geräte-/OS-Matrix,
App-Store-Texte sowie die endgültige Entscheidung Capacitor versus Kotlin Multiplatform offen.
