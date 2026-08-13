# Abfall APP – API-Container für den Pilot (Railway)
#
# Baut services/api (Kotlin/Spring Boot) als ausführbaren Boot-Jar und startet
# ihn auf dem von Railway vorgegebenen Port ($PORT). Enthält keine Daten und
# ist nur für den zugriffsgeschützten Pilot mit synthetischen Daten gedacht.
#
# Build-Kontext ist das Repository-Wurzelverzeichnis (Gradle-Multiprojekt).

# --- Build-Stufe -----------------------------------------------------------
FROM gradle:9.6.1-jdk21 AS build
WORKDIR /src

# Gesamtes Monorepo kopieren (Gradle braucht settings + Wrapper + Modul).
COPY . .

# Nur den API-Boot-Jar bauen. Das offizielle Image enthält die zum Wrapper
# passende Gradle-Version bereits; Railway muss sie nicht separat laden.
RUN gradle --no-daemon :services:api:bootJar \
 && cp "$(ls services/api/build/libs/*.jar | grep -v -- '-plain' | head -n1)" /app.jar

# --- Laufzeit-Stufe --------------------------------------------------------
FROM eclipse-temurin:21-jre
WORKDIR /app

# Nicht als root laufen.
RUN useradd --system --uid 10001 appuser
COPY --from=build /app.jar app.jar
USER appuser

# Railway/Cloud injiziert $PORT; lokal fällt es auf 8080 zurück.
ENV JAVA_OPTS=""
EXPOSE 8080
CMD ["sh", "-c", "java $JAVA_OPTS -jar app.jar --server.port=${PORT:-8080}"]
