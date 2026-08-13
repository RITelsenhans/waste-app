# Pilotpflege: Entwurf, Veröffentlichung und Änderungsverlauf

## Zweck und Grenze

Die Admin-Anwendung verwaltet weiterhin ausschließlich synthetische Pilotdaten. Der
Freigabeworkflow verhindert, dass vorbereitete Änderungen sofort in der Bürgeransicht erscheinen.
Er ersetzt weder ein Redaktionssystem noch OIDC, Rollen oder eine revisionssichere Archivierung.

## Bedienweg

1. Kommune auswählen.
2. Unter **Neu anlegen** einen Inhalt erfassen und **Als Entwurf speichern** wählen.
3. Unter **Bestand bearbeiten** den Eintrag kontrollieren. Der Badge zeigt **Entwurf** oder
   **Veröffentlicht**.
4. Für die Freigabe im Feld **Freigabe** den Wert **Veröffentlicht** wählen und speichern.
5. Unter **Änderungsverlauf** die Anlage, Bearbeitung, Freigabe oder Löschung prüfen.

Entwürfe sind nur in der geschützten Pilotpflege sichtbar. Eine Rücknahme auf **Entwurf** entfernt
den Inhalt aus öffentlichen Abfragen, löscht ihn aber nicht.

## Betriebshinweise

- Die Flyway-Migration übernimmt alle vorhandenen Inhalte einmalig als veröffentlicht.
- Audit-Ereignisse werden in derselben Transaktion wie die Inhaltsänderung geschrieben.
- Der angezeigte Akteur ist vorerst nur die gemeinsame „Geschützte Pilotpflege“.
- Vor einem Import werden Datensätze als Entwürfe angelegt und erst nach Sichtprüfung freigegeben.
- Eine fehlerhafte Freigabe wird auf Entwurf zurückgesetzt; eine Löschung ist nur erforderlich,
  wenn der Eintrag dauerhaft aus dem Pilotbestand entfernt werden soll.
