# ADR-0012: Freigabeworkflow und Änderungsverlauf für Pilotinhalte

- Status: angenommen
- Datum: 12. August 2026

## Kontext

Die geschützte Pilotpflege konnte synthetische Termine, Abfall-ABC-Einträge, Standorte und
Hinweise bisher nur unmittelbar öffentlich speichern. Damit fehlten eine Vorschau als Entwurf und
ein nachvollziehbarer Nachweis, wann ein Inhalt angelegt, geändert, freigegeben oder gelöscht
wurde. OIDC, personenbezogene Administrationsidentitäten und eine revisionssichere Archivierung
sind weiterhin nicht freigegeben.

## Entscheidung

- Jeder pflegbare Pilotinhalt besitzt den Zustand `draft` oder `published` und den Zeitpunkt der
  letzten Freigabeänderung.
- Bestehende Inhalte werden bei der Migration als `published` übernommen. Neue Eingaben erhalten
  im Admin-Formular standardmäßig den Zustand `draft`; die API behält `published` als kompatiblen
  Standard für bestehende technische Aufrufer.
- Öffentliche Inhaltsabfragen liefern ausschließlich `published`. Die geschützte Admin-API zeigt
  beide Zustände.
- Anlage, Änderung, Veröffentlichung, Rücknahme in den Entwurf und Löschung werden innerhalb
  derselben Datenbanktransaktion mandantengenau protokolliert.
- Solange keine individuelle Identität vorhanden ist, lautet der Akteur transparent
  „Geschützte Pilotpflege“. Das Protokoll behauptet keine persönliche Urheberschaft und ist noch
  kein revisionssicherer Fachnachweis.
- Ein späterer Import offizieller Aachen-Daten schreibt zunächst Entwürfe und benötigt vor der
  Veröffentlichung eine fachliche Sichtprüfung.

## Folgen

Synthetische Änderungen können vorbereitet und kontrolliert veröffentlicht werden, ohne dass
Entwürfe in der Bürgeransicht erscheinen. Der Änderungsverlauf verbessert Nachvollziehbarkeit und
Fehleranalyse im Pilot.

Vor echten Daten bleiben OIDC, Rollen und Vier-Augen-Freigaben, unveränderbare Auditablage,
Aufbewahrungs- und Löschregeln, Export, Signatur sowie Betriebs- und Datenschutzfreigabe offen.
