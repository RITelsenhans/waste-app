# ADR-0003: OpenAPI-Validierung und TypeScript-Clientgenerierung

- Status: angenommen
- Datum: 30. Juli 2026

## Kontext

Die Spezifikation verlangt Contract-first-Entwicklung, automatische OpenAPI-Prüfung und einen generierten Web-Client. Der technische Start enthielt zwar einen OpenAPI-3.1-Vertrag, aber noch keine semantische Validierung. Der Webcode duplizierte `TenantConfig` manuell und konnte deshalb unbemerkt vom Vertrag abweichen.

## Entscheidung

- Redocly CLI 2.43.1 validiert den Vertrag mit `recommended-strict`.
- Hey API OpenAPI TypeScript 0.97.3 erzeugt Fetch-Client, SDK und TypeScript-Typen unter `packages/api-client/src/generated`.
- Generierter Code wird eingecheckt und nicht manuell verändert.
- `generate:check` generiert in ein temporäres Verzeichnis und vergleicht den Inhalt bytegenau mit dem eingecheckten Stand.
- Das Web konsumiert ausschließlich den Client aus `@waste/api-client`; Fehlerabbildung und mandantenspezifische Cache-Regeln bleiben in einer kleinen, handgeschriebenen Paket-Fassade.
- Vertragsbeispiele werden gegen die generierten Typen geprüft. SDK-Tests verifizieren Pfadparameter, Basis-URL, HTTP-Fehler und `cache: no-store`.
- Der Standard-Fetch-Client genügt für den technischen Start, weil nur standardisiertes `RequestInit.cache: no-store` verwendet wird. Next.js-spezifische Revalidierungs-Tags würden eine erneute Cliententscheidung erfordern.

Hey API 0.97.3 ist bewusst gebunden, weil es Node.js ab 22.13 unterstützt und den
Advisory GHSA-hhx9-57xq-r5rw behebt. Die zum Entscheidungszeitpunkt aktuelle Version
0.99.0 benötigt Node.js ab 22.18 und passt damit nicht zur bestehenden Baseline.

## Folgen

Vertragsänderungen erzeugen reproduzierbare Clientänderungen und werden durch die Root-Qualitätsgates geprüft. Zwei MIT-lizenzierte Buildwerkzeuge kommen hinzu. Der Fetch-Client wird seit Hey API 0.73 direkt vom Generator bereitgestellt und benötigt keine zusätzliche Laufzeitbibliothek. Die Formatierung erhält ihre Konfiguration explizit aus dem Repository, damit die Drift-Prüfung auch bei einer Generierung im temporären Verzeichnis deterministisch bleibt. Ein Upgrade von Node.js und Hey API wird separat durchgeführt und benötigt Regeneration sowie vollständige Prüfungen.
