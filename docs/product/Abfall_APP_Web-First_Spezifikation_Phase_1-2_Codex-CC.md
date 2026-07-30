# Abfall APP – Web-First-Umsetzungsspezifikation

<!-- Kanonische Produktspezifikation im Monorepository. -->

## Phase 1 „Web Core Relaunch“ und Phase 2 „Bürger-Service“

**Status:** Entwurf 1.0 zur fachlichen, technischen und kaufmännischen Prüfung  
**Stand:** 30. Juli 2026  
**Auftraggeber:** Regio IT  
**Ziel:** Umsetzungs- und Abnahmegrundlage für Codex und CC  
**Primäre Plattform:** responsive Webanwendung / Progressive Web App  
**Spätere Plattformen:** Android und iOS auf Basis derselben API- und Fachverträge  

> **Leitentscheidung:** Zuerst wird eine produktive, barrierefreie und mandantenfähige Webanwendung gebaut. Phase 1 modernisiert den Informationskern. Phase 2 ergänzt die priorisierten transaktionalen Bürgerdienste. Native Apps werden erst danach auf denselben Verträgen und Design Tokens aufgebaut.

## 0. Management Summary

Diese Spezifikation beschreibt eine Web-First-Neuentwicklung der Abfall APP. Sie ist so formuliert, dass einzelne Arbeitspakete direkt an Codex oder CC übergeben werden können. Als Arbeitsannahme steht **CC für Claude Code**. Beide Coding-Agenten arbeiten nach denselben Repository-Regeln, Architekturentscheidungen, Qualitätsgates und Akzeptanzkriterien.

Die Priorisierung folgt dem Leitmotiv aus der bisherigen Entscheidungsvorlage:

1. **Kalender ist Pflicht.** Nutzende erwarten richtige Termine, Erinnerungen, Adressen, Abfall-ABC, Standorte und aktuelle Hinweise.
2. **Erledigte Vorgänge überzeugen.** Mängel, Sperrmüll, Behälterservice und Vorgangsstatus werden zu durchgängigen digitalen Bürgerdiensten.

Phase 1 liefert einen produktiven Web Core Relaunch mit neuem Look:

- mandantenfähiges Branding und konfigurierbare Funktionen,
- Adressauswahl und mehrere gespeicherte Standorte,
- eine personalisierte Startseite mit nächstem Abfuhrtermin,
- Abfuhrkalender und Kalenderabonnement,
- Abfall-ABC mit fehlertoleranter Suche,
- Entsorgungsstandorte mit Liste, Karte und Filtern,
- Meldungen und kurzfristige Änderungen,
- responsive und barrierefreie Bedienung,
- PWA-Grundlage mit Offline-Fallback,
- Monitoring, Support und kontrollierter Pilot.

Phase 2 ergänzt die priorisierten Bürgerdienste:

- Mängel und Reklamationen mit Foto, Standort und Vorgangsnummer,
- Sperrmüll mit Mengenerfassung, Terminwahl, Bestätigung und optionaler Zahlung,
- Behälterservice für Anmeldung, Änderung, Reparatur und Zusatzleerung,
- „Meine Vorgänge“ mit Status, Dokumenten und Rückfragen,
- optionale Anmeldung über ein vorhandenes Servicekonto,
- Fachverfahrens-, SAP-, Dispositions- und Tourenübergabe,
- revisionsfähige Status- und Ereignisverarbeitung.

Fotoerkennung, Chatbot, IoT-Füllstände und Gamification sind **kein Abnahmekriterium** für Phase 1 oder Phase 2. Fotoerkennung kann als separat aktivierbarer Pilot vorbereitet werden.

## 1. Zweck, Geltung und Verbindlichkeit

### 1.1 Zweck

Das Dokument dient gleichzeitig als:

- fachliche Produktspezifikation,
- UX- und Designvorgabe,
- technische Zielbeschreibung,
- API- und Integrationsrahmen,
- Backlog für Phase 1 und Phase 2,
- Abnahmegrundlage,
- Arbeitsgrundlage für Codex und CC,
- Basis für Aufwandsschätzung, Ausschreibung und Pilotplanung.

### 1.2 Verbindlichkeitsstufen

- **MUSS:** zwingend für die Abnahme.
- **SOLL:** grundsätzlich umzusetzen; eine Abweichung benötigt eine dokumentierte Produkt- oder Architekturentscheidung.
- **KANN:** optionale Erweiterung, die den verbindlichen Umfang nicht gefährden darf.
- **HIGH:** hohe fachliche Priorität und Bestandteil des geplanten Phasenumfangs.
- **CONDITIONAL:** nur bei aktivierter Mandantenfunktion oder vorhandener Fremdsystemvoraussetzung.

### 1.3 Arbeitsannahmen

- Die Bestands-APIs und Fachverfahren werden vor Implementierungsbeginn inventarisiert.
- Bestehende geeignete Komponenten werden weiterverwendet, wenn Sicherheit, Wartbarkeit und Zielarchitektur nicht beeinträchtigt werden.
- Der Webkanal ist in Phase 1 und Phase 2 führend. Android und iOS sind nicht Teil dieser Abnahme.
- Die Webanwendung wird von Beginn an für spätere Apps vorbereitet: keine ausschließlich im Browser implementierten Geschäftsregeln, versionierte APIs und plattformneutrale Design Tokens.
- Ein Produktmandant entspricht grundsätzlich einer Kommune oder einem kommunalen Entsorgungsgebiet.
- Informationsfunktionen bleiben ohne Benutzerkonto nutzbar.
- Für personenbezogene Vorgänge wird je nach Mandant ein Gastzugang, ein Transaktionscode oder ein OIDC-Servicekonto verwendet.

## 2. Produktvision und priorisierte Funktionen

### 2.1 Produktvision

Die Abfall APP wird vom digitalen Kalender zu einem persönlichen, verlässlichen und leicht bedienbaren Einstiegspunkt für kommunale Entsorgungsservices:

**Sehen. Verstehen. Erledigen. Nachverfolgen.**

Die Startseite beantwortet zuerst:

1. Was wird an meiner Adresse als Nächstes abgeholt?
2. Gibt es eine Änderung oder Störung?
3. Wie entsorge ich einen Gegenstand?
4. Wo ist der passende Entsorgungsstandort?
5. Welchen Service kann ich direkt beauftragen?
6. Wie ist der Status meines Vorgangs?

### 2.2 High-Priority-Matrix

| Prioritätsblock | Funktionen | Phase | Verbindlichkeit |
|---|---|---|---|
| HIGH-1 Informationskern | Adresse, Startseite, Termine, Kalender, ABC, Standorte, Meldungen | Phase 1 | MUSS |
| HIGH-1 Nutzungskomfort | Responsive Design, Barrierefreiheit, PWA, Offline-Fallback, Mandantenbranding | Phase 1 | MUSS |
| HIGH-2 Mängel | Foto, Standort, Kategorie, Beschreibung, Zuständigkeit, Status | Phase 2 | MUSS |
| HIGH-2 Sperrmüll | Gegenstände/Mengen, Slot, Bestätigung, Storno, Übergabe | Phase 2 | MUSS |
| HIGH-2 Behälterservice | Anmeldung, Änderung, Reparatur, Zusatzleerung | Phase 2 | MUSS |
| HIGH-2 Vorgänge | Vorgangsnummer, Status, Dokumente, Rückfragen | Phase 2 | MUSS |
| HIGH-2 Fachverfahren | Adapter, sichere Übergabe, Rückmeldungen, Wiederholung | Phase 2 | MUSS |
| Zahlungsoption | Zahlungsstart, Rückleitung, Status, Beleg | Phase 2 | CONDITIONAL |
| Servicekonto | OIDC-Anmeldung und Vorgangszusammenführung | Phase 2 | CONDITIONAL |
| Fotoerkennung | Vorschlag für Abfallart oder Mängelkategorie | späterer Pilot | KANN |

### 2.3 Produktprinzipien

1. **Der nächste relevante Inhalt zuerst.**
2. **Kein Konto für reine Information.**
3. **Eine Aufgabe, ein klarer Weg.**
4. **Eingaben nur einmal erfassen.**
5. **Status statt schwarzes Loch.**
6. **Offline besser als leer oder unverständlich.**
7. **Barrierefreiheit ist Abnahmekriterium.**
8. **Mandantenkonfiguration statt Code-Forks.**
9. **Geschäftsregeln gehören in Domain und Backend, nicht in einzelne Seiten.**
10. **Jede Phase liefert ein betreibbares Produkt.**

### 2.4 Nicht im Umfang

- native Android- oder iOS-App,
- vollständige Ablösung aller bestehenden SAP- oder Fachverfahrenskomponenten,
- eigenständiges Redaktions- oder Kommunalportal, sofern ein geeignetes Bestandssystem existiert,
- autonom entscheidende KI,
- IoT-Füllstände und Sensorintegration,
- komplexe Gamification,
- allgemeiner Chatbot,
- vollständige digitale Identitätsplattform,
- Speicherung von Karten- oder Zahlungsdaten durch Regio IT.

## 3. Phasenmodell

### 3.1 Phase 1 – Web Core Relaunch

**Ziel:** Produktive, responsive, barrierefreie und mandantenfähige Webanwendung mit modernisiertem Informationskern.

**Planungskorridor:**

- Dauer: 20–28 Wochen
- Aufwand: 220–320 Personentage
- Budget: 250–380 T€ netto
- Ergebnis: produktiver Pilot mit mindestens einer Kommune

**Abhängigkeiten:**

- freigegebene Pilotdaten,
- dokumentierte Bestands-APIs,
- entschiedener Kartenanbieter,
- freigegebenes Regio-IT-Design und mindestens ein Mandantenbeispiel,
- Betriebs- und Deploymentumgebung,
- Datenschutz- und Barrierefreiheitsbegleitung.

### 3.2 Phase 2 – Bürger-Service

**Ziel:** Durchgängige transaktionale Dienste mit Vorgangsstatus und Fachverfahrensintegration.

**Planungskorridor:**

- Dauer: 24–36 Wochen
- Aufwand: 300–460 Personentage
- Budget: 330–540 T€ netto
- Ergebnis: produktiver Bürger-Service-Pilot mit mindestens zwei vollständigen Vorgangsarten

**Abhängigkeiten:**

- Phase 1 ist abgenommen und im Pilot stabil,
- Fachverfahren besitzen belastbare Schreib- und Statusschnittstellen oder abgestimmte Adapter,
- Verantwortlichkeiten für Status, Fristen und Support sind geklärt,
- Identitäts- und Zahlungsoptionen sind entschieden,
- Aufbewahrungs-, Lösch- und Nachweispflichten sind freigegeben.

### 3.3 Kostensteuerung

Die Korridore sind Planungswerte, keine Festpreise. Jede Phase wird in vorführbare Lieferabschnitte zerlegt. Die folgenden Elemente dürfen separat beauftragt oder verschoben werden:

- Web Push,
- Karte mit proprietärem Anbieter,
- Servicekonto,
- Onlinezahlung,
- Fotoerkennungs-Pilot,
- zusätzliche Fachverfahrensadapter,
- Migration historischer Vorgänge.

Der Kernumfang einer Phase darf durch optionale Elemente nicht gefährdet werden.

## 4. Neuer Look und User Experience

### 4.1 Gestaltungsziel

Der neue Look soll vertrauenswürdig, kommunal, modern und ruhig wirken. Die Oberfläche ist keine Sammlung gleichgewichtiger Kacheln. Sie priorisiert den nächsten relevanten Termin, aktive Störungen und die häufigsten Handlungen.

**Gestaltungsformel:** klare Hierarchie + großzügige Flächen + starke Zustände + kurze Wege.

### 4.2 Design Tokens

| Token | Wert | Verwendung |
|---|---|---|
| `brand.primary` | `#C8102E` | Regio-IT-Akzent, aktive Elemente, Hauptaktion |
| `text.strong` | `#17233A` | Überschriften und primärer Text |
| `accent.info` | `#008F8C` | Information und Sekundäraktion |
| `status.success` | `#54A846` | bestätigt, planmäßig, abgeschlossen |
| `status.warning` | `#F1A62A` | Änderung, Frist, Aufmerksamkeit |
| `status.danger` | `#B42318` | Ausfall, Fehler, kritischer Hinweis |
| `surface.page` | `#F6F8FB` | Seitenhintergrund |
| `surface.card` | `#FFFFFF` | Karten und Dialoge |
| `border.default` | `#CBD3DD` | Trennung und Eingabefelder |
| `radius.card` | `12px` | Karten |
| `radius.control` | `8px` | Eingaben und Buttons |
| `shadow.card` | dezent | nur für Hierarchie, nicht als Dekoration |

**Typografie:**

- bevorzugt Inter Variable, selbst gehostet und lizenzgeprüft,
- Fallback: `ui-sans-serif`, systemeigene Schrift,
- Basisgröße mindestens 16 px,
- Zeilenhöhe mindestens 1,5 für längere Texte,
- klare Rollen für Display, H1, H2, H3, Body, Label und Caption,
- keine Information ausschließlich in Versalien.

### 4.3 Startseite Desktop

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Logo   Start  Kalender  Abfall-ABC  Standorte  Services     Adresse │
├──────────────────────────────────────────────────────────────────────┤
│ [Störung oder wichtige Änderung – falls vorhanden]                   │
├────────────────────────────────────────────┬─────────────────────────┤
│ NÄCHSTE ABHOLUNG                           │ SCHNELLAKTIONEN          │
│ Dienstag, 4. August                        │ Abfall nachschlagen      │
│ Restabfall · Zuhause                       │ Standort finden          │
│ planmäßig · in 5 Tagen                     │ Mangel melden (Phase 2)  │
│ [Alle Termine]                             │ Sperrmüll (Phase 2)      │
├────────────────────────────────────────────┴─────────────────────────┤
│ Die nächsten Termine        │ Aktuelle Hinweise │ Häufig gesucht       │
├──────────────────────────────────────────────────────────────────────┤
│ Service und Hilfe · Datenschutz · Barrierefreiheit · Kontakt         │
└──────────────────────────────────────────────────────────────────────┘
```

### 4.4 Startseite Mobile

```text
┌──────────────────────────────┐
│ Logo               Adresse ▾ │
│ [wichtiger Hinweis]          │
│                              │
│ Nächste Abholung             │
│ Di, 4. August                │
│ Restabfall · in 5 Tagen      │
│ [Alle Termine]               │
│                              │
│ Schnell erledigen            │
│ [ABC] [Standorte]            │
│ [Mangel] [Sperrmüll]         │
│                              │
│ Nächste Termine              │
├──────────────────────────────┤
│ Start  Kalender  ABC  Mehr   │
└──────────────────────────────┘
```

### 4.5 Responsive Verhalten

- Unterstützte Breiten: 320 px bis mindestens 1920 px.
- Breakpoints werden in Design Tokens dokumentiert und nicht seitenweise erfunden.
- Desktop verwendet eine begrenzte Inhaltsbreite von ungefähr 1200–1280 px.
- Tablet darf List-Detail-Muster verwenden.
- Mobil werden Sekundärinformationen progressiv eingeklappt.
- Navigation bleibt mit Tastatur, Screenreader und 200 % Zoom vollständig nutzbar.
- Touch-Ziele erfüllen mindestens die vereinbarten WCAG-2.2-Kriterien.
- Tabellen werden auf kleinen Breiten als zugängliche Karten oder Definitionslisten dargestellt, sofern horizontales Scrollen die Aufgabe behindert.

### 4.6 Zustände

Jede relevante Oberfläche MUSS folgende Zustände gestalten und testen:

- initiales Laden,
- Aktualisieren mit vorhandenen Daten,
- leerer Datenbestand,
- Offline mit Cache,
- Offline ohne Cache,
- fachlicher Fehler,
- technischer Fehler,
- Teilfehler bei weiterhin nutzbaren Inhalten,
- nicht berechtigt,
- abgelaufener Link,
- erfolgreicher Abschluss,
- Vorgang in Bearbeitung,
- Aktion erforderlich.

Skeletons werden nur verwendet, wenn noch keine verwertbaren Daten vorhanden sind. Vorhandene Daten werden beim Aktualisieren nicht unnötig verdeckt.

### 4.7 Inhalts- und Sprachregeln

- Überschriften beschreiben Aufgabe oder Ergebnis.
- Fachbegriffe werden erklärt oder vermieden.
- Fehlermeldungen nennen Problem, Auswirkung und nächsten Schritt.
- Datum, Zeit, Abfallarten und Servicebezeichnungen folgen der Mandantenkonfiguration.
- Status wird mit Text und optionalem Icon dargestellt, nie nur über Farbe.
- Nutzende werden nicht mit internen SAP-, Dispositions- oder Fehlercodes konfrontiert.
- Formulare verwenden kurze Abschnitte, Fortschrittsanzeige und Zusammenfassung vor dem Absenden.

## 5. Informationsarchitektur und Navigation

### 5.1 Primärnavigation Phase 1

1. Start
2. Kalender
3. Abfall-ABC
4. Standorte
5. Mehr

Unter „Mehr“:

- Meldungen,
- Adressen,
- Erinnerungen,
- Hilfe und Kontakt,
- Datenschutz,
- Barrierefreiheit,
- Impressum.

### 5.2 Erweiterung Phase 2

Phase 2 ergänzt:

- Services,
- Meine Vorgänge.

Auf mobilen Breiten bleibt die Primärnavigation auf höchstens fünf Einträge begrenzt. Services oder Vorgänge können kontextabhängig unter „Mehr“ liegen, wenn die Nutzertests dies bestätigen.

### 5.3 URL- und Deep-Link-Konzept

Stabile, sprechende Pfade:

```text
/{tenant}/
/{tenant}/kalender
/{tenant}/abfall-abc
/{tenant}/abfall-abc/{slug}
/{tenant}/standorte
/{tenant}/standorte/{id}
/{tenant}/meldungen/{id}
/{tenant}/services
/{tenant}/services/maengel/new
/{tenant}/services/sperrmuell/new
/{tenant}/services/behaelter/new
/{tenant}/vorgaenge
/{tenant}/vorgaenge/{reference}
```

URLs enthalten keine vollständigen Adressen, personenbezogenen Daten oder internen Fachverfahrensschlüssel.

## 6. Phase 1 – Fachliche Anforderungen

### 6.1 WF1-PLT – Mandanten- und Webgrundlage

**WF1-PLT-001 – Mandantenermittlung (HIGH, MUSS)**  
Der Mandant wird über Domain, Pfad, freigegebenen Einstieg oder explizite Auswahl ermittelt.

Akzeptanzkriterien:

- Ein unbekannter Mandant führt zu einer verständlichen neutralen Fehlerseite.
- Die Mandanten-ID wird serverseitig validiert.
- Kein Mandant kann Daten eines anderen Mandanten abrufen.
- Ein Mandantenwechsel trennt Browserdaten und Cachebereiche sauber.

**WF1-PLT-002 – Remote-Konfiguration (HIGH, MUSS)**  
Folgende Werte sind ohne neues Web-Deployment konfigurierbar:

- Name, Kurzname und Logo,
- Primär- und Akzentfarben innerhalb zulässiger Kontrastgrenzen,
- Kontakt- und Rechtsinformationen,
- Zeitzone und Sprachen,
- aktivierte Module,
- Kartenkonfiguration,
- Standardwerte für Erinnerungen,
- Abfallarten, Icons und Bezeichnungen,
- Support- und Störungshinweise,
- Feature Flags.

**WF1-PLT-003 – Designsystem (HIGH, MUSS)**  
Komponenten werden aus versionierten Design Tokens und dokumentierten Zuständen aufgebaut.

**WF1-PLT-004 – Progressive Enhancement (MUSS)**  
Kritische Informationsseiten liefern verwertbares HTML vom Server. Navigation, Lesen und grundlegende Formulare dürfen nicht ausschließlich von clientseitigem JavaScript abhängen.

**WF1-PLT-005 – Datenschutzfreundliche Analyse (SOLL)**  
Produktmetriken sind nur nach dokumentierter Rechtsgrundlage aktiv. Keine vollständigen Adressen, Suchtexte, Fotos oder Vorgangsinhalte werden als Standardtelemetrie erfasst.

### 6.2 WF1-ADR – Adresse und Standortprofil

**WF1-ADR-001 – Adresssuche (HIGH, MUSS)**  
Nutzende wählen Straße, Hausnummer, Ort und gegebenenfalls Ortsteil.

Akzeptanzkriterien:

- Suche startet erst nach konfigurierbarer Mindestlänge.
- Gleichnamige Straßen sind unterscheidbar.
- Nicht belieferte Adressen werden verständlich erklärt.
- Eingaben werden nicht ohne Rechtsgrund serverseitig dauerhaft gespeichert.
- Tastatur und Screenreader können alle Ergebnisse bedienen.

**WF1-ADR-002 – Mehrere Adressen (HIGH, MUSS)**  
Mindestens fünf Adressen können lokal benannt und gespeichert werden.

**WF1-ADR-003 – Standardadresse (HIGH, MUSS)**  
Ein Wechsel aktualisiert Startseite, Kalender, Meldungen und Servicekontext konsistent.

**WF1-ADR-004 – Standortfreigabe (KANN)**  
Browser-Geolocation darf zur Vorauswahl angeboten werden. Die Anwendung bleibt bei Ablehnung vollständig nutzbar.

### 6.3 WF1-HOM – Personalisierte Startseite

**WF1-HOM-001 – Nächster Termin (HIGH, MUSS)**  
Der nächste relevante Abfuhrtermin ist das primäre Element der Startseite.

Anzuzeigen sind:

- Datum und Wochentag,
- Abfallart mit Text und Icon,
- ausgewählte Adresse,
- Status planmäßig, geändert, zusätzlich oder ausgefallen,
- verbleibende Zeit in verständlicher Form,
- Link zu allen Terminen.

**WF1-HOM-002 – Mehrere Abfallarten (MUSS)**  
Fallen mehrere Abfallarten am selben Tag an, werden alle sichtbar und semantisch korrekt gruppiert.

**WF1-HOM-003 – Störungsbanner (HIGH, MUSS)**  
Adress- oder mandantenbezogene kritische Änderungen erscheinen oberhalb normaler Inhalte.

**WF1-HOM-004 – Schnellaktionen (HIGH, MUSS)**  
Mindestens Abfall-ABC, Standorte und Kalender werden gezeigt. Phase-2-Services erscheinen nur bei aktiviertem Feature Flag.

**WF1-HOM-005 – Aktualitätsanzeige (MUSS)**  
Bei Cache- oder Offline-Daten ist die letzte erfolgreiche Aktualisierung sichtbar.

### 6.4 WF1-CAL – Abfuhrkalender

**WF1-CAL-001 – Terminliste (HIGH, MUSS)**  
Chronologische, gruppierte und zugängliche Liste kommender Termine.

**WF1-CAL-002 – Filter (HIGH, MUSS)**  
Abfallarten können ein- und ausgeblendet werden. Filter werden lokal pro Adresse gespeichert.

**WF1-CAL-003 – Terminänderungen (HIGH, MUSS)**  
Verschobene, zusätzliche und ausgefallene Termine werden fachlich eindeutig modelliert. Ein ursprünglicher und neuer Termin erscheinen nicht als zwei reguläre Abholungen.

**WF1-CAL-004 – Kalenderabonnement (HIGH, MUSS)**  
Ein abonnierbarer Kalender wird angeboten. Zeitzonen, Sommerzeit, Aktualisierungen und doppelte Einträge werden beherrscht.

**WF1-CAL-005 – Einzelterminexport (SOLL)**  
Ein einzelner Termin kann über ein standardkonformes Kalenderformat übernommen werden.

### 6.5 WF1-ABC – Abfall-ABC

**WF1-ABC-001 – Volltextsuche (HIGH, MUSS)**  
Bezeichnungen, Synonyme, Schreibvarianten und häufige Tippfehler werden berücksichtigt.

**WF1-ABC-002 – Suchvorschläge (HIGH, MUSS)**  
Passende Begriffe und Kategorien erscheinen während der Eingabe und sind per Tastatur bedienbar.

**WF1-ABC-003 – Eintragsdetail (HIGH, MUSS)**  
Enthalten sind Gegenstand, zulässiger Entsorgungsweg, ausgeschlossene Wege, Hinweise, Sicherheit, passende Standorte, Gültigkeit und Datenstand.

**WF1-ABC-004 – Keine Treffer (MUSS)**  
Alternative Begriffe, Kategorien und Kontaktmöglichkeit verhindern eine Sackgasse.

**WF1-ABC-005 – Offline-Daten (SOLL)**  
Der zuletzt synchronisierte Bestand bleibt in der installierten PWA durchsuchbar.

### 6.6 WF1-SIT – Entsorgungsstandorte

**WF1-SIT-001 – Liste und Karte (HIGH, MUSS)**  
Standorte stehen als Liste und Karte zur Verfügung. Die Liste funktioniert unabhängig von Karten- oder Standortberechtigungen.

**WF1-SIT-002 – Filter (HIGH, MUSS)**  
Filter unterstützen Standortart, angenommene Abfälle und „jetzt geöffnet“.

**WF1-SIT-003 – Detail (HIGH, MUSS)**  
Name, Typ, Adresse, reguläre und abweichende Öffnungszeiten, akzeptierte Abfälle, Kontakt, Hinweise, Datenstand und externe Navigation.

**WF1-SIT-004 – Kartenfallback (MUSS)**  
Ausfall, Ablehnung oder Blockierung des Kartenanbieters beeinträchtigt die Standortliste nicht.

### 6.7 WF1-NEW – Meldungen und Störungen

**WF1-NEW-001 – Meldungstypen (HIGH, MUSS)**  
Allgemeine Nachricht, gebietsbezogene Störung, Terminänderung, Standortänderung und Wartungshinweis.

**WF1-NEW-002 – Gültigkeit (MUSS)**  
Meldungen besitzen Start, Ende, Priorität und Zielgruppe. Abgelaufene Meldungen verschwinden aus aktiven Ansichten.

**WF1-NEW-003 – Kritische Meldung (MUSS)**  
Kritische Meldungen werden visuell und semantisch hervorgehoben, blockieren aber nicht unnötig die gesamte Navigation.

**WF1-NEW-004 – Web Push (CONDITIONAL)**  
Web Push wird nur aktiviert, wenn Browserunterstützung, Datenschutz, Support und Betrieb im technischen Spike positiv bewertet sind.

### 6.8 WF1-PWA – PWA und Offline

**WF1-PWA-001 – Installierbarkeit (SOLL)**  
Manifest, Icons und Service Worker ermöglichen eine installierbare PWA auf unterstützten Browsern.

**WF1-PWA-002 – Offline-Shell (MUSS)**  
Navigation, Hilfe, Rechtsinformationen und verständliche Offline-Seite stehen ohne Netz zur Verfügung.

**WF1-PWA-003 – Fachcache (SOLL)**  
Zuletzt geladene Termine, ABC-Einträge, Standorte und aktive Meldungen können offline gelesen werden.

**WF1-PWA-004 – Cachetrennung (MUSS)**  
Cache Keys enthalten Mandant, Datenart, Version und gegebenenfalls Adress-ID. Ein Mandantenwechsel vermischt keine Inhalte.

**WF1-PWA-005 – Updateverhalten (MUSS)**  
Ein neuer Service Worker übernimmt kontrolliert. Offene Formulare oder Vorgänge dürfen nicht durch einen stillen Reload verloren gehen.

### 6.9 WF1-SET – Einstellungen, Hilfe und Recht

**WF1-SET-001 – Einstellungen (MUSS)**  
Adressen, Filter, Darstellung, Sprache und optionale Benachrichtigungen sind verwaltbar.

**WF1-SET-002 – Rechtsinformationen (MUSS)**  
Impressum, Datenschutz, Barrierefreiheitserklärung, Open-Source-Lizenzen und Kontakt sind von jeder Seite erreichbar.

**WF1-SET-003 – Daten zurücksetzen (MUSS)**  
Lokale Adressen, Einstellungen, Cache und Push-Abonnements können verständlich gelöscht werden.

**WF1-SET-004 – Hilfe (MUSS)**  
Kompakte Hilfe erklärt Adresse, Datenstand, Kalenderabonnement, Offline-Verhalten und Benachrichtigungen.

## 7. Phase 2 – Fachliche Anforderungen

### 7.1 WF2-CAS – Gemeinsames Vorgangsmodell

**WF2-CAS-001 – Vorgangsreferenz (HIGH, MUSS)**  
Jeder erfolgreich eingereichte Vorgang erhält eine eindeutige, nicht erratbare öffentliche Referenz.

**WF2-CAS-002 – Gastzugriff (HIGH, MUSS)**  
Ein Vorgang kann ohne dauerhaftes Konto über einen zeitlich und fachlich begrenzten Zugriff verfolgt werden, wenn der Mandant dies zulässt.

**WF2-CAS-003 – Servicekonto (CONDITIONAL)**  
OIDC-Anmeldung kann Vorgänge einem Benutzerkonto zuordnen. Informationsfunktionen bleiben ohne Konto verfügbar.

**WF2-CAS-004 – Statushistorie (HIGH, MUSS)**  
Statusänderungen besitzen Zeitpunkt, öffentlichen Statustext, Quelle und optionalen nächsten Schritt.

**WF2-CAS-005 – Nachrichten und Dokumente (HIGH, MUSS)**  
Rückfragen, Antworten und freigegebene Dokumente können am Vorgang angezeigt werden.

**WF2-CAS-006 – Datenschutz und Löschung (MUSS)**  
Aufbewahrung, Sperrung, Löschung und Anonymisierung folgen Vorgangsart, Mandant und Rechtsgrundlage.

### 7.2 WF2-MGL – Mängel und Reklamationen

**WF2-MGL-001 – Vorgangstyp (HIGH, MUSS)**  
Mindestens folgende Kategorien sind konfigurierbar:

- nicht geleerte Tonne,
- beschädigter Behälter,
- illegal abgelagerter Abfall,
- verschmutzter Standort,
- Problem an einem Depotcontainer,
- sonstige Reklamation.

**WF2-MGL-002 – Datenerfassung (HIGH, MUSS)**  
Kategorie, Adresse oder Kartenpunkt, Beschreibung, Zeitpunkt, Kontaktoption und Zustimmung werden erfasst.

**WF2-MGL-003 – Fotoanhang (HIGH, MUSS)**  
Fotos können hochgeladen, vorab angezeigt und entfernt werden.

Akzeptanzkriterien:

- erlaubte Typen, Anzahl und Dateigröße sind konfigurierbar,
- serverseitige Prüfung und Schadcodekontrolle,
- EXIF- und unnötige Metadaten werden entfernt,
- keine öffentliche direkte Objekt-URL,
- Upload kann verständlich wiederholt werden,
- Alternativweg ohne Foto bleibt möglich, sofern fachlich zulässig.

**WF2-MGL-004 – Zuständigkeit (HIGH, MUSS)**  
Kategorie, Gebiet, Standort und Mandant bestimmen den Zielprozess. Unklare Fälle gelangen in eine definierte Eingangsstelle.

**WF2-MGL-005 – Zusammenfassung und Einwilligung (MUSS)**  
Vor Absenden sehen Nutzende eine vollständige Zusammenfassung und können Angaben ändern.

**WF2-MGL-006 – Status und Rückmeldung (HIGH, MUSS)**  
Empfangen, in Prüfung, Rückfrage, in Bearbeitung, erledigt, abgelehnt und geschlossen werden unterstützt.

### 7.3 WF2-SPM – Sperrmüll

**WF2-SPM-001 – Gegenstände und Mengen (HIGH, MUSS)**  
Konfigurierbare Kategorien, Einzelmengen, Gesamtgrenzen und ausgeschlossene Gegenstände.

**WF2-SPM-002 – Adresse und Berechtigung (HIGH, MUSS)**  
Adresse wird gegen Liefergebiet, Sperrfristen, Kontingent und Mandantenregeln geprüft.

**WF2-SPM-003 – Freie Termine (HIGH, MUSS)**  
Freie Slots werden mit Datum, Zeitraum, Kapazität und gegebenenfalls Preis angezeigt.

**WF2-SPM-004 – Slotreservierung (HIGH, MUSS)**  
Ein Slot kann für eine kurze, konfigurierte Zeit gehalten werden. Ablauf und Freigabe sind sichtbar und idempotent.

**WF2-SPM-005 – Bereitstellungshinweise (MUSS)**  
Regeln werden vor Bestätigung verständlich gezeigt und in der Auftragsbestätigung wiederholt.

**WF2-SPM-006 – Auftrag und Bestätigung (HIGH, MUSS)**  
Nach erfolgreicher Übernahme entstehen Vorgangsnummer, Termin, Zusammenfassung und Bestätigung.

**WF2-SPM-007 – Storno/Änderung (HIGH, MUSS)**  
Storno oder zulässige Änderung folgt konfigurierbaren Fristen. Das Fachverfahren bleibt führend.

**WF2-SPM-008 – Zahlung (CONDITIONAL)**  
Wenn der Mandant Gebühren erhebt, wird eine externe Zahlungssitzung gestartet. Regio IT speichert keine Karten- oder Kontodaten.

### 7.4 WF2-BEH – Behälterservice

**WF2-BEH-001 – Servicearten (HIGH, MUSS)**  
Anmeldung, Abmeldung, Größenänderung, Tausch, Reparatur und Zusatzleerung sind konfigurierbar.

**WF2-BEH-002 – Behälterbezug (HIGH, MUSS)**  
Vorhandene Behälter können nach sicherer Prüfung ausgewählt werden. Interne IDs werden nicht ungeschützt offengelegt.

**WF2-BEH-003 – Fachliche Regeln (HIGH, MUSS)**  
Zulässige Größen, Anzahl, Gebühren, Fristen und Eigentümer-/Mieterregeln werden zentral validiert.

**WF2-BEH-004 – Nachweise (CONDITIONAL)**  
Mandantenspezifische Dokumente können sicher hochgeladen werden.

**WF2-BEH-005 – Bestätigung und Status (HIGH, MUSS)**  
Vorgangsnummer, erwarteter Ablauf, Status und Rückfragen stehen bereit.

### 7.5 WF2-MYC – Meine Vorgänge

**WF2-MYC-001 – Vorgangsliste (HIGH, MUSS)**  
Aktive und abgeschlossene Vorgänge werden nach Datum, Art und Status angezeigt.

**WF2-MYC-002 – Vorgangsdetail (HIGH, MUSS)**  
Enthält Referenz, Zusammenfassung, Statushistorie, Termin, Gebühren, Dokumente, Nachrichten und erlaubte Aktionen.

**WF2-MYC-003 – Gastvorgang hinzufügen (HIGH, MUSS)**  
Ein Gastvorgang kann nach geeigneter Verifikation in eine Liste übernommen oder mit einem Servicekonto verknüpft werden.

**WF2-MYC-004 – Rückfrage beantworten (HIGH, MUSS)**  
Nutzende können angeforderte Informationen oder Dokumente nachreichen. Jede Übermittlung ist idempotent und nachvollziehbar.

**WF2-MYC-005 – Benachrichtigung (SOLL)**  
Statusänderungen können per E-Mail oder Web Push angekündigt werden. Sensible Inhalte stehen nicht in der Nachricht selbst.

### 7.6 WF2-PAY – Zahlung

**WF2-PAY-001 – Provideradapter (CONDITIONAL)**  
Der Zahlungsanbieter ist austauschbar. Anbieter- und Mandantenlogik wird nicht in UI-Komponenten verteilt.

**WF2-PAY-002 – Zahlungsstatus (CONDITIONAL)**  
Initialisiert, ausstehend, erfolgreich, fehlgeschlagen, abgebrochen, erstattet.

**WF2-PAY-003 – Webhook (CONDITIONAL)**  
Provider-Rückmeldungen werden signaturgeprüft, idempotent verarbeitet und mit dem Vorgang korreliert.

**WF2-PAY-004 – Fehlerfall (CONDITIONAL)**  
Ein Browserabbruch darf nicht zu Doppelzahlung oder verlorenem Auftrag führen. Der Backendstatus ist führend.

### 7.7 WF2-INT – Fachverfahren und Orchestrierung

**WF2-INT-001 – Adaptergrenze (HIGH, MUSS)**  
Web und öffentliche API greifen nie direkt auf SAP, Tourenplanung oder mandantenspezifische Fachschnittstellen zu.

**WF2-INT-002 – Outbox und Wiederholung (HIGH, MUSS)**  
Schreibende Vorgänge werden lokal belastbar erfasst und über eine transaktionale Outbox an Fremdsysteme übertragen.

**WF2-INT-003 – Idempotenz (HIGH, MUSS)**  
Wiederholte Requests, Queue-Nachrichten und Webhooks erzeugen keinen zweiten Auftrag.

**WF2-INT-004 – Statusmapping (HIGH, MUSS)**  
Interne Fremdsystemstatus werden in wenige verständliche öffentliche Status übersetzt.

**WF2-INT-005 – Technischer Fehler (MUSS)**  
Technische Wiederholungen, Dead-Letter-Fälle und manuelle Klärung sind monitorbar. Nutzende erhalten keinen falschen Erfolgsstatus.

## 8. Verbindliche Nutzerwege

### 8.1 Phase 1 – Erste Nutzung

1. Webanwendung über Mandantenlink öffnen.
2. Nutzen und Datenschutz knapp verstehen.
3. Adresse suchen und auswählen.
4. Startseite zeigt nächsten Termin und aktuelle Hinweise.
5. Kalender, ABC und Standorte sind direkt erreichbar.
6. Adresse wird lokal gespeichert, wenn zugestimmt.

Abnahme:

- ohne Konto möglich,
- unter 360 px und bei 200 % Zoom bedienbar,
- Tastatur- und Screenreader-Reihenfolge folgt sichtbarer Logik,
- Ablehnung von Standort oder Benachrichtigung blockiert nichts.

### 8.2 Phase 1 – Nächsten Termin prüfen

1. Startseite öffnen.
2. Nächste Abholung erkennen.
3. Änderung oder Ausfall verstehen.
4. Alle Termine öffnen.
5. Adresse oder Filter wechseln.

Abnahme:

- Cache-Daten erscheinen ohne leeren Zwischenzustand,
- Kalender und Startseite zeigen denselben fachlichen Status,
- Farbe ist nie alleiniger Informationsträger.

### 8.3 Phase 2 – Mangel melden

1. Kategorie wählen.
2. Adresse oder Kartenpunkt bestätigen.
3. Beschreibung und optional Foto hinzufügen.
4. Kontakt- und Datenschutzoption wählen.
5. Zusammenfassung prüfen.
6. Absenden.
7. Vorgangsnummer und nächsten Schritt erhalten.
8. Status später wieder öffnen.

Abnahme:

- kein Datenverlust bei validierbarem Fehler,
- Uploadfehler kann wiederholt werden,
- mehrfaches Absenden erzeugt nur einen Vorgang,
- Zuständigkeit und Übergabe sind nachvollziehbar.

### 8.4 Phase 2 – Sperrmüll buchen

1. Adresse bestätigen.
2. Gegenstände und Mengen erfassen.
3. fachliche Prüfung erhalten.
4. freien Termin auswählen.
5. Bereitstellungshinweise bestätigen.
6. gegebenenfalls extern bezahlen.
7. Auftrag bestätigen.
8. Termin und Vorgang verfolgen.

Abnahme:

- Slotablauf wird verständlich behandelt,
- Doppelbuchung wird verhindert,
- Zahlungsstatus wird serverseitig bestätigt,
- Touren-/Fachverfahren erhält genau einen Auftrag.

### 8.5 Phase 2 – Behälterservice

1. Serviceart und Behälter wählen.
2. gewünschte Änderung erfassen.
3. Regeln und mögliche Gebühren sehen.
4. Zusammenfassung bestätigen.
5. Vorgang erhalten und verfolgen.

### 8.6 Phase 2 – Rückfrage beantworten

1. Statushinweis erhalten.
2. Vorgangsdetail sicher öffnen.
3. Rückfrage lesen.
4. Antwort oder Dokument senden.
5. Eingang bestätigt bekommen.

## 9. Empfohlenes Technik-Setup

### 9.1 Architekturentscheidung

Empfohlen wird:

- **Web:** Next.js mit App Router, React und TypeScript,
- **Styling:** CSS Custom Properties als Design-Token-Quelle; Tailwind CSS darf als Build-Werkzeug verwendet werden, aber keine fachlichen Werte hart codieren,
- **UI:** semantisches HTML und native Controls zuerst; zugängliche Headless-Primitives nur gezielt,
- **BFF/API:** Kotlin mit Spring Boot als eigenständiger Service,
- **Verträge:** OpenAPI 3.1.x als pragmatischer Tooling-Baseline; Upgrade auf 3.2 nur nach ADR und Toolprüfung,
- **Datenbank:** PostgreSQL für Vorgänge, Status, Idempotenz, Outbox und Konfiguration,
- **Cache/Rate Limit:** Redis nur bei nachgewiesenem Bedarf,
- **Dateien:** S3-kompatibler Objektspeicher mit Malwareprüfung und zeitlich begrenzten URLs,
- **Identität:** OpenID Connect über vorhandenen oder austauschbaren Identity Provider,
- **Beobachtbarkeit:** OpenTelemetry mit Regio-IT-kompatiblem Metrics-, Log- und Trace-Backend,
- **Tests:** Vitest oder gleichwertig für TypeScript-Unit-Tests, JUnit für Kotlin, Playwright für Browser- und Accessibility-Tests,
- **Deployment:** OCI-Container hinter Reverse Proxy/WAF; Kubernetes/OpenShift oder vorhandene Regio-IT-Plattform.

### 9.2 Warum Web eigenständig bleibt

Die Weboberfläche wird nicht aus mobilen UI-Komponenten erzeugt. Sie benötigt:

- serverseitig renderbare Inhalte,
- semantisches HTML,
- Tastatur- und Screenreader-Optimierung,
- URL-basierte Navigation und Deep Links,
- responsive Desktop-, Tablet- und Mobilmuster,
- datenschutzfreundliche Web-Deployment- und Cachekontrolle.

Spätere Apps verwenden dieselben APIs und Fachregeln. Für Android und iOS bleibt Kotlin Multiplatform mit nativen Oberflächen die bevorzugte Anschlussarchitektur.

### 9.3 Logische Komponenten

```text
Browser / installierte PWA
        │
        ▼
Reverse Proxy / WAF / Rate Limit
        │
        ├── Next.js Web
        │      ├── Server Components / SSR
        │      ├── Client Components nur für Interaktion
        │      ├── Designsystem
        │      └── generierter API-Client
        │
        ▼
Kotlin API/BFF
        ├── Tenant und Konfiguration
        ├── Information Core
        ├── Case/Workflow Core
        ├── Idempotenz und Outbox
        ├── Auth/Consent
        └── Adapter
               ├── Bestands-APIs
               ├── SAP/Fachverfahren
               ├── Tourenplanung
               ├── Kartenanbieter
               ├── Identity Provider
               ├── Payment Provider
               └── Object Storage / Malware Scan
```

### 9.4 Rendering- und Datenregeln

- Server Components sind Standard für lesende Seiten.
- Client Components werden nur für lokale Interaktion, Browser-APIs oder stark interaktive Formulare verwendet.
- Datenänderungen laufen über dokumentierte API-Endpunkte; keine versteckte Geschäftslogik ausschließlich in Server Actions.
- Der BFF ist fachliche und sicherheitstechnische Grenze zu Bestandssystemen.
- Öffentliche HTML-Seiten erhalten nachvollziehbare Cache-Header.
- Adress- und Vorgangsdaten werden niemals öffentlich oder mandantenübergreifend gecacht.
- Deploymentartefakte sind reproduzierbar und in allen Umgebungen identisch; Konfiguration kommt zur Laufzeit.

### 9.5 Repository-Struktur

```text
/
├── AGENTS.md
├── CLAUDE.md
├── README.md
├── pnpm-workspace.yaml
├── package.json
├── settings.gradle.kts
├── apps/
│   └── web/
│       ├── app/
│       ├── components/
│       ├── features/
│       ├── lib/
│       ├── public/
│       └── tests/
├── services/
│   └── api/
│       ├── src/main/kotlin/
│       ├── src/main/resources/
│       └── src/test/kotlin/
├── packages/
│   ├── design-tokens/
│   ├── ui/
│   ├── api-client/
│   ├── test-fixtures/
│   └── eslint-config/
├── contracts/
│   ├── openapi/
│   ├── examples/
│   └── schemas/
├── docs/
│   ├── agent-contract.md
│   ├── adr/
│   ├── architecture/
│   ├── product/
│   ├── security/
│   ├── accessibility/
│   ├── testing/
│   └── operations/
├── infra/
│   ├── containers/
│   ├── deployment/
│   └── observability/
└── tooling/
    ├── ci/
    ├── scripts/
    └── quality/
```

### 9.6 Zukunftsfähigkeit für Apps

- Keine UI-Komponente ist API-Vertrag.
- Jeder öffentliche Vertrag besitzt Beispiele und Fehlerfälle.
- Design Tokens werden als JSON gepflegt und für Web, später Android und iOS generiert.
- Statusmaschinen und Validierungsregeln werden im Backend kanonisch umgesetzt.
- Deep Links besitzen stabile fachliche IDs.
- Push-Abonnements sind kanalneutral modelliert.
- Authentifizierung verwendet OIDC und keine webexklusive proprietäre Sitzung als alleinige Identität.
- Anhänge und Zahlungen werden über API-Adapter abstrahiert.

## 10. API- und Datenverträge

### 10.1 API-Grundsätze

- Contract first: OpenAPI wird vor oder gemeinsam mit der Implementierung geändert.
- Versionierung über `/v1` oder eine gleichwertig dokumentierte Strategie.
- UTC-Zeitstempel im Transport; Anzeige in Mandantenzeitzone.
- `application/problem+json` für strukturierte Fehler.
- `Idempotency-Key` für jeden schreibenden Vorgang.
- Korrelations-ID für Request, Queue, Adapter und Fremdsystem.
- Pagination und Filter für wachsende Listen.
- ETags oder Versionen für lesende Synchronisation.
- Optimistische Sperre für statusrelevante Änderungen.
- Kein interner SAP- oder Datenbankschlüssel wird ohne fachliche Abstraktion exponiert.

### 10.2 Phase-1-Endpunkte

| Methode | Endpunkt | Zweck |
|---|---|---|
| GET | `/v1/tenants/{tenantKey}/config` | Branding, Module und Regeln |
| GET | `/v1/addresses/search` | Adresssuche |
| GET | `/v1/addresses/{id}/collections` | Abfuhrtermine |
| GET | `/v1/waste-guide` | ABC-Daten oder Delta |
| GET | `/v1/waste-guide/search` | serverseitiger Suchfallback |
| GET | `/v1/sites` | Standorte und Filter |
| GET | `/v1/sites/{id}` | Standortdetail |
| GET | `/v1/notices` | aktive Meldungen |
| GET | `/v1/calendars/{addressId}.ics` | Kalenderabonnement |
| PUT | `/v1/notification-subscriptions/{id}` | Web-Push-Abonnement |
| DELETE | `/v1/notification-subscriptions/{id}` | Abonnement entfernen |
| GET | `/v1/health/ready` | Betriebsbereitschaft |

### 10.3 Phase-2-Endpunkte

| Methode | Endpunkt | Zweck |
|---|---|---|
| POST | `/v1/cases/defects` | Mangel/Reklamation einreichen |
| POST | `/v1/uploads` | sicheren Upload initialisieren |
| POST | `/v1/uploads/{id}/complete` | Upload abschließen |
| GET | `/v1/bulk-waste/rules` | Kategorien, Mengen und Regeln |
| GET | `/v1/bulk-waste/slots` | freie Termine |
| POST | `/v1/bulk-waste/slot-holds` | Slot zeitlich halten |
| POST | `/v1/bulk-waste/orders` | Sperrmüllauftrag |
| PATCH | `/v1/bulk-waste/orders/{id}` | zulässige Änderung/Storno |
| GET | `/v1/container-service/options` | Behälter und Servicearten |
| POST | `/v1/container-service/orders` | Behältervorgang |
| GET | `/v1/cases` | Vorgangsliste |
| GET | `/v1/cases/{reference}` | Vorgangsdetail |
| POST | `/v1/cases/{reference}/messages` | Rückfrage beantworten |
| POST | `/v1/cases/{reference}/claim` | Gastvorgang verknüpfen |
| POST | `/v1/payments/sessions` | externe Zahlung starten |
| POST | `/v1/webhooks/payments/{provider}` | Zahlungsrückmeldung |

Die endgültigen Pfade werden mit dem Bestand abgeglichen. Die fachlichen Operationen und Semantik bleiben verbindlich.

### 10.4 Kanonische Datenobjekte

**TenantConfig**

- tenantId
- name, shortName
- branding
- timezone, locales
- enabledFeatures
- legalLinks, supportContacts
- wasteTypeConfiguration
- notificationDefaults
- mapConfiguration
- contentVersion

**Address**

- addressId
- street, houseNumber, postalCode, city, district
- displayLabel
- serviceAreaId

**CollectionEvent**

- eventId, addressId, wasteTypeId
- plannedDate, effectiveDate
- status: planned, moved, cancelled, additional
- originalEventId
- noticeId
- lastModified

**Case**

- caseId
- publicReference
- tenantId
- caseType
- subject
- publicStatus
- internalStatus
- createdAt, updatedAt
- contactChannel
- authenticatedSubject oder guestAccessId
- relatedAddressId
- externalReferences
- retentionClass

**CaseEvent**

- eventId, caseId
- eventType
- publicLabel
- occurredAt
- actorType
- correlationId
- payloadReference

**Attachment**

- attachmentId
- caseId
- fileName, mediaType, size
- scanStatus
- storageKey
- metadataRemoved
- createdAt

**BulkWasteOrder**

- caseId
- addressId
- items
- slotId, slotHoldExpiresAt
- fee
- paymentStatus
- collectionStatus
- preparationInstructionsVersion

**ContainerServiceOrder**

- caseId
- addressId
- serviceType
- containerReference
- requestedConfiguration
- fee
- serviceStatus

### 10.5 Statusmaschinen

**Allgemeiner Vorgang**

```text
DRAFT
  → SUBMITTED
  → RECEIVED
  → IN_REVIEW
  → ACTION_REQUIRED ↔ IN_REVIEW
  → IN_PROGRESS
  → RESOLVED
  → CLOSED

Alternative Endzustände: REJECTED, CANCELLED
```

**Sperrmüll**

```text
DRAFT
  → SLOT_HELD
  → SUBMITTED
  → PAYMENT_PENDING (nur falls erforderlich)
  → CONFIRMED
  → SCHEDULED
  → COLLECTED
  → CLOSED

Alternative Zustände: HOLD_EXPIRED, PAYMENT_FAILED, CANCELLED, REJECTED
```

Öffentliche Status werden von internen Status getrennt. Nutzende sehen nur verständliche, freigegebene Aussagen.

## 11. Authentifizierung, Datenschutz und Sicherheit

### 11.1 Zugangsmodelle

**Anonym/lokal:**

- Termine,
- Kalender,
- Abfall-ABC,
- Standorte,
- Meldungen,
- lokal gespeicherte Adressen.

**Gastvorgang:**

- Vorgang einreichen,
- Referenz plus sicherer Besitznachweis,
- zeitlich und fachlich begrenzter Zugriff,
- keine Auflistung fremder Vorgänge.

**Servicekonto/OIDC:**

- mehrere Vorgänge zusammenführen,
- Statusliste,
- Dokumente und Nachrichten,
- kein eigenes Passwortsystem in der Abfall APP.

### 11.2 Sicherheitsniveau

- OWASP ASVS 5.0 als Prüfbasis; konkretes Zielniveau wird im Threat Model festgelegt.
- TLS für alle externen Verbindungen.
- Secure, HttpOnly und angemessenes SameSite für Cookies.
- CSRF-Schutz für sitzungsbasierte Änderungen.
- Content Security Policy und restriktive Security Header.
- serverseitige Autorisierung je Mandant, Vorgang und Aktion.
- Rate Limits für Suche, Upload, Gastzugriff, Login und schreibende Operationen.
- Secret Scan, Abhängigkeitsscan, statische Analyse und Container-Scan in CI.
- keine Geheimnisse im Repository, Browserbundle oder Buildlog.
- sichere Defaultkonfiguration; Debugfunktionen sind in Produktion deaktiviert.
- regelmäßiger Penetrationstest vor Phase-2-Pilot.

### 11.3 Dateisicherheit

- Direkter Upload nur über kurzlebige, zweckgebundene Berechtigung.
- Dateityp wird anhand Inhalt und Signatur geprüft.
- Dateigröße und Anzahl sind begrenzt.
- Malwareprüfung vor fachlicher Weitergabe.
- EXIF und nicht benötigte Metadaten werden entfernt.
- Dateien werden nicht unter erratbaren öffentlichen URLs ausgeliefert.
- Aufbewahrung und Löschung folgen dem zugehörigen Vorgang.

### 11.4 Datenschutz

- Datensparsamkeit und Zweckbindung sind Standard.
- Vollständige Adressen, Suchtexte, Fotos und Vorgangsinhalte erscheinen nicht in normalen Logs.
- Browseranalyse und Fachvorgangsdaten werden strikt getrennt.
- Einwilligung wird nur verwendet, wenn sie rechtlich tatsächlich die passende Grundlage ist.
- Datenschutzinformation nennt Datenarten, Zweck, Empfänger, Speicherfristen und Betroffenenrechte.
- Mandantenwechsel und Logout löschen oder trennen schutzbedürftige Browserdaten.
- Gastzugriffe laufen ab und können widerrufen werden.
- Lösch- und Auskunftsprozesse werden technisch unterstützt.

## 12. Barrierefreiheit, Kompatibilität und Performance

### 12.1 Barrierefreiheit

Technisches Ziel ist WCAG 2.2 AA, ergänzt um BITV 2.0, EN 301 549 und die Anforderungen des konkreten öffentlichen Auftraggebers.

MUSS-Kriterien:

- vollständige Tastaturbedienung,
- sichtbarer, nicht verdeckter Fokus,
- semantische Überschriften und Landmarken,
- verständliche Labels und Hilfetexte,
- Fehlermeldungen sind programmatisch zugeordnet,
- Statusmeldungen werden assistiven Technologien mitgeteilt,
- 200 % Zoom ohne Funktionsverlust,
- Textabstände können verändert werden,
- Kontrast und Nicht-Farb-Kodierung,
- Alternativtexte für fachliche Bilder,
- Drag-and-drop besitzt eine gleichwertige Alternative,
- zugängliche Authentifizierung,
- keine Zeitbegrenzung ohne Warnung und Verlängerung, außer fachlich zwingend,
- vollständige Prozesse werden getestet, nicht nur einzelne Seiten.

Vor jedem Pilot findet ein Test mit Menschen statt, die Assistenztechnologien nutzen.

### 12.2 Browsermatrix

Unterstützt werden die zum Projektstart aktuellen und vorherigen Hauptversionen von:

- Chrome,
- Edge,
- Firefox,
- Safari.

Zusätzlich:

- iOS Safari in den unterstützten iOS-Versionen,
- Android Chrome auf kleinem Mittelklassegerät,
- Windows High Contrast Mode,
- reduzierte Bewegung,
- vergrößerte Schrift und 200 % Browserzoom.

Die konkrete Matrix wird im Repository versioniert.

### 12.3 Performancebudgets

- Serverantwort für kritische HTML-Seiten: Ziel p75 unter 800 ms in der Pilotumgebung, Fremdsystemzeiten separat.
- Largest Contentful Paint: Ziel p75 unter 2,5 s für Startseite auf definierter mobiler Referenz.
- Interaction to Next Paint: Ziel p75 unter 200 ms.
- Cumulative Layout Shift: Ziel unter 0,1.
- JavaScript für die initiale Startseite wird budgetiert; neue Client-Abhängigkeiten benötigen Begründung.
- vorhandene Cache-Daten werden innerhalb von 500 ms sichtbar.
- ABC-Suche liefert lokal oder serverseitig erste Ergebnisse innerhalb von 300 ms für Pilotdaten.
- Bilder werden größen- und formatgerecht ausgeliefert.

### 12.4 PWA-Grenzen

- Browserunterstützung wird als progressive Verbesserung behandelt.
- Kein kritischer Vorgang darf nur über Web Push erreichbar sein.
- Offline-Schreibvorgänge werden in Phase 2 nicht automatisch im Hintergrund abgesendet, sofern Konflikt-, Datenschutz- und Doppelverarbeitungsrisiken nicht nachweislich gelöst sind.
- Entwürfe können lokal verschlüsselt oder sitzungsbezogen zwischengespeichert werden, wenn dies fachlich und rechtlich freigegeben ist.

## 13. Test- und Qualitätskonzept

### 13.1 Testpyramide

1. TypeScript- und Kotlin-Unit-Tests für Fachregeln und Mapper.
2. Komponententests für UI-Zustände, Formulare und zugängliche Namen.
3. Vertragstests für OpenAPI, Beispiele, Clients und Adapter.
4. Integrationstests mit PostgreSQL, Queue/Outbox und Testdoubles.
5. Playwright-Tests für kritische Browserwege.
6. visuelle Regressionstests für repräsentative Viewports und Zustände.
7. automatisierte Accessibility-Scans plus manuelle Prüfung.
8. End-to-End-Tests gegen Pilot-/Abnahmeumgebung.
9. Security-, Last-, Resilienz- und Wiederherstellungstests.

### 13.2 Kritische automatisierte Szenarien Phase 1

- Mandant und Konfiguration laden.
- gültige und ungültige Adresse suchen.
- nächsten Termin aus mehreren Ereignissen bestimmen.
- Verschiebung, Ausfall und Zusatztermin darstellen.
- Cache zuerst anzeigen und anschließend aktualisieren.
- Offline-Neustart mit vorhandenem und leerem Cache.
- ABC mit Synonym und Tippfehler durchsuchen.
- Standort nach Abfallart und Öffnungsstatus filtern.
- Mandantenwechsel ohne Datenvermischung.
- 320 px, 200 % Zoom, Tastatur und Screenreader-Kernweg.

### 13.3 Kritische automatisierte Szenarien Phase 2

- Mangel mit und ohne Foto einreichen.
- ungültige oder schädliche Datei abweisen.
- doppeltes Absenden erzeugt nur einen Vorgang.
- Zuständigkeitsregel und Fallback-Eingang.
- Sperrmüllslot halten, ablaufen lassen und bestätigen.
- parallele Slotbuchung verhindert Überbuchung.
- Zahlung erfolgreich, fehlgeschlagen, abgebrochen und verspätet bestätigt.
- Behälterregel akzeptiert und verweigert unzulässige Kombination.
- Outbox wiederholt ohne Doppelauftrag.
- Fremdsystemausfall erzeugt korrekten Zwischenstatus.
- Gastzugriff abgelaufen oder widerrufen.
- Zugriff auf fremden Mandanten oder Vorgang wird verweigert.
- Rückfrage mit idempotentem Dokumentnachtrag.

### 13.4 CI-Qualitätsgates

Ein Pull Request darf nur zusammengeführt werden, wenn:

- Formatierung, Lint und Typecheck erfolgreich sind,
- Unit-, Komponenten- und Vertragstests erfolgreich sind,
- OpenAPI-Dokument und generierter Client konsistent sind,
- betroffene Playwright-Tests erfolgreich sind,
- keine neuen kritischen oder hohen Sicherheitsfunde bestehen,
- kein Geheimnis erkannt wurde,
- Lizenzregeln eingehalten sind,
- betroffene Accessibility- und visuelle Tests erfolgreich sind,
- Datenbankmigration vorwärts und rückwärts bewertet ist,
- Dokumentation, ADRs und Changelog aktuell sind,
- Akzeptanzkriterien im Pull Request nachgewiesen sind.

### 13.5 Verbindliche Befehle

Die endgültigen Skriptnamen werden im Repository festgelegt. Mindestens folgende stabile Einstiegspunkte existieren:

```text
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm test:a11y
pnpm test:visual
./gradlew test
./gradlew integrationTest
./gradlew bootJar
```

Lokale und CI-Befehle verwenden dieselben Konfigurationen.

## 14. Betrieb und Deployment

### 14.1 Umgebungen

- lokale Entwicklung,
- gemeinsame Integrationsumgebung,
- Test/Abnahme,
- Pilot,
- Produktion.

Mandanten- und Feature-Konfigurationen sind umgebungsspezifisch und versioniert.

### 14.2 Deployment

- reproduzierbare OCI-Container,
- signierte Artefakte und Software Bill of Materials,
- Reverse Proxy vor Next.js und API,
- getrennte technische Bereitstellung und fachliche Aktivierung,
- Datenbankmigration mit Rollback- oder Forward-Fix-Plan,
- stufenweise Aktivierung über Feature Flags,
- Health-, Readiness- und Liveness-Prüfungen,
- kontrolliertes Herunterfahren laufender Requests und Jobs.

### 14.3 Observability

Metriken:

- Verfügbarkeit und Latenz je Endpunkt,
- Fehler nach Mandant, Modul und Kategorie ohne unnötigen Personenbezug,
- Cachetreffer und Datenalter,
- Sucherfolg ohne Rohsuchtexte,
- Formularabbrüche auf aggregierter Ebene, falls rechtlich zulässig,
- Upload- und Malwareprüfstatus,
- Outboxalter und Wiederholungen,
- Fremdsystemstatus,
- Zahlungs- und Slotfehler,
- Vorgänge ohne erfolgreiche Übergabe,
- Frontendfehler und Core Web Vitals,
- Release- und Konfigurationsversion.

### 14.4 Runbooks

Vor Pilot existieren mindestens:

- Bestands-API nicht verfügbar,
- fehlerhafte Abfuhrdaten,
- Kartenanbieter ausgefallen,
- Web-Push-Ausfall,
- Upload-/Malwaredienst gestört,
- Fachverfahren nicht erreichbar,
- Outboxstau,
- Zahlungsstatus unklar,
- fehlerhafte Mandantenkonfiguration,
- Rollback und Feature-Abschaltung.

## 15. Phase-1-Backlog

### EPIC WF1-E01 – Engineering Foundation

- **WF1-S001** Monorepository und Modulstruktur anlegen.
- **WF1-S002** Next.js-/TypeScript-Grundlage mit App Router einrichten.
- **WF1-S003** Kotlin-/Spring-Boot-API-Grundlage einrichten.
- **WF1-S004** OpenAPI-Validierung und Clientgenerierung einrichten.
- **WF1-S005** Design Tokens und UI-Paket aufbauen.
- **WF1-S006** CI, Security Scans und Qualitätsgates einrichten.
- **WF1-S007** Test-Fixtures und Mockserver bereitstellen.
- **WF1-S008** Observability-Grundlage integrieren.

### EPIC WF1-E02 – Mandant, Shell und Navigation

- **WF1-S010** Mandantenauflösung serverseitig.
- **WF1-S011** Remote-Konfiguration mit Validierung und Cache.
- **WF1-S012** Responsive Header-, Desktop- und Mobilnavigation.
- **WF1-S013** globale Lade-, Leer-, Offline- und Fehlerzustände.
- **WF1-S014** Rechts-, Hilfe- und Supportseiten.
- **WF1-S015** Cookie-, Consent- und Analysegrundlage.

### EPIC WF1-E03 – Adresse und Startseite

- **WF1-S020** Adresssuchvertrag und Adapter.
- **WF1-S021** zugängliche Adresssuche.
- **WF1-S022** lokale Mehrfachadressen und Standardadresse.
- **WF1-S023** Terminaggregation und Statuslogik.
- **WF1-S024** Startseiten-Hero.
- **WF1-S025** Störungsbanner und Schnellaktionen.
- **WF1-S026** Cache-, Aktualitäts- und Offlineanzeige.

### EPIC WF1-E04 – Kalender

- **WF1-S030** Terminlisten- und Filterlogik.
- **WF1-S031** responsive Kalenderansicht.
- **WF1-S032** Verschiebung, Ausfall und Zusatztermin.
- **WF1-S033** Kalenderabonnement.
- **WF1-S034** Einzelterminexport.

### EPIC WF1-E05 – Abfall-ABC

- **WF1-S040** Datenvertrag und Import.
- **WF1-S041** Suchindex, Synonyme und Tippfehler.
- **WF1-S042** Suche, Vorschläge und Tastatursteuerung.
- **WF1-S043** Eintragsdetail und Kein-Treffer-Weg.
- **WF1-S044** Offline-Daten und Delta-Synchronisation.

### EPIC WF1-E06 – Standorte und Meldungen

- **WF1-S050** Standortvertrag und Adapter.
- **WF1-S051** Liste, Filter und Öffnungslogik.
- **WF1-S052** Standortdetail.
- **WF1-S053** Kartenadapter und Fallback.
- **WF1-S054** Meldungsvertrag, Zielgruppen und Gültigkeit.
- **WF1-S055** Banner, Liste, Detail und Deep Links.

### EPIC WF1-E07 – PWA, Qualität und Pilot

- **WF1-S060** Manifest, Icons und Service Worker.
- **WF1-S061** Offline-Shell und versionierter Fachcache.
- **WF1-S062** optionaler Web-Push-Spike.
- **WF1-S063** responsive Browser- und Viewportmatrix.
- **WF1-S064** WCAG-/BITV-Prüfung.
- **WF1-S065** Last-, Performance- und Resilienztest.
- **WF1-S066** Pilotdaten und Parallelvergleich.
- **WF1-S067** Pilotbereitstellung, Support und Rollback.

## 16. Phase-2-Backlog

### EPIC WF2-E01 – Case Foundation

- **WF2-S001** Case-, Event- und Statusmodell.
- **WF2-S002** PostgreSQL-Schema und Migrationen.
- **WF2-S003** Idempotenzspeicher und transaktionale Outbox.
- **WF2-S004** Gastzugriff und sichere Besitzprüfung.
- **WF2-S005** OIDC-Integration hinter Adapter.
- **WF2-S006** Anhänge, Objektspeicher und Malwareprüfung.
- **WF2-S007** Nachrichten- und Dokumentenmodell.
- **WF2-S008** Vorgangsliste und Vorgangsdetail-Grundlage.

### EPIC WF2-E02 – Mängel und Reklamationen

- **WF2-S010** Kategorien- und Zuständigkeitskonfiguration.
- **WF2-S011** mehrstufiges Mängelformular.
- **WF2-S012** Adresse, Karte und Standortbezug.
- **WF2-S013** sicherer Fotoupload.
- **WF2-S014** Zusammenfassung, Datenschutz und Absenden.
- **WF2-S015** Fachverfahrensadapter und Fallback-Eingang.
- **WF2-S016** öffentlicher Status und Rückfragen.

### EPIC WF2-E03 – Sperrmüll

- **WF2-S020** Kategorien-, Mengen- und Regelmodell.
- **WF2-S021** Adress-, Kontingent- und Berechtigungsprüfung.
- **WF2-S022** Slotvertrag und Verfügbarkeitsadapter.
- **WF2-S023** Slot-Hold mit Ablauf.
- **WF2-S024** Sperrmüll-Assistent und Zusammenfassung.
- **WF2-S025** Auftragsübergabe und Bestätigung.
- **WF2-S026** Änderung und Storno.
- **WF2-S027** Touren-/Dispositionsstatus.

### EPIC WF2-E04 – Behälterservice

- **WF2-S030** Servicearten und Behältermodell.
- **WF2-S031** Regel- und Gebührenadapter.
- **WF2-S032** Behälterservice-Assistent.
- **WF2-S033** Nachweisupload.
- **WF2-S034** Fachverfahrensübergabe.
- **WF2-S035** Status, Änderung und Rückfrage.

### EPIC WF2-E05 – Meine Vorgänge

- **WF2-S040** Liste und Filter.
- **WF2-S041** Detail und Statushistorie.
- **WF2-S042** Gastvorgang verknüpfen.
- **WF2-S043** Rückfrage beantworten.
- **WF2-S044** Dokumente sicher anzeigen.
- **WF2-S045** E-Mail-/Web-Push-Hinweise.

### EPIC WF2-E06 – Zahlung

- **WF2-S050** Zahlungsprovider-Schnittstelle.
- **WF2-S051** Zahlungssitzung und Rückleitung.
- **WF2-S052** signierter, idempotenter Webhook.
- **WF2-S053** Fehler-, Abbruch- und Erstattungsstatus.
- **WF2-S054** Beleg- und Vorgangszuordnung.

Dieses Epic ist CONDITIONAL und wird nur aktiviert, wenn mindestens ein Pilotmandant eine Gebühr erhebt.

### EPIC WF2-E07 – Integration und Betrieb

- **WF2-S060** Adapterframework und Statusmapping.
- **WF2-S061** Retry, Circuit Breaker und Dead Letter.
- **WF2-S062** Betriebsdashboard für hängende Vorgänge.
- **WF2-S063** Audit- und Korrelationsnachweis.
- **WF2-S064** Aufbewahrung, Löschung und Anonymisierung.
- **WF2-S065** Security- und Penetrationstest.
- **WF2-S066** End-to-End-Pilot Mangel.
- **WF2-S067** End-to-End-Pilot Sperrmüll oder Behälter.
- **WF2-S068** Betriebsübergabe und Rolloutentscheidung.

## 17. Definition of Ready

Eine Story ist bereit, wenn:

- fachlicher Zweck und Nutzerwert beschrieben sind,
- Phase, Priorität und Plattform feststehen,
- beobachtbare Akzeptanzkriterien vorliegen,
- Design und alle relevanten Zustände vorhanden sind,
- API-/Datenvertrag vorhanden oder Bestandteil der Story ist,
- Mandantenwirkung beschrieben ist,
- Barrierefreiheitsanforderungen beschrieben sind,
- Datenschutz- und Sicherheitsauswirkungen bewertet sind,
- Testdaten und Abhängigkeiten verfügbar sind,
- keine offene Grundsatzentscheidung stillschweigend an Codex oder CC delegiert wird,
- die Story in wenigen Arbeitstagen implementier- und prüfbar ist.

## 18. Definition of Done

Eine Story ist abgeschlossen, wenn:

- alle Akzeptanzkriterien nachgewiesen sind,
- Code Review erfolgt ist,
- Unit-, Komponenten-, Vertrags- und betroffene Browsertests erfolgreich sind,
- Accessibility der Änderung automatisiert und manuell angemessen geprüft ist,
- responsive Zustände geprüft sind,
- Telemetrie, Fehlerbehandlung und Supportwirkung berücksichtigt sind,
- keine neuen kritischen oder hohen Sicherheitsfunde bestehen,
- API-Vertrag, Beispiele und generierter Client aktuell sind,
- Mandanten-, Offline- und Wiederholungsfälle geprüft sind,
- Dokumentation, ADR und Changelog aktualisiert sind,
- Product Owner die Story abgenommen hat.

Ein Epic ist erst abgeschlossen, wenn der vollständige Nutzerweg in der Abnahmeumgebung getestet wurde.

## 19. Umsetzung mit Codex und CC

### 19.1 Gemeinsamer Agentenvertrag

`docs/agent-contract.md` ist die kanonische Quelle. `AGENTS.md` und `CLAUDE.md` verweisen darauf und dürfen keine widersprüchlichen Regeln enthalten.

Der Agentenvertrag MUSS mindestens enthalten:

- Produkt- und Phasenumfang,
- Architekturgrenzen,
- erlaubte und verbotene Abhängigkeiten,
- Build- und Testbefehle,
- Formatierungs- und Qualitätsregeln,
- Contract-first-Vorgehen,
- Barrierefreiheits- und Datenschutzregeln,
- Verbot von Geheimnissen und personenbezogenen Testdaten,
- Pflicht zu ADRs bei Architekturabweichungen,
- Regel, dass Phase-2-Funktionen nur hinter Feature Flags und nicht während Phase 1 scheinbar produktiv aktiviert werden,
- Pflicht zur Zusammenfassung geänderter Dateien, Tests und verbleibender Risiken.

### 19.2 Arbeitsprinzip

Codex und CC arbeiten immer auf kleinen, klar abgegrenzten Story-Paketen:

1. Story, Spezifikation und Akzeptanzkriterien lesen.
2. Agentenvertrag und relevante ADRs lesen.
3. Bestandscode und Tests untersuchen.
4. kurzen Plan nennen.
5. Vertrag oder Schema zuerst anpassen.
6. kleinste vollständige Änderung implementieren.
7. relevante Prüfungen ausführen.
8. Dokumentation aktualisieren.
9. gegen Akzeptanzkriterien prüfen.
10. Ergebnis, Tests und Risiken zusammenfassen.

Ein Auftrag enthält nicht gleichzeitig ein gesamtes Epic, mehrere unverbundene Plattformen und ungelöste Architekturentscheidungen.

### 19.3 Auftragsschablone

```text
Ziel
Implementiere Story <ID> – <Titel>.

Kontext
- Phase:
- Priorität:
- Betroffene Module:
- Relevante Anforderungen:
- Relevante ADRs:
- Relevante OpenAPI-Operationen:
- Feature Flag:

Akzeptanzkriterien
1.
2.
3.

Nicht im Umfang
-

Qualitätsanforderungen
- Tests:
- Barrierefreiheit:
- Responsive Zustände:
- Offline/Retry:
- Mandantenfähigkeit:
- Sicherheit/Datenschutz:
- Monitoring:

Vorgehen
1. Bestand untersuchen.
2. Plan nennen.
3. Vertrag/Schema zuerst ändern.
4. Implementieren.
5. alle relevanten Prüfungen ausführen.
6. Ergebnis, geänderte Dateien, Tests und Risiken zusammenfassen.
```

### 19.4 Schutz vor Fehlentwicklungen

Codex und CC dürfen:

- keine neue Bibliothek ohne Begründung, Lizenz- und Abhängigkeitsprüfung hinzufügen,
- keinen API-Vertrag stillschweigend brechen,
- keine Geschäftsregel ausschließlich in einer UI-Komponente verstecken,
- keine Mandantenwerte hart codieren,
- keine Tests löschen oder abschwächen, nur um einen Build grün zu machen,
- keine personenbezogenen Produktionsdaten als Fixture verwenden,
- keine Autorisierung nur im Browser durchführen,
- keine Phase-2-Funktion ohne Feature Flag aktivieren,
- keine Architekturentscheidung ohne ADR verstecken,
- keine Zahlung als erfolgreich markieren, bevor der serverseitige Providerstatus bestätigt ist,
- keinen schreibenden Vorgang ohne Idempotenz implementieren.

## 20. Abnahme Phase 1

Phase 1 ist abgenommen, wenn:

- alle HIGH-1-Funktionen im vereinbarten Pilotumfang produktiv verfügbar sind,
- neuer Look und Designsystem fachlich freigegeben sind,
- Startseite den nächsten Termin eindeutig priorisiert,
- Adresse, Kalender, ABC, Standorte und Meldungen konsistente Daten zeigen,
- Mandantenkonfiguration ohne Code-Fork funktioniert,
- responsive Browsermatrix bestanden ist,
- PWA- und Offline-Fallback wie spezifiziert funktionieren,
- WCAG-2.2-AA-/BITV-relevante Prüfung keine offenen kritischen oder hohen Mängel zeigt,
- Sicherheits- und Datenschutzfreigaben vorliegen,
- Monitoring, Alarmierung, Runbooks und Support aktiv sind,
- Datenvergleich mit Pilotquelle erfolgreich ist,
- Rollback und Featureabschaltung getestet sind,
- keine blockierenden oder kritischen Fehler offen sind.

## 21. Abnahme Phase 2

Phase 2 ist abgenommen, wenn:

- mindestens Mängel/Reklamationen und ein weiterer HIGH-2-Dienst vollständig produktiv sind,
- jeder eingereichte Vorgang eine sichere Referenz und nachvollziehbaren Status besitzt,
- Gastzugriff und optionales Servicekonto fachlich und sicher funktionieren,
- Fotos und Dokumente sicher geprüft und gespeichert werden,
- Idempotenz und Outbox Doppelvorgänge verhindern,
- Fachverfahren genau einen Auftrag erhalten und Status zurückliefern,
- Sperrmüllslots nicht überbucht werden,
- Zahlungsfälle bei aktivierter Zahlung vollständig getestet sind,
- Rückfragen und Dokumentnachträge nachvollziehbar funktionieren,
- Aufbewahrung, Löschung und Anonymisierung umgesetzt sind,
- Last-, Resilienz-, Wiederherstellungs- und Penetrationstests bestanden sind,
- Barrierefreiheit für vollständige Phase-2-Prozesse geprüft ist,
- Betrieb hängende oder fehlerhafte Vorgänge erkennen und bearbeiten kann,
- Pilotmessung und Rolloutentscheidung dokumentiert sind,
- keine blockierenden oder kritischen Fehler offen sind.

## 22. Risiken und Gegenmaßnahmen

| Risiko | Auswirkung | Gegenmaßnahme |
|---|---|---|
| widersprüchliche Abfuhrdaten | falsche Termine, Vertrauensverlust | Datenprofiling, Qualitätsregeln, Quellenverantwortung |
| unklare Bestandsarchitektur | Doppelentwicklung | Audit, ADR-Gates, technischer Durchstich |
| zu viele Mandantenwünsche | Scope- und Kostenanstieg | Produktgremium, Feature Flags, keine ungeprüften Forks |
| Web wird als App-Kopie entworfen | schlechte Desktop- und Accessibility-UX | Web-spezifische IA, SSR, semantisches HTML, Nutzertests |
| Kartenanbieter fällt aus | Standortfunktion unbrauchbar | austauschbarer Adapter und vollständige Liste |
| PWA-/Push-Unterschiede | inkonsistente Erwartungen | progressive Verbesserung, Kalender/E-Mail-Fallback |
| Fachverfahren ohne stabile Schreib-API | Phase-2-Verzögerung | frühe Spikes, Adapter, Outbox, Testsystem |
| Doppelverarbeitung | doppelte Aufträge oder Gebühren | Idempotency Key, eindeutige Constraints, Outbox |
| Foto-/Uploadrisiken | Datenschutz oder Schadcode | Metadatenentfernung, Scan, Limits, sichere URLs |
| Zahlung unklar | falscher Vorgangsstatus | Provideradapter, signierte Webhooks, Backendstatus führend |
| Barrierefreiheit spät geprüft | teure Nacharbeit | Designkriterien, CI, manuelle Tests, inklusive Nutzertests |
| Coding-Agenten erzeugen Varianten | Wartungsaufwand | kleine Stories, Agentenvertrag, ADRs, Reviews und Gates |

## 23. Offene Entscheidungen vor Implementierungsstart

1. Welche Repositories, Buildprozesse und Webkomponenten existieren?
2. Welche Datenquelle ist je Mandant für Termine, Standorte und Abfall-ABC führend?
3. Welche Pilotkommune stellt welche Daten und Ansprechpartner bereit?
4. Welche Hostingplattform, Registry, Secrets- und Observability-Dienste sind verbindlich?
5. Ist Kotlin/Spring Boot mit den Regio-IT-Betriebsstandards kompatibel?
6. Welcher Kartenanbieter erfüllt Lizenz-, Datenschutz-, Barrierefreiheits- und Betriebsanforderungen?
7. Welche Browser- und Gerätematrix gilt verbindlich?
8. Wird Web Push in Phase 1 benötigt oder genügt Kalenderabonnement?
9. Welche Redaktions- oder Administrationsoberfläche liefert Konfiguration und Meldungen?
10. Welche Fachverfahren/SAP-Module nehmen Mängel, Sperrmüll und Behälterservice entgegen?
11. Welche Status können die Fachverfahren zuverlässig zurückliefern?
12. Welche Vorgangsarten sind im ersten Phase-2-Pilot verbindlich?
13. Welcher Identity Provider bzw. welches Servicekonto wird über OIDC angebunden?
14. Welche Gastverifikation ist fachlich und rechtlich zulässig?
15. Welcher Zahlungsanbieter und welche Gebührenfälle sind relevant?
16. Welche Aufbewahrungs- und Löschfristen gelten je Vorgangsart?
17. Welche Dateitypen, Größen und Malwareprüfungen sind zugelassen?
18. Welche SLA-, Support- und Eskalationszeiten gelten?
19. Welche Analysefunktionen sind erforderlich und rechtlich zulässig?
20. Welche bestehenden App-Verträge müssen für die spätere mobile Umsetzung erhalten bleiben?

## 24. Quellen und normative Referenzen

- Regio IT, Budget-Pitch „Abfall neu gedacht“, Juli 2026.
- Regio IT, Spezifikation Phase 0 und Phase 1, Juli 2026.
- Next.js, App Router: https://nextjs.org/docs/app
- Next.js, Production Checklist: https://nextjs.org/docs/app/guides/production-checklist
- Next.js, Self-Hosting: https://nextjs.org/docs/app/guides/self-hosting
- React, Server Components: https://react.dev/reference/rsc/server-components
- OpenAPI Specification: https://spec.openapis.org/oas/latest.html
- RFC 9457, Problem Details for HTTP APIs: https://www.rfc-editor.org/rfc/rfc9457.html
- OpenID Connect Core 1.0: https://openid.net/specs/openid-connect-core-1_0.html
- W3C, Web Content Accessibility Guidelines 2.2: https://www.w3.org/TR/WCAG22/
- BMAS, Barrierefreie-Informationstechnik-Verordnung 2.0: https://www.bmas.de/DE/Service/Gesetze-und-Gesetzesvorhaben/barrierefreie-informationstechnik-verordnung-2-0.html
- OWASP, Application Security Verification Standard: https://owasp.org/www-project-application-security-verification-standard/
- BSI IT-Grundschutz, APP.3.1 Webanwendungen und Webservices.
- Playwright, Accessibility Testing: https://playwright.dev/docs/accessibility-testing
- Playwright, Visual Comparisons: https://playwright.dev/docs/test-snapshots

## 25. Freigaben

| Rolle | Name | Entscheidung | Datum |
|---|---|---|---|
| Product Owner |  |  |  |
| Fachbereich Entsorgung |  |  |  |
| UX/Design |  |  |  |
| Architektur |  |  |  |
| Betrieb |  |  |  |
| Informationssicherheit |  |  |  |
| Datenschutz |  |  |  |
| Barrierefreiheit |  |  |  |
| Pilotkommune |  |  |  |
| Budgetverantwortung |  |  |  |
