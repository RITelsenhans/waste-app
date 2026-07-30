# API Client

Der Client wird aus `contracts/openapi/abfall-api.yaml` erzeugt. Dateien unter `src/generated` dürfen nicht manuell geändert werden.

```bash
pnpm contracts:generate
pnpm contracts:check
```

Die öffentliche Fassade in `src/index.ts` kapselt Laufzeitkonfiguration und Fehlerabbildung für das Web.
