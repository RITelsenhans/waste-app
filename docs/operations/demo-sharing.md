# Pilot sicher per Link teilen

## Zielbild

Externe Tester erhalten einen HTTPS-Link zur Bürgeransicht, zum Beispiel
`https://abfall-pilot.example.invalid/demo`. Vor der Anwendung liegt ein zeitlich
begrenzter Zugriffsschutz. Die lokale Entwicklerinstallation bleibt privat.

## Drei Stufen

1. **Eigener Test:** `http://localhost:3000/demo`; nur auf dem Entwicklungsrechner.
2. **Kleine Vorführung:** Bildschirm teilen. Dafür ist noch kein Deployment nötig.
3. **Einladung per Link:** eigene Demo-Umgebung auf der freigegebenen Regio-IT-
   Plattform, alternativ ein zeitlich begrenzter Tunnel mit vorgeschalteter
   Identitätsprüfung.

## Mindestbedingungen für die Link-Demo

- ausschließlich synthetische Daten;
- HTTPS und Zugriff nur für eingeladene E-Mail-Adressen oder Regio-IT-SSO;
- Pflege-API standardmäßig deaktiviert (`WASTE_PILOT_ADMIN_ENABLED=false`);
- Pflegeoberfläche nicht veröffentlichen;
- getrennte Demo-Datenbank und getrennte SMTP-Testsenke;
- keine lokalen Zugangstokens oder produktiven Secrets übernehmen;
- Ablaufdatum und verantwortliche Person für die Demo festlegen;
- nach Ende der Vorführung Umgebung und Daten kontrolliert entfernen.

## Empfohlene Umsetzung

Die Bürgeransicht, API und PostgreSQL werden als eine gemeinsame, reproduzierbare
Demo-Umgebung bereitgestellt. Ein Reverse Proxy veröffentlicht genau eine HTTPS-Domain
und leitet `/v1/*` intern an die API weiter. Dadurch bleibt für Tester nur ein Link,
und es entsteht kein CORS- oder Port-Wirrwarr.

Für den ersten Entscheidertermin reicht ein manuell ausgelöstes Deployment. Im nächsten
Schritt kann GitHub Actions ein geschütztes `demo`-Environment verwenden; Secrets liegen
nur dort, und ein Freigabeschritt kontrolliert neue Deployments.

Das interne Regio-IT-GitHub ist damit die empfohlene Schaltzentrale für Build, Tests,
Freigabe und Deployment-Historie. Es ist jedoch nicht die Laufzeitplattform: GitHub Pages
liefert nur statische Dateien aus und kann die Spring-API oder PostgreSQL nicht betreiben.
Der Workflow benötigt daher ein Ziel wie Regio-IT-OpenShift/Kubernetes, eine freigegebene
VM oder einen vergleichbaren internen Containerdienst.

Solange diese Plattform noch unbekannt ist, dokumentiert
[`codespaces-demo.md`](codespaces-demo.md) eine ausdrücklich vorübergehende
Codespaces-Fallbacklösung. Sie veröffentlicht nur die geschützte Bürgeransicht auf Port
3000; Pflegeoberfläche, administrative API, PostgreSQL und Testpostfach bleiben intern
oder deaktiviert. ADR-0008 beschreibt Grenze und Rückbaupflicht.

## Noch zu entscheiden

- konkrete Regio-IT-Betriebsplattform und Domain;
- vorhandener Identitätsprovider bzw. Zugriffsschutz;
- Registry und Verantwortliche für Deployment und Rückbau;
- zulässige externe Testpersonen und maximale Laufzeit.
