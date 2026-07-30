# UI

Mandantenneutrale, serverseitig renderbare React-Primitives auf Basis von
`@waste/design-tokens`. Das Paket enthält keine Fachlogik und keine Next.js-Abhängigkeit.

## Komponenten

- `Action`: rendert abhängig von `href` einen nativen Link oder Button. Zustände:
  `primary`, `secondary`, `disabled` und `focus-visible`.
- `Card`: semantisch als `article`, `aside`, `section` oder `div` nutzbar. Zustände:
  `flat` und `raised`.
- `StatusBadge`: sichtbarer Statustext mit zusätzlichem, dekorativem Indikator. Varianten:
  `neutral`, `info`, `success`, `warning` und `danger`.

Statusänderungen werden nicht automatisch als Live-Region ausgegeben. Der jeweilige
Anwendungskontext entscheidet, ob und mit welcher Priorität eine Änderung angekündigt
werden muss.

## Verwendung

```tsx
import { Action, Card, StatusBadge } from "@waste/ui";
import "@waste/ui/styles.css";

<Card as="article">
  <StatusBadge tone="success">Planmäßig</StatusBadge>
  <Action href="#details">Details öffnen</Action>
</Card>;
```

Die Komponenten akzeptieren `className` und native HTML-Attribute. Fachliche
Bezeichnungen, Routing und Geschäftsregeln bleiben bei der konsumierenden Anwendung.
