# ADR-0001: Technologie-Baseline für den Phase-1-Projektstart

- Status: angenommen
- Datum: 30. Juli 2026

## Kontext

Abschnitt 9 verlangt Next.js/App Router mit React und TypeScript sowie eine eigenständige Kotlin/Spring-Boot-API. Konkrete Versionen und das Ziel-JDK waren nicht festgelegt. Lokal stehen Node.js 22.14 und JDK 24 zur Verfügung, aber kein globales Gradle.

## Entscheidung

- Next.js 16.2.12, React/React DOM 19.2.8 und TypeScript 6.0.3. TypeScript 7 wird erst verwendet, wenn die von `eslint-config-next` eingebundene typescript-eslint-Toolchain es unterstützt.
- pnpm 11.9.0 und Node.js ab 22.13.
- Spring Boot 4.1.0, Kotlin 2.4.10 und Gradle Wrapper 9.6.1.
- Kompilierung auf Java-21-Bytecode; Builds dürfen mit kompatiblem JDK 21–26 laufen.
- Gradle Wrapper und pnpm Lockfile sind die reproduzierbaren Einstiegspunkte.

## Folgen

Die Baseline nutzt aktuelle, zueinander kompatible Hauptversionen und benötigt keine globale Gradle-Installation. Vor einer Regio-IT-Betriebsfreigabe müssen Supportfenster, interne Baselines und Security-Scans bestätigt werden. Ein Versionswechsel benötigt Aktualisierung dieses ADRs und vollständige Qualitätsprüfungen.

Gradle wurde innerhalb derselben Hauptversion auf 9.6.1 aktualisiert. Das von
Gradle empfohlene Patch-Release behebt Fehler aus 9.6.0; Lizenz (Apache-2.0),
Ziel-JDK und Anwendungsarchitektur bleiben unverändert.

Kotlin wurde für beide gekoppelten Gradle-Plugins gemeinsam auf das
Fehlerkorrektur-Release 2.4.10 aktualisiert. Spring Boot 4.1 benötigt mindestens
Kotlin 2.2 und richtet die verwalteten Kotlin-Bibliotheken am Plugin aus. Das
seit Kotlin 2.4 stabile Standardverhalten für Annotation-Ziele macht den
bisherigen Opt-in-Compiler-Schalter überflüssig; er wurde entfernt. Das
Kotlin-Gradle-Plugin 2.4.10 garantiert volle Gradle-Kompatibilität derzeit bis
9.5.0; die Kotlin-Dokumentation erlaubt neuere Gradle-Versionen mit dem Hinweis
auf mögliche Warnungen oder noch nicht unterstützte neue Funktionen. Die
Kombination mit Gradle 9.6.1 wird deshalb durch die vollständigen lokalen und
CI-Qualitätsprüfungen abgesichert und beim nächsten Kotlin- oder Gradle-Update
erneut bewertet.
