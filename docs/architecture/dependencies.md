# Abhängigkeits- und Lizenzprüfung

Stand: 19. Oktober 2026. Aufgeführt sind bewusst hinzugefügte direkte Laufzeit-, Build- und Testabhängigkeiten. Transitive Abhängigkeiten müssen in CI künftig zusätzlich per SBOM und Policy geprüft werden.

| Komponente                  | Version                     | Bedarf                                                                                                     | Lizenz                                                          |
| --------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Next.js                     | 16.3.8                      | App Router, SSR und Web-Build; schließt die gemeldeten kritischen 16.2-Sicherheitslücken                   | MIT                                                             |
| React / React DOM           | 19.2.8                      | deklarative Weboberfläche                                                                                  | MIT                                                             |
| Capacitor Core / iOS / CLI  | 8.5.3                       | installierbare iOS-Hülle, native Xcode-Integration und reproduzierbare Synchronisierung des Technikspikes  | MIT                                                             |
| Capacitor Preferences       | 8.0.1                       | kleine, nicht sensible lokale Einstellung der synthetischen Pilotadresse                                   | MIT                                                             |
| Vite / React Plugin         | 8.3.4 / 6.1.2               | statischer Mobile-Build und React-Transformation für die Capacitor-Hülle                                   | MIT                                                             |
| TypeScript                  | 6.0.3                       | statische Typprüfung im Web; Version 7 ist mit der aktuellen Next.js-Linttoolchain noch nicht kompatibel   | Apache-2.0                                                      |
| ESLint / eslint-config-next | 9.39.5 / 16.3.8             | Web-Linting und Next-Regeln; ESLint 10 ist von den transitiven Next.js-Plugins noch nicht freigegeben      | MIT                                                             |
| Vitest                      | 4.1.10                      | schnelle TypeScript-Basistests                                                                             | MIT                                                             |
| Node.js-Typdefinitionen     | 24.13.3                     | Typen für Node-basierte Generator-Konfiguration und Buildskripte; Patch innerhalb der Node-24-Baseline     | MIT                                                             |
| Prettier                    | 3.9.6                       | einheitliche Web-/Dokumentformatierung                                                                     | MIT                                                             |
| Spring Boot Web / Test      | 4.1.0                       | eigenständige HTTP-API und Integrationstests                                                               | Apache-2.0                                                      |
| Spring JDBC                 | 7.0.8                       | schlanker, expliziter SQL-Zugriff ohne zusätzliche ORM-Abstraktion                                         | Apache-2.0                                                      |
| Spring Boot Mail            | 4.1.0                       | SMTP-Adapter und MIME-/HTML-Nachrichten über die von Spring verwaltete Mail-Konfiguration                  | Apache-2.0 / EPL-2.0                                            |
| Flyway Core / PostgreSQL    | 12.4.0                      | versionierte, beim API-Start validierte Datenbankschemata                                                  | Apache-2.0                                                      |
| PostgreSQL JDBC             | 42.7.11                     | Laufzeitzugriff der API auf PostgreSQL 17                                                                  | BSD-2-Clause                                                    |
| H2 Database Engine          | 2.4.240                     | schneller PostgreSQL-kompatibler Integrationstest ohne zweiten Datenbankprozess                            | MPL-2.0 oder EPL-1.0                                            |
| Kotlin JVM / Spring Plugin  | 2.4.10                      | gekoppelte Kotlin-Kompilierung und Spring-Proxy-Kompatibilität; aktuelles Fehlerkorrektur-Release          | Apache-2.0                                                      |
| Jackson Kotlin Module       | durch Spring Boot verwaltet | JSON-Bindung für Kotlin-Datenklassen                                                                       | Apache-2.0                                                      |
| Spotless Gradle Plugin      | 8.9.0                       | reproduzierbare Kotlin-Format- und Lintprüfung                                                             | Apache-2.0                                                      |
| ktlint                      | 1.7.1                       | Kotlin-Regeln innerhalb Spotless                                                                           | MIT                                                             |
| Gradle Wrapper              | 9.6.1                       | reproduzierbares API-Buildwerkzeug ohne globale Installation; empfohlenes Patch-Update der 9.6-Linie       | Apache-2.0                                                      |
| Redocly CLI                 | 2.43.1                      | semantische OpenAPI-3.1-Validierung und API-Regeln                                                         | MIT                                                             |
| Hey API OpenAPI TypeScript  | 0.97.3                      | deterministische TypeScript-Typen und Fetch-SDK; sichere, zur Node-22.13-Baseline passende Patchversion    | MIT                                                             |
| Playwright Test             | 1.61.1                      | reale Browserwege, responsive Layoutprüfung und CI-Artefakte; abgehangene Version außerhalb der Wartefrist | Apache-2.0                                                      |
| axe-core Playwright         | 4.12.1                      | automatisierte WCAG-A-/AA-Prüfung im Browser; unverändertes Testwerkzeug                                   | MPL-2.0                                                         |
| Mailpit                     | 1.30.6                      | ausschließlich lokales SMTP-Testpostfach mit Weboberfläche; keine produktive Laufzeitabhängigkeit          | MIT                                                             |
| Dev Containers Java Image   | Java 21 / Debian Bookworm   | reproduzierbare, temporäre Codespaces-Arbeitsumgebung für API und Web                                      | MIT-Konfiguration; enthaltene Komponenten gemäß Einzel-lizenzen |
| Dev Containers Node Feature | 1 / Node.js 22              | ergänzt die geforderte Node-Laufzeit im Java-Dev-Container                                                 | MIT                                                             |
| PostgreSQL Container Image  | 17.10 / Debian Bookworm     | interne, ausschließlich synthetische Datenbank der temporären Codespaces-Demo                              | PostgreSQL-Lizenz; Image-Komponenten gemäß Einzel-lizenzen      |

Die neu aufgenommenen Mailpit- und PostgreSQL-Containerreferenzen sind zusätzlich zum
lesbaren Versionstag auf den am 3. August 2026 veröffentlichten Multi-Arch-Manifest-
Digest gebunden. Der Dev-Container-Basis-Image-Tag und das offizielle Node-Feature
bleiben durch die Dev-Container-Plattform verwaltet und müssen im Regio-IT-
Freigabeprozess gegen die dortige Image-Allowlist geprüft werden.

GitHub-Actions-Komponenten:

| Komponente               | Version | Gepinnter Commit                           | Bedarf                                                                     | Lizenz     |
| ------------------------ | ------- | ------------------------------------------ | -------------------------------------------------------------------------- | ---------- |
| actions/checkout         | 7.0.1   | `3d3c42e5aac5ba805825da76410c181273ba90b1` | Repository-Inhalt in CI bereitstellen                                      | MIT        |
| actions/setup-node       | 7.0.0   | `820762786026740c76f36085b0efc47a31fe5020` | reproduzierbare Node-22-Laufzeit                                           | MIT        |
| actions/setup-java       | 5.6.0   | `03ad4de0992f5dab5e18fcb136590ce7c4a0ac95` | Temurin 21 und Gradle-Cache                                                | MIT        |
| actions/upload-artifact  | 7.0.1   | `043fb46d1a93c77aae656e7c1c64a875d1fc6a0a` | animierten Qualitätsbericht 30 Tage bereitstellen                          | MIT        |
| dependency-review-action | 5.0.0   | `a1d282b36b6f3519aa1f3fc636f609c47dddb294` | neue Advisories und Lizenzen im PR prüfen                                  | MIT        |
| github/codeql-action     | 4.37.4  | `f205ea1c3313d32999d8d6a48b4f6530d4437b38` | statische Security-Analyse beider Stacks                                   | MIT¹       |
| openai/codex-action      | 1       | `b11346a6fa031e2e164ab4b7c7ea201afffd7d59` | optionale read-only Ursachenanalyse nur bei fehlgeschlagenem Qualitätslauf | Apache-2.0 |

¹ Die Action ist MIT-lizenziert. Nutzung und Verfügbarkeit der enthaltenen
CodeQL-Analyse unterliegen zusätzlich den GitHub-Bedingungen und dem Tarif des
Ziel-Repositories.

Sicherheitsbedingte transitive Overrides:

| Komponente      | Erzwungene Version | Bedarf                                                                  | Lizenz       |
| --------------- | ------------------ | ----------------------------------------------------------------------- | ------------ |
| brace-expansion | 5.0.11             | schließt die gemeldeten Rekursions-DoS-Lücken im ESLint/Minimatch-Pfad  | MIT          |
| js-yaml         | 4.3.2              | schließt die gemeldete Merge-Key-DoS-Lücke in den Tooling-Pfaden        | MIT          |
| nanoid          | 3.3.18             | schließt GHSA-2v37-7h3g-55p8 in den Next.js- und PostCSS-Pfaden         | MIT          |
| postcss         | 8.5.25             | schließt die im Next.js-Buildpfad gemeldete High-Severity-Lücke         | MIT          |
| sharp           | 0.35.5             | schließt die gemeldeten libheif- und librsvg-Lücken im Next.js-Bildpfad | Apache-2.0   |
| source-map-js   | 1.2.2              | schließt die gemeldete Event-Loop-DoS-Lücke im PostCSS-Pfad             | BSD-3-Clause |

Die Overrides bleiben nur so lange bestehen, bis die direkten Upstream-Abhängigkeiten
selbst sichere Versionen auflösen. `sharp` wird zusätzlich mit dem
Next.js-Produktionsbuild und der Bildroute getestet.

`minimatch@3.1.5` erwartet historisch den CommonJS-Default-Export von
`brace-expansion`. Die sichere Major-Version 5.0.11 exportiert stattdessen die Funktion
benannt als `expand`. Der minimale, eingecheckte pnpm-Patch unter `patches/` akzeptiert
beide Exportformen, verändert keine Matching-Logik und ermöglicht so die sichere
Version ohne inkompatiblen ESLint-Lauf. Der Patch wird entfernt, sobald ESLint diese
Legacy-Linie nicht mehr auflöst.

Explizit erlaubte transitive Build-Skripte:

| Komponente    | Version | Herkunft und Bedarf                                                      | Lizenz     |
| ------------- | ------- | ------------------------------------------------------------------------ | ---------- |
| sharp         | 0.35.5  | Transitiv über Next.js; native Bildverarbeitung für `next/image`         | Apache-2.0 |
| unrs-resolver | 1.12.2  | Transitiv über `eslint-config-next`; nativer Import-Resolver für Linting | MIT        |

Für den iOS-Technikspike wurden keine zusätzlichen UI-, CSS-, Telemetrie-, Karten- oder
Authentifizierungsbibliotheken aufgenommen. Capacitor, sein iOS-Ziel und Preferences
bilden ausschließlich die native Hülle und eine kleine lokale Einstellung; die
Fachdaten bleiben in der bestehenden Pilot-API. Die Codespaces-Demo verwendet nur die
offiziellen Dev-Container-Bausteine und das offizielle PostgreSQL-Image; sie sind keine
Anwendungsbibliotheken und keine produktive Betriebsplattform. Die Datenbankbibliotheken sind durch den
freigegebenen persistenten Pilotweg begründet; die neue Pflegeoberfläche verwendet
dieselben bereits geprüften Next.js-, React- und UI-Pakete.

Die Standortvorschau bindet im ausdrücklich gekennzeichneten lokalen Pilot eine Karte
über den offiziellen OpenStreetMap-Embed-Endpunkt ein. Dies ist keine zusätzliche
Programmbibliothek, aber eine externe Laufzeitverbindung. Kartendaten stehen unter der
Open Database License. Anbieterwahl, Auftragsverarbeitung, Content-Security-Policy,
Ausfallverhalten und eine datenschutzrechtliche Freigabe sind vor externer
Bereitstellung noch verbindlich zu entscheiden.

## Bekannte Tooling-Warnung

Der Audit vom 19. Oktober 2026 meldet noch `GHSA-vfj7-8cjw-p6xm` für das ausschließlich
im Lint-Tooling transitiv verwendete `braces@3.0.3`. Der Advisory nennt `3.0.4` als
korrigiert, diese Version ist im npm-Register jedoch noch nicht veröffentlicht. Der
High-Severity-Gate bleibt deshalb bewusst rot und wird weder unterdrückt noch mit einem
ungeprüften Quellcode-Fork umgangen. Nach Veröffentlichung ist der Patch einzuspielen
und der Override-Bedarf erneut zu prüfen.

`pnpm peers check` meldet für `@napi-rs/wasm-runtime` optionale
`@emnapi/core`-/`@emnapi/runtime`-Peers in einer Alpha-Versionsreihe. Die Pfade stammen
transitiv aus Vite/Vitest sowie dem von Next.js verwendeten Import-Resolver. Sie werden
von den nativen macOS-Buildpfaden nicht genutzt; Frozen-Install, Lint, Typprüfung, Tests
und Produktionsbuild sind erfolgreich. Es werden dafür keine unbenötigten
Alpha-Abhängigkeiten direkt aufgenommen. Die Warnung wird bei den vorgesehenen
Dependency-Upgrades erneut bewertet.
