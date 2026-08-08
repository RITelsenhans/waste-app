# Sicherheits-Baseline

- Keine Geheimnisse oder produktiven Daten im Repository.
- Tenant-Schlüssel werden ausschließlich gegen konfigurierte Einträge aufgelöst.
- Unbekannte Mandanten liefern Problem Details ohne interne Schlüssel.
- Die Web-App lädt Konfiguration serverseitig.
- GitHub Actions verwendet SHA-gepinnte Actions, Minimalrechte und kein
  `pull_request_target`.
- `pnpm security:audit` blockiert bekannte npm-Advisories ab Schweregrad `high`.
- CodeQL analysiert JavaScript/TypeScript und Java/Kotlin mit den erweiterten
  Security Queries.
- Dependency Review prüft neu eingeführte Abhängigkeiten und die vorläufige
  Lizenz-Deny-Liste.
- Dependabot beobachtet npm/pnpm, Gradle und GitHub Actions wöchentlich.
- Der Qualitätsagent besitzt zusätzlich ausschließlich lesende Rechte für Actions,
  Pull Requests und Security Events. Er zeigt einen veralteten Security-/CodeQL-Lauf,
  offene hohe oder kritische Dependabot-Alerts und reguläre Updatevorschläge getrennt
  an; normale Updates sind kein Sicherheitsfund.
- Der einzige produktionsnahe Schreibtest verwendet ein zufälliges synthetisches
  `DEMO-QA-`-Kennzeichen. Die token-geschützte Selbstbereinigung akzeptiert nur den
  Demo-Mandanten, exakt passende Referenz und Kennung sowie höchstens eine Stunde
  alte Vorgänge und löscht Kinddatensätze vor dem Antrag in einer Transaktion.
- Der temporäre Codespaces-Freigabemodus schützt Seiten und gleichursprüngliche API mit
  einem HMAC-signierten, maximal acht Stunden gültigen HttpOnly-/Secure-Cookie. Er
  startet keine Pflegeoberfläche und deaktiviert administrative API-Endpunkte.

Secret Scanning und Push Protection sind im öffentlichen GitHub-Repository aktiv.
Dependabot Alerts und automatische Security Updates sind ebenfalls eingeschaltet.
CodeQL-, Secret-Scanning- und Dependabot-Alerts werden vor jeder Übergabe geprüft.

Threat Modeling, Container-Scans, SBOM, Header-Policy, Rate Limits, WAF und produktive
Secret-Verwaltung sind nach Wahl der Betriebsplattform umzusetzen. Dependency Audit und
CodeQL ersetzen keine Datenschutz-, Penetrations- oder Betriebsfreigabe.
