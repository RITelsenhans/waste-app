# ADR-0002: Dateibasierte Mandantenkonfiguration zum Projektstart

- Status: angenommen
- Datum: 30. Juli 2026

## Kontext

Mandantenkonfiguration muss zur Laufzeit änderbar sein. Ein produktives CMS, eine Datenbank und deren Betriebsverantwortung sind noch nicht entschieden. Der Projektstart benötigt dennoch einen nachweisbaren Demo-Mandanten ohne hart codierte UI-Werte.

## Entscheidung

Die API bindet Mandanten aus Spring-Konfiguration unter `waste.tenants`. Die mitgelieferte Datei enthält nur `demo`; alle Werte können über Spring-kompatible Umgebungsvariablen oder eine externe Konfigurationsdatei überschrieben werden. Das Web lädt `GET /v1/tenants/{tenantKey}/config` serverseitig und verwendet keine eingebettete Mandantenkopie.

Unbekannte Schlüssel liefern einen strukturierten 404-Fehler. Die Auflösung erfolgt zunächst ausschließlich über den URL-Pfad.

## Folgen

Der Start bleibt ohne Datenbank lokal ausführbar und wahrt die API-Grenze. Mehrinstanz-Caching, Konfigurationsversionierung, Freigabeprozesse, Signaturen und ein produktiver Remote-Store sind noch nicht gelöst. Der spätere Adapter ersetzt die Repository-Implementierung, ohne den öffentlichen Vertrag zu ändern.
