# CI

GitHub Actions ist gemäß ADR-0005 die gewählte CI. Die Workflows führen ausschließlich
Prüfungen aus; es gibt keinen Deployment-Job.

## Workflows

| Workflow                | Auslöser                                            | Aufgabe                                                            |
| ----------------------- | --------------------------------------------------- | ------------------------------------------------------------------ |
| `ci.yml`                | Pull Request, Push auf `main`, manuell              | Frozen Install, Formatierung, Linting, Typprüfung, Tests und Build |
| `security.yml`          | Pull Request, Push auf `main`, wöchentlich, manuell | pnpm-Advisories und CodeQL für beide Technologie-Stacks            |
| `dependency-review.yml` | Pull Request                                        | Neue verwundbare oder nicht freigegebene Abhängigkeiten blockieren |

Alle fremden Actions sind auf vollständige Commit-SHAs gepinnt. Der lokale Policy-Test
prüft diese Eigenschaft sowie Minimalrechte und die vollständigen Quality Gates:

```bash
pnpm ci:validate
pnpm security:audit
```

## GitHub-Iststand

Das öffentliche Zielrepository ist
[`RITelsenhans/waste-app`](https://github.com/RITelsenhans/waste-app). Aktiv sind:

1. Dependency Graph, Dependabot Alerts, automatische Security Updates und wöchentliche
   Version Updates.
2. CodeQL/Code Scanning für JavaScript/TypeScript und Java/Kotlin.
3. Secret Scanning und Push Protection; produktive Geheimnisse bleiben trotzdem
   außerhalb des Repositories.
4. Branch-Schutz für `main` mit Pull-Request-Pflicht, verworfenen Freigaben nach neuen
   Commits, aufgelösten Gesprächen, Admin-Enforcement sowie Schutz vor Force Push und
   Löschung.
5. Auto-Merge, das weiterhin sämtliche Branch-Regeln und Required Checks abwartet.

Als Required Status Checks werden empfohlen:

- `CI / Quality gates`
- `Security / Dependency audit`
- `Security / CodeQL`
- `Dependency Review / Dependency review`

Die API-Kontexte heißen `Quality gates`, `Dependency audit`, `CodeQL` und
`Dependency review`; die GitHub-Oberfläche kann zusätzlich den Workflow-Namen anzeigen.

Ein zweiter Reviewer und die künftige GitHub-Organisationszuordnung sind noch offen.
Deshalb ist die Pull-Request-Pflicht bereits aktiv, die Zahl verpflichtender
Freigaben aber vorläufig `0`. Sobald ein unabhängiger Reviewer benannt ist, wird sie
auf mindestens `1` erhöht. Administratoren können die übrigen Regeln nicht umgehen.
Auch der Einsatz einer Merge Queue ist noch zu entscheiden.

Die aktuell von Dependency Review unterstützte Option `deny-licenses` ist laut
Action-Dokumentation als künftig entfallend markiert. Sie bleibt für diese schmale,
vorläufige Deny-Liste aktiv und muss bei einem Action-Upgrade gegen die dann empfohlene
Policy-Form geprüft werden.

## Pflege

Dependabot erstellt wöchentlich getrennte Pull Requests für npm/pnpm, Gradle und
GitHub Actions. Bei Updates externer Actions bleibt die vollständige SHA-Pinnung
verpflichtend. Der Kommentar hinter der SHA dokumentiert nur die lesbare Releaseversion
und ist keine Sicherheitsgrenze.
