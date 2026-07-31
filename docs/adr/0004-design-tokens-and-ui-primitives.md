# ADR-0004: Design Tokens und frameworkneutrale UI-Primitives

- Status: angenommen
- Datum: 30. Juli 2026

## Kontext

WF1-S005 verlangt versionierte Design Tokens und ein UI-Paket mit dokumentierten
Zuständen. Die Startseite enthielt wiederkehrende Karten-, Aktions- und
Statusdarstellungen bisher direkt im Web. Gleichzeitig sollen Server Components,
semantisches HTML und eine spätere Nutzung der Tokens außerhalb des Webs möglich bleiben.

## Entscheidung

- `packages/design-tokens/tokens.json` bleibt die plattformneutrale Quelle. Daraus wird
  deterministisch CSS mit Custom Properties erzeugt.
- Das Tokenmodell ergänzt Abstände, Typografierollen, Fokusdarstellung, Zielgröße und
  Radien. Breakpoints bleiben dokumentierte Tokens und werden in CSS-Media-Queries nur
  als technisch notwendige Literale verwendet, weil CSS Custom Properties dort nicht
  portabel einsetzbar sind.
- Der Markenwert `accent.info` bleibt für grafische Akzente erhalten. Kleine
  Informationstexte auf hellen Flächen verwenden `accent.infoStrong`, weil der
  Markenwert dort die WCAG-AA-Kontrastschwelle nicht erreicht.
- `@waste/ui` enthält zunächst ausschließlich `Action`, `Card` und `StatusBadge`. Diese
  Komponenten decken mehrere vorhandene Wiederverwendungsfälle ab, enthalten keine
  Fachlogik und keine Next.js-Abhängigkeit.
- `Action` rendert je nach `href` ein natives `a`- oder `button`-Element. Deshalb ist die
  Next.js-Regel `no-html-link-for-pages` ausschließlich im frameworkneutralen UI-Paket
  deaktiviert; Routingoptimierung bleibt Entscheidung der konsumierenden Anwendung.
- Status wird immer als sichtbarer Text ausgegeben. Der Farbindikator ist dekorativ und
  wird von assistiven Technologien ignoriert.
- Komponenten werden serverseitig als statisches HTML getestet. Browserbasierte
  Accessibility- und visuelle Tests bleiben Teil eines späteren Qualitätsauftrags.

Es werden keine neuen externen Bibliotheken eingeführt. React, TypeScript, ESLint und
Vitest werden in den bereits geprüften Workspace-Versionen wiederverwendet.

## Folgen

Die Web-Shell konsumiert dieselben Primitives für Start-, Fehler- und
Nicht-gefunden-Zustände. Komponentenstile verwenden ausschließlich Design Tokens und
Mandantenfarben mit Regio-IT-Fallback. Produktive Mandantenfarben müssen vor ihrer
Auslieferung noch serverseitig gegen freigegebene Kontrastregeln validiert werden.
