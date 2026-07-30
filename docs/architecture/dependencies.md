# Abhängigkeits- und Lizenzprüfung

Stand: 30. Juli 2026. Aufgeführt sind bewusst hinzugefügte direkte Laufzeit-, Build- und Testabhängigkeiten. Transitive Abhängigkeiten müssen in CI künftig zusätzlich per SBOM und Policy geprüft werden.

| Komponente                  | Version                     | Bedarf                                                                                                   | Lizenz     |
| --------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------- | ---------- |
| Next.js                     | 16.2.12                     | App Router, SSR und Web-Build                                                                            | MIT        |
| React / React DOM           | 19.2.8                      | deklarative Weboberfläche                                                                                | MIT        |
| TypeScript                  | 6.0.3                       | statische Typprüfung im Web; Version 7 ist mit der aktuellen Next.js-Linttoolchain noch nicht kompatibel | Apache-2.0 |
| ESLint / eslint-config-next | 9.39.5 / 16.2.12            | Web-Linting und Next-Regeln; ESLint 10 ist von den transitiven Next.js-Plugins noch nicht freigegeben    | MIT        |
| Vitest                      | 4.1.10                      | schnelle TypeScript-Basistests                                                                           | MIT        |
| Node.js-Typdefinitionen     | 24.10.1                     | Typen für Node-basierte Generator-Konfiguration und Buildskripte                                         | MIT        |
| Prettier                    | 3.9.6                       | einheitliche Web-/Dokumentformatierung                                                                   | MIT        |
| Spring Boot Web / Test      | 4.1.0                       | eigenständige HTTP-API und Integrationstests                                                             | Apache-2.0 |
| Kotlin JVM / Spring Plugin  | 2.3.21                      | von Spring Initializr 4.1 vorgegebene Kotlin-Kompilierung und Spring-Proxy-Kompatibilität                | Apache-2.0 |
| Jackson Kotlin Module       | durch Spring Boot verwaltet | JSON-Bindung für Kotlin-Datenklassen                                                                     | Apache-2.0 |
| Spotless Gradle Plugin      | 8.9.0                       | reproduzierbare Kotlin-Format- und Lintprüfung                                                           | Apache-2.0 |
| ktlint                      | 1.7.1                       | Kotlin-Regeln innerhalb Spotless                                                                         | MIT        |
| Gradle Wrapper              | 9.5.1                       | reproduzierbares API-Buildwerkzeug ohne globale Installation                                             | Apache-2.0 |
| Redocly CLI                 | 2.43.1                      | semantische OpenAPI-3.1-Validierung und API-Regeln                                                       | MIT        |
| Hey API OpenAPI TypeScript  | 0.97.3                      | deterministische TypeScript-Typen und Fetch-SDK; sichere, zur Node-22.13-Baseline passende Patchversion  | MIT        |

GitHub-Actions-Komponenten:

| Komponente               | Version | Gepinnter Commit                           | Bedarf                                    | Lizenz |
| ------------------------ | ------- | ------------------------------------------ | ----------------------------------------- | ------ |
| actions/checkout         | 7.0.1   | `3d3c42e5aac5ba805825da76410c181273ba90b1` | Repository-Inhalt in CI bereitstellen     | MIT    |
| actions/setup-node       | 7.0.0   | `820762786026740c76f36085b0efc47a31fe5020` | reproduzierbare Node-22-Laufzeit          | MIT    |
| actions/setup-java       | 5.6.0   | `03ad4de0992f5dab5e18fcb136590ce7c4a0ac95` | Temurin 21 und Gradle-Cache               | MIT    |
| dependency-review-action | 5.0.0   | `a1d282b36b6f3519aa1f3fc636f609c47dddb294` | neue Advisories und Lizenzen im PR prüfen | MIT    |
| github/codeql-action     | 4.37.4  | `f205ea1c3313d32999d8d6a48b4f6530d4437b38` | statische Security-Analyse beider Stacks  | MIT¹   |

¹ Die Action ist MIT-lizenziert. Nutzung und Verfügbarkeit der enthaltenen
CodeQL-Analyse unterliegen zusätzlich den GitHub-Bedingungen und dem Tarif des
Ziel-Repositories.

Sicherheitsbedingte transitive Overrides:

| Komponente      | Erzwungene Version | Bedarf                                                          | Lizenz     |
| --------------- | ------------------ | --------------------------------------------------------------- | ---------- |
| brace-expansion | 5.0.8              | schließt CVE-2026-14257 im ESLint/Minimatch-Pfad                | MIT        |
| js-yaml         | 4.3.0              | schließt die im OpenAPI-Tooling gemeldete High-Severity-Lücke   | MIT        |
| postcss         | 8.5.25             | schließt die im Next.js-Buildpfad gemeldete High-Severity-Lücke | MIT        |
| sharp           | 0.35.0             | schließt die im Next.js-Bildpfad gemeldete High-Severity-Lücke  | Apache-2.0 |

Die Overrides bleiben nur so lange bestehen, bis die direkten Upstream-Abhängigkeiten
selbst sichere Versionen auflösen. `sharp` wird zusätzlich mit dem
Next.js-Produktionsbuild und der Bildroute getestet.

`minimatch@3.1.5` erwartet historisch den CommonJS-Default-Export von
`brace-expansion`. Die sichere Major-Version 5.0.8 exportiert stattdessen die Funktion
benannt als `expand`. Der minimale, eingecheckte pnpm-Patch unter `patches/` akzeptiert
beide Exportformen, verändert keine Matching-Logik und ermöglicht so die sichere
Version ohne inkompatiblen ESLint-Lauf. Der Patch wird entfernt, sobald ESLint diese
Legacy-Linie nicht mehr auflöst.

Explizit erlaubte transitive Build-Skripte:

| Komponente    | Version | Herkunft und Bedarf                                                      | Lizenz     |
| ------------- | ------- | ------------------------------------------------------------------------ | ---------- |
| sharp         | 0.35.0  | Transitiv über Next.js; native Bildverarbeitung für `next/image`         | Apache-2.0 |
| unrs-resolver | 1.12.2  | Transitiv über `eslint-config-next`; nativer Import-Resolver für Linting | MIT        |

Es wurden keine UI-, CSS-, Datenbank-, Telemetrie-, Karten-, Authentifizierungs- oder
Phase-2-Bibliotheken aufgenommen, weil dafür in diesem Auftrag kein nachgewiesener
Bedarf besteht. Die OpenAPI-Werkzeuge sind ausschließlich durch WF1-S004, die
GitHub-Actions-Komponenten durch WF1-S006 begründet.

## Bekannte Tooling-Warnung

`pnpm peers check` meldet für `@napi-rs/wasm-runtime` optionale
`@emnapi/core`-/`@emnapi/runtime`-Peers in einer Alpha-Versionsreihe. Die Pfade stammen
transitiv aus Vite/Vitest sowie dem von Next.js verwendeten Import-Resolver. Sie werden
von den nativen macOS-Buildpfaden nicht genutzt; Frozen-Install, Lint, Typprüfung, Tests
und Produktionsbuild sind erfolgreich. Es werden dafür keine unbenötigten
Alpha-Abhängigkeiten direkt aufgenommen. Die Warnung wird bei den vorgesehenen
Dependency-Upgrades erneut bewertet.
