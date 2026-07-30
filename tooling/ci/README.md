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

## Nach Anlage des GitHub-Remotes

Vor dem ersten Merge sind in den GitHub-Einstellungen zu aktivieren:

1. Dependency Graph, Dependabot Alerts und Dependabot Security Updates.
2. CodeQL/Code Scanning; für private Repositories muss die verfügbare GitHub-Lizenz
   vorab bestätigt werden.
3. Secret Scanning und Push Protection; produktive Geheimnisse bleiben trotzdem
   außerhalb des Repositories.
4. Eine Branch-Regel für `main` mit Pull-Request-Pflicht, mindestens einer Freigabe,
   verworfenen Freigaben nach neuen Commits, aufgelösten Gesprächen sowie Schutz vor
   Force Push und Löschung.

Als Required Status Checks werden empfohlen:

- `CI / Quality gates`
- `Security / Dependency audit`
- `Security / CodeQL`
- `Dependency Review / Dependency review`

Das verantwortliche Review-Team, Ausnahmen für Administratoren, Merge Queue,
Repository-Sichtbarkeit und die GitHub-Sicherheitslizenz sind noch
Organisationsentscheidungen. Bei nicht verfügbarer Lizenz wird kein Gate ohne ADR
entfernt; stattdessen ist eine gleichwertige Alternative zu beschließen.

Die aktuell von Dependency Review unterstützte Option `deny-licenses` ist laut
Action-Dokumentation als künftig entfallend markiert. Sie bleibt für diese schmale,
vorläufige Deny-Liste aktiv und muss bei einem Action-Upgrade gegen die dann empfohlene
Policy-Form geprüft werden.

## Pflege

Dependabot erstellt wöchentlich getrennte Pull Requests für npm/pnpm, Gradle und
GitHub Actions. Bei Updates externer Actions bleibt die vollständige SHA-Pinnung
verpflichtend. Der Kommentar hinter der SHA dokumentiert nur die lesbare Releaseversion
und ist keine Sicherheitsgrenze.
