# Fragenkatalog für Phase 1

Stand: 31. Juli 2026

Dieser Katalog bereitet Produkt-, Daten-, UX-, Betriebs- und
Abnahmeentscheidungen für den Web Core Relaunch vor. Er ersetzt keine fachliche
Freigabe. Antworten werden anschließend als Story-Akzeptanzkriterien, Decision-Log-Einträge
oder ADRs übernommen.

Prioritäten:

- **A – blockierend:** vor der betroffenen Story zu beantworten.
- **B – pilotrelevant:** vor einem Test mit Pilotdaten zu beantworten.
- **C – vorbereitend:** darf während der Umsetzung präzisiert werden.

## 1. Pilot, Zielgruppen und Erfolg

| ID   | Prio | Frage                                                                                       | Benötigte Rolle         |
| ---- | ---- | ------------------------------------------------------------------------------------------- | ----------------------- |
| P-01 | A    | Welche Kommune ist der erste Pilotmandant?                                                  | Product Owner           |
| P-02 | A    | Welche drei Nutzergruppen müssen im ersten Test vertreten sein?                             | Fachbereich / UX        |
| P-03 | A    | Welche drei Aufgaben sollen Testpersonen ohne Hilfe erledigen können?                       | Product Owner / UX      |
| P-04 | B    | Woran erkennen wir, dass der neue Startseitenaufbau besser funktioniert?                    | Product Owner / Analyse |
| P-05 | B    | Welche Begriffe verwenden Bürgerinnen und Bürger tatsächlich für Abfallarten und Standorte? | Fachbereich / UX        |
| P-06 | B    | Welche Inhalte müssen für den Pilot zwingend aktuell und vollständig sein?                  | Fachbereich             |

## 2. Adresse und Personalisierung

| ID   | Prio | Frage                                                                                       | Benötigte Rolle             |
| ---- | ---- | ------------------------------------------------------------------------------------------- | --------------------------- |
| A-01 | A    | Welche führende Quelle liefert Straßen, Hausnummern, Ortsteile und Liefergebiete?           | Fachbereich / Architektur   |
| A-02 | A    | Welche stabile, öffentliche Adress-ID darf der Browser verwenden?                           | Datenschutz / Architektur   |
| A-03 | A    | Ab welcher Eingabelänge darf die Suche beginnen?                                            | Fachbereich / UX            |
| A-04 | A    | Wie werden gleichnamige Straßen und nicht belieferte Adressen erklärt?                      | Fachbereich / UX            |
| A-05 | B    | Welche Namen sollen Nutzende lokalen Adressen geben können, etwa „Zuhause“ oder „Eltern“?   | UX                          |
| A-06 | B    | Wie lange dürfen Adressen lokal gespeichert werden und wie werden sie vollständig gelöscht? | Datenschutz                 |
| A-07 | C    | Soll Browser-Geolocation im Pilot angeboten werden?                                         | Product Owner / Datenschutz |

## 3. Startseite, Termine und Kalender

| ID   | Prio | Frage                                                                                     | Benötigte Rolle                  |
| ---- | ---- | ----------------------------------------------------------------------------------------- | -------------------------------- |
| K-01 | A    | Welche Quelle ist für Abfuhrtermine fachlich führend?                                     | Fachbereich / Datenverantwortung |
| K-02 | A    | Wie werden Verschiebung, Ausfall und Zusatztermin aus den Quelldaten erkannt?             | Fachbereich                      |
| K-03 | A    | Welche Abfallarten, Farben, Icons und Bürgerbezeichnungen sind freigegeben?               | Fachbereich / Design             |
| K-04 | A    | Was ist bei mehreren Abfallarten am selben Tag die gewünschte Reihenfolge?                | Fachbereich / UX                 |
| K-05 | B    | Welche Information muss neben Datum, Abfallart und Adresse im Startseiten-Hero stehen?    | UX / Fachbereich                 |
| K-06 | B    | Welche Zeitzone und welche Regeln gelten für Kalenderabonnements und Sommerzeit?          | Architektur / Fachbereich        |
| K-07 | B    | Wie aktuell müssen Termin- und Cachedaten sein und wie wird ein veralteter Stand benannt? | Fachbereich / Betrieb            |

## 4. Abfall-ABC, Standorte und Meldungen

| ID   | Prio | Frage                                                                                           | Benötigte Rolle                  |
| ---- | ---- | ----------------------------------------------------------------------------------------------- | -------------------------------- |
| I-01 | A    | Welche Quelle liefert ABC-Begriffe, Synonyme, Ausschlüsse und Sicherheitshinweise?              | Fachbereich / Redaktion          |
| I-02 | A    | Welche Suchbegriffe und Tippfehler sollen für den Pilot als Abnahmedaten dienen?                | Fachbereich / UX                 |
| I-03 | A    | Welche Quelle liefert Standorte, Öffnungszeiten, Ausnahmen und angenommene Abfälle?             | Fachbereich / Datenverantwortung |
| I-04 | A    | Welcher Kartenanbieter erfüllt Lizenz-, Datenschutz-, Accessibility- und Betriebsanforderungen? | Architektur / Datenschutz        |
| I-05 | A    | Wer erstellt, priorisiert, terminiert und beendet Störungsmeldungen?                            | Redaktion / Betrieb              |
| I-06 | B    | Welche Filter benötigen Nutzende bei Standorten zuerst?                                         | UX / Fachbereich                 |
| I-07 | B    | Welche Kontaktmöglichkeit verhindert beim ABC ohne Treffer eine Sackgasse?                      | Fachbereich / Support            |

## 5. Gestaltung, Inhalt und Nutzertest

| ID   | Prio | Frage                                                                                         | Benötigte Rolle           |
| ---- | ---- | --------------------------------------------------------------------------------------------- | ------------------------- |
| U-01 | A    | Sind Logo, Regio-IT-Farben und die gezeigte visuelle Hierarchie freigegeben?                  | Design / Marke            |
| U-02 | A    | Welche kommunalen Brandingwerte dürfen Mandanten selbst konfigurieren?                        | Design / Produkt          |
| U-03 | A    | Welche Texte der Demovorschau sind verständlich, welche wirken technisch oder unklar?         | UX / Redaktion            |
| U-04 | B    | Ist „Schnell erledigen“ die passende Bezeichnung für Kalender, ABC und Standorte?             | UX                        |
| U-05 | B    | Soll die mobile Hauptnavigation „Standorte“ direkt oder unter „Mehr“ zeigen?                  | UX / Nutzertest           |
| U-06 | B    | Welche realistischen, aber vollständig synthetischen Inhalte werden für Nutzertests benötigt? | Fachbereich / Datenschutz |
| U-07 | B    | Wie wird Feedback aus Tests erfasst, priorisiert und auf Entscheidungen zurückgeführt?        | Product Owner / UX        |

## 6. Barrierefreiheit und Browser

| ID   | Prio | Frage                                                                                       | Benötigte Rolle                  |
| ---- | ---- | ------------------------------------------------------------------------------------------- | -------------------------------- |
| B-01 | A    | Welche aktuellen und vorherigen Browserhauptversionen sind verbindlich?                     | Betrieb / Architektur            |
| B-02 | A    | Welche realen iOS- und Android-Geräte stehen für Tests bereit?                              | Testmanagement                   |
| B-03 | A    | Welche Screenreader-/Browser-Kombinationen werden manuell geprüft?                          | Barrierefreiheit                 |
| B-04 | A    | Wer verantwortet die WCAG-2.2-AA-/BITV-Abnahme?                                             | Auftraggeber                     |
| B-05 | B    | Wie werden Windows High Contrast, reduzierte Bewegung, 200-%-Zoom und Textabstände geprüft? | Barrierefreiheit / Test          |
| B-06 | B    | Auf welcher stabilen Plattform entstehen und prüfen wir visuelle Referenzbilder?            | Test / Architektur               |
| B-07 | B    | Wann und mit welchen Assistenztechnik-Nutzenden findet der erste inklusive Test statt?      | Product Owner / Barrierefreiheit |

## 7. PostgreSQL, Konfiguration und Betrieb

| ID   | Prio | Frage                                                                                                         | Benötigte Rolle                  |
| ---- | ---- | ------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| D-01 | A    | Welche PostgreSQL-Hauptversion ist im Regio-IT-Betrieb freigegeben?                                           | Betrieb / Architektur            |
| D-02 | A    | Wird PostgreSQL als Managed Service, Plattformdienst oder selbst betrieben bereitgestellt?                    | Betrieb                          |
| D-03 | A    | Welche Vorgaben gelten für Verschlüsselung, Netzwerkzugriff, Rollen und Secrets?                              | Informationssicherheit / Betrieb |
| D-04 | A    | Welche Backup-, Restore-, Hochverfügbarkeits- und Wartungsziele gelten?                                       | Betrieb                          |
| D-05 | A    | Soll produktive Mandantenkonfiguration in PostgreSQL, einem CMS oder einem vorhandenen System geführt werden? | Produkt / Architektur            |
| D-06 | B    | Welches Migrationswerkzeug und welcher Rollback-/Forward-Fix-Prozess sind freigegeben?                        | Architektur / Betrieb            |
| D-07 | B    | Welche Daten dürfen in lokalen und CI-Datenbank-Fixtures enthalten sein?                                      | Datenschutz / Test               |

## 8. Recht, Sicherheit, Support und Abnahme

| ID   | Prio | Frage                                                                                            | Benötigte Rolle        |
| ---- | ---- | ------------------------------------------------------------------------------------------------ | ---------------------- |
| R-01 | A    | Wer liefert Impressum, Datenschutzinformation und Barrierefreiheitserklärung je Mandant?         | Recht / Datenschutz    |
| R-02 | A    | Welche Security-Header-, CSP- und Rate-Limit-Vorgaben gelten?                                    | Informationssicherheit |
| R-03 | A    | Welche Supportzeiten, Kontaktwege und Eskalationsstufen gelten im Pilot?                         | Betrieb / Support      |
| R-04 | B    | Welche anonymen Produktmetriken werden benötigt und auf welcher Rechtsgrundlage?                 | Produkt / Datenschutz  |
| R-05 | B    | Welche Performancebudgets werden unter welcher Netz- und Gerätebedingung abgenommen?             | Produkt / Architektur  |
| R-06 | B    | Wer darf einen Pilotstand fachlich, technisch und rechtlich freigeben?                           | Auftraggeber           |
| R-07 | B    | Welche Fehler blockieren einen Pilot, welche dürfen mit dokumentiertem Workaround offen bleiben? | Product Owner / Test   |

## Vorgeschlagener Klärungsablauf

1. In einem 90-minütigen Termin zuerst alle A-Fragen aus Pilot, Adresse, Termine und
   Datenquellen beantworten.
2. Design/UX und Barrierefreiheit separat mit der klickbaren Demovorschau prüfen.
3. Betrieb, PostgreSQL und Security in einem Architekturtermin entscheiden.
4. Antworten in kleine, abnahmefähige Phase-1-Story-Pakete überführen.
