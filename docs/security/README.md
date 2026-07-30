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

Secret Scanning und Push Protection werden nach Anlage des GitHub-Remotes in den
Repository-Einstellungen aktiviert. Ihre Verfügbarkeit für ein privates Repository
hängt von der GitHub-Organisationslizenz ab.

Threat Modeling, Container-Scans, SBOM, Header-Policy, Rate Limits, WAF und produktive
Secret-Verwaltung sind nach Wahl der Betriebsplattform umzusetzen. Dependency Audit und
CodeQL ersetzen keine Datenschutz-, Penetrations- oder Betriebsfreigabe.
