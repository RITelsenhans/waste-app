# Aachen: verfügbare Datenquellen und Importvorbereitung

Stand: 12. August 2026

## Ergebnis

Ein Teil des Aachen-Piloten kann ohne Karten-Scraping und ohne personenbezogene Daten aus dem
offiziellen Open-Data-Portal vorbereitet werden. Für adressgenaue Abfuhrtermine, Behälter- und
Tourenzuordnung sowie vollständige aktuelle Abfall-ABC-Daten ist weiterhin eine dokumentierte
Bestands-API oder eine fachlich freigegebene Exportquelle erforderlich.

## Geeignete offizielle Quellen

| Bereich                              | Quelle                                                                                                                                                                                                                                | Format und Lizenz                                                                      | Bewertung                                                                                                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Adressen                             | [Adressen Stadt Aachen](https://offenedaten.aachen.de/dataset/adressen-stadtaachen)                                                                                                                                                   | WFS, CSV; Datenlizenz Deutschland – Namensnennung – Version 2.0                        | Bevorzugte Quelle für einen Adapter. Enthält amtliche Adressen und Punktkoordinaten. Koordinatenfelder und EPSG-Angabe müssen technisch gegengeprüft werden. |
| Recyclinghöfe                        | [Recyclinghöfe Stadt Aachen](https://offenedaten.aachen.de/de/dataset/recyclinghofe-stadt-aachen)                                                                                                                                     | CSV, GeoJSON                                                                           | Fachlich passend für Standortentwürfe; Portalstand Juli 2022, deshalb vor Freigabe Aktualität mit dem Stadtbetrieb prüfen.                                   |
| Glascontainer                        | [Glascontainer Stadt Aachen](https://offenedaten.aachen.de/de/dataset/glascontainer-aachen)                                                                                                                                           | CSV, GeoJSON; Datenlizenz Deutschland – Namensnennung – Version 2.0                    | Für zusätzliche Entsorgungsstandorte geeignet; Portalstand Juli 2022.                                                                                        |
| Weitere Annahmestellen               | [Datensätze des Aachener Stadtbetriebs](https://offenedaten.aachen.de/de/group/regierung-und-oeffentlicher-sektor?_tags_limit=0&groups=regierung-und-oeffentlicher-sektor&organization=aachener-stadtbetrieb-e-18&res_format=GeoJSON) | unter anderem Schadstoffmobil, Kompostcontainer, Gelbe Säcke, Müllsack-Verkaufsstellen | Als optionale Standorttypen verwendbar; Aktualität und Feldqualität je Datensatz separat prüfen.                                                             |
| Abfallkalender und Fachinformationen | [Abfallwirtschaft der Stadt Aachen](https://www.aachen.de/in-aachen-leben/sicherheit-ordnung/stadtbetrieb/abfallwirtschaft/)                                                                                                          | öffentliche Webseiten und Abfallkalender                                               | Gute fachliche Referenz, aber keine dokumentierte stabile Maschinen-API. Nicht automatisiert scrapen.                                                        |

## Geplanter Importweg

1. Quelle über eine feste Ressourcen- oder WFS-URL abrufen und Abrufzeit, Lizenz und Prüfsumme
   protokollieren.
2. Rohdaten nur temporär halten; Pflichtfelder, Zeichensatz, Dubletten, Adressschlüssel und
   Koordinatensystem validieren.
3. Quelldaten in das kanonische App-Schema übersetzen. Externe Schlüssel werden getrennt von
   öffentlichen IDs geführt.
4. Änderungen als **Entwurf** in einen Importlauf schreiben; keine automatische Veröffentlichung.
5. Einen Differenzbericht mit neu, geändert, unverändert und entfernt erzeugen. Bei ungewöhnlich
   vielen Löschungen oder Validierungsfehlern den gesamten Lauf blockieren.
6. Stichprobe und Aktualität fachlich prüfen, Namensnennung hinterlegen und erst danach im Admin
   freigeben.

## Noch benötigte Bestands-API-Informationen

„Bestands-API“ bezeichnet die bereits vorhandenen Hintergrundschnittstellen der bisherigen
Abfallanwendung oder der kommunalen Fachverfahren. Benötigt werden je Schnittstelle mindestens:

- verantwortliches System und fachlicher Ansprechpartner,
- Test-URL und Authentifizierungsverfahren,
- Vertrag oder Beispieldaten für Adresse, Abfuhrtermine, Abfallart und Änderungen,
- Aktualisierungsrhythmus, Fehlerfälle und zulässige Nutzung,
- Mandanten- und Gebietszuordnung,
- Datenschutz-, Aufbewahrungs- und Betriebsanforderungen.

Bis diese Angaben vorliegen, bleiben Abfuhrtermine und Transaktionsdaten synthetisch.
