# ADR-0009: Synthetischer 24/7-Zugang zum Recyclinghof

- Status: angenommen
- Datum: 4. August 2026

## Kontext

Für den Pilot wird ein wirksamer Showcase benötigt: Ein Bürger meldet etwa einen
Fernseher für eine Abgabe um 22 Uhr an, erhält einen Code oder verwendet eine
Kennung am Fahrzeug, und die Zufahrt erkennt Ein- und Ausfahrt. Kamera,
Kennzeichenerkennung, Schranke, Safety-Sensorik, Geräteidentität, Fachverfahren und
rechtliche Freigaben stehen nicht zur Verfügung. Ein bloßer UI-Film wäre fachlich
nicht belastbar; eine scheinbar reale Hardwarefunktion wäre irreführend und riskant.

## Entscheidung

- Der Demo-Mandant aktiviert den Showcase über das Laufzeitmerkmal
  `recyclingAccessShowcase`. Andere Mandanten erhalten die Funktion nicht implizit.
- Der Bürger beantragt einen zeitgebundenen Gastzugang für einen geeigneten
  Recyclinghof und ein Elektroaltgerät. Das API stellt Referenz, Gastzugriffsschlüssel
  und wahlweise einen generierten Demo-Code oder ein synthetisches Kennzeichen aus.
- Kennzeichen werden im Pilot serverseitig nur mit dem Präfix `DEMO-` angenommen.
  Reale Kennzeichen und personenbezogene Fixtures sind ausdrücklich verboten. Die
  normalisierte Kennung wird ausschließlich als SHA-256-Prüfwert gespeichert; der
  Klarwert wird nur bei der erstmaligen Ausstellung zurückgegeben.
- Der persistente Ablauf lautet `authorized` → `entry-granted` → `on-site` →
  `exit-granted` → `completed`. Daraus folgt der Torzustand `closed` → `open-entry`
  → `closed` → `open-exit` → `closed`. Reihenfolge und Kennung prüft der Kotlin-Service,
  Schreibvorgänge sind idempotent und Ereignisse werden protokolliert.
- Die Bürgeroberfläche zeigt Antrag, digitale Zufahrtskarte, Torbewegung, Fahrzeug und
  Ereignisprotokoll. Sie bezeichnet den gesamten Ablauf sichtbar als
  Hardware-Simulation. Es werden keine zusätzlichen Bibliotheken eingeführt.
- Die vier Szenen der Nachtzufahrt verwenden eine am 4. August 2026 eigens für den
  Showcase generierte, lokale Illustration
  (`apps/web/public/recycling-access-storyboard.jpg`). Sie basiert auf keinen
  Fremdvorlagen und enthält weder Logos noch Texte, Personen oder reale Kennzeichen.
  Sämtliche Bedeutung, Beschriftung und Alternativtexte verbleiben zugänglich im HTML.
- Der Simulationsendpunkt ist kein Entwurf eines produktiven Geräteprotokolls. Reale
  Geräte benötigen mindestens gegenseitig authentifizierte Maschinenkommunikation,
  Replay-Schutz, Safety-Sensorik, Offline- und Notfallkonzept, Betriebsüberwachung und
  ein eigenes Threat Model.

## Folgen

Der zentrale Nutzen kann lokal und automatisiert von Antrag bis abgeschlossener
Ausfahrt vorgeführt werden, obwohl keine Hardware vorhanden ist. Das persistente
Domänenmodell macht Fehlerfolgen und Zustandsübergänge testbar. Aus dem Showcase darf
weder eine Betriebsfreigabe noch die Eignung zur realen Kennzeichenverarbeitung oder
Schrankensteuerung abgeleitet werden.

Vor einem Feldversuch sind insbesondere Betreiberverantwortung, zulässige Uhrzeiten
und Abfallarten, Identitätsprüfung, Datenschutz-Folgenabschätzung und Löschfristen,
ANPR-Qualität und manueller Fallback, Tailgating-/Missbrauchsschutz, Lichtschranken und
Personenschutz, Feuerwehr-/Notöffnung, Geräte-PKI, Auditierung, Monitoring sowie die
Fachverfahrensintegration zu entscheiden, umzusetzen und abzunehmen.
