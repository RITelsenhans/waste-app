# Geschützte Demo über Railway + Vercel

Diese Anleitung stellt den zugriffsgeschützten Pilot für ausgewählte Kollegen
bereit — ohne Codespaces/Tunnel, auf stabilen Hosts. Sie verwendet
**ausschließlich synthetische Daten** und ist **kein produktives Deployment** und
keine Freigabe für reale kommunale Daten.

## Aufteilung

- **Railway** betreibt die **API** (`services/api`, Spring Boot) und eine
  **PostgreSQL**-Datenbank.
- **Vercel** betreibt die **Bürgeransicht** (`apps/web`, Next.js) mit dem
  eingebauten **Passwort-Gate** davor.
- Die **Pflege-Unit** (`apps/admin`) wird **bewusst nicht** deployt. Sie hat noch
  keine Anmeldung und darf nicht öffentlich erreichbar sein.

Die Bürgeransicht leitet API-Aufrufe serverseitig weiter (`/v1/*` → `API_BASE_URL`),
darum gibt es im Browser kein CORS-Thema.

Diese Deploy-Dateien liegen im Repo und müssen nicht verändert werden:
`infra/containers/api.Dockerfile`, `railway.json`, `apps/web/vercel.json`,
`.dockerignore`.

---

## 0. Zwei Geheimnisse erzeugen

Lokal im Terminal einmal ausführen und die beiden Ausgaben notieren (nicht ins Repo,
nicht in Chats kopieren):

```bash
openssl rand -base64 24   # -> DEMO_ACCESS_PASSWORD (das Passwort für die Tester)
openssl rand -hex 32      # -> DEMO_SESSION_SECRET  (signiert Sitzungen, bleibt geheim)
```

Das erste ist das Test-Passwort (mind. 12 Zeichen), das zweite signiert die
Sitzungen (mind. 32 Zeichen) und wird niemandem weitergegeben.

---

## 1. Railway: API + Datenbank

1. Auf <https://railway.app> anmelden → **New Project** → **Deploy from GitHub repo**
   → Repository `RITelsenhans/waste-app` wählen.
2. Als Branch **`feat/phase1-phase2-functional-pilot`** einstellen
   (Service → **Settings** → **Source** → Branch).
   Railway erkennt `railway.json` und baut automatisch über
   `infra/containers/api.Dockerfile`. Falls Railway einen Node-Build vorschlägt:
   im Service unter **Settings → Build** „Dockerfile" bzw. die vorhandene
   `railway.json` bestätigen.
3. Datenbank hinzufügen: im Projekt **New** → **Database** → **Add PostgreSQL**.
   Der Dienst heißt standardmäßig **Postgres** (Name merken — er wird unten
   referenziert).
4. API-Service → **Variables** öffnen und diese Variablen setzen. Die
   `${{Postgres.*}}`-Referenzen zieht Railway automatisch aus dem Datenbankdienst
   (Servicename ggf. anpassen, falls nicht „Postgres"):

   | Name                         | Wert                                                                                   |
   | ---------------------------- | -------------------------------------------------------------------------------------- |
   | `SPRING_DATASOURCE_URL`      | `jdbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}` |
   | `SPRING_DATASOURCE_USERNAME` | `${{Postgres.PGUSER}}`                                                                 |
   | `SPRING_DATASOURCE_PASSWORD` | `${{Postgres.PGPASSWORD}}`                                                             |
   | `WASTE_PILOT_ADMIN_ENABLED`  | `false`                                                                                |
   | `WASTE_MAIL_ENABLED`         | `false`                                                                                |

   `PORT` setzt Railway selbst; das Dockerfile hört darauf. `WASTE_WEB_ORIGIN`
   kommt in Schritt 3, sobald die Vercel-Adresse bekannt ist.

5. Öffentliche Adresse erzeugen: Service → **Settings** → **Networking** →
   **Generate Domain**. Ergebnis sieht z. B. so aus:
   `https://waste-app-api-production.up.railway.app`. **Diese URL notieren** —
   das ist gleich `API_BASE_URL`.
6. Auf **Deploy** warten. Prüfen: `<Railway-URL>/v1/health/ready` muss `ready`
   liefern; der Healthcheck in `railway.json` zeigt den Status ebenfalls.

---

## 2. Vercel: Bürgeransicht

1. Auf <https://vercel.com> **Add New… → Project** → Repository
   `RITelsenhans/waste-app` importieren.
2. **Root Directory** auf **`apps/web`** setzen (Schaltfläche „Edit" beim
   Import). Build- und Install-Befehle kommen aus `apps/web/vercel.json` und
   müssen nicht angepasst werden (sie installieren/bauen aus der Monorepo-Wurzel).
3. Als **Production Branch** `feat/phase1-phase2-functional-pilot` wählen
   (Project → **Settings → Git**). Node-Version 22 einstellen, falls abgefragt.
4. **Environment Variables** setzen (für „Production"):

   | Name                       | Wert                                       |
   | -------------------------- | ------------------------------------------ |
   | `DEMO_AUTH_REQUIRED`       | `true`                                     |
   | `DEMO_SHARE_MODE`          | `true`                                     |
   | `DEMO_COOKIE_SECURE`       | `true`                                     |
   | `DEMO_ACCESS_PASSWORD`     | _(Ergebnis von `openssl rand -base64 24`)_ |
   | `DEMO_SESSION_SECRET`      | _(Ergebnis von `openssl rand -hex 32`)_    |
   | `API_BASE_URL`             | _(Railway-URL aus Schritt 1.5)_            |
   | `NEXT_PUBLIC_API_BASE_URL` | _(leer lassen)_                            |

5. **Deploy** anstoßen. Nach dem Build zeigt Vercel die Adresse an, z. B.
   `https://waste-app-web.vercel.app`. **Diese URL notieren.**

---

## 3. Die beiden Seiten verbinden

Damit Login-Weiterleitung und CORS sauber sind, jetzt die jeweils andere Adresse
nachtragen:

1. **Vercel** → Variable ergänzen:
   `DEMO_PUBLIC_ORIGIN = https://<deine-vercel-adresse>` → **Redeploy**.
2. **Railway** → Variable ergänzen:
   `WASTE_WEB_ORIGIN = https://<deine-vercel-adresse>` → Railway deployt neu.

---

## 4. Testen und Kollegen einladen

1. Vercel-Adresse im Browser öffnen → es erscheint die **Passwortabfrage**.
2. Mit `DEMO_ACCESS_PASSWORD` anmelden → die Bürgeransicht unter `/demo` lädt.
3. Am Handy prüfen (Android/Apple): dieselbe URL im mobilen Browser reicht — keine
   App-Installation nötig.
4. An die Kollegen gehen **zwei getrennte Nachrichten**: einmal die **URL**, auf
   einem anderen Kanal das **Passwort**. Die Sitzung hält 8 Stunden.

---

## 5. Abbau und Hinweise

- **Beenden:** In Railway den API- und den Postgres-Dienst löschen (oder das ganze
  Projekt), in Vercel das Projekt löschen. Damit ist die Demo offline und es
  entstehen keine weiteren Kosten.
- **Passwort wechseln:** `DEMO_ACCESS_PASSWORD` in Vercel ändern → Redeploy. Alte
  Sitzungen laufen nach spätestens 8 Stunden aus; zum sofortigen Sperren zusätzlich
  `DEMO_SESSION_SECRET` neu erzeugen.
- **Nur synthetische Daten.** Keine echten kommunalen Daten einspielen. Die
  Pflege-Unit (`apps/admin`) bleibt offline; `WASTE_PILOT_ADMIN_ENABLED=false`
  hält auch die Admin-Endpunkte der API aus.
- **PostgreSQL-Version:** Die Migrationen zielen auf PostgreSQL 17. Bietet Railway
  beim Anlegen eine Auswahl, möglichst Version 17 wählen; andernfalls nach dem
  ersten Deploy prüfen, dass die Flyway-Migrationen fehlerfrei durchgelaufen sind
  (Railway-Logs des API-Dienstes).
- **Governance:** Dies ist der zugriffsgeschützte Pilotweg, nicht die abgenommene
  Zielumgebung. Der strategische Zielpfad (SAP BTP Cloud Foundry, OIDC/SSO,
  Rollen, Betrieb) bleibt davon unberührt — siehe Decision Log und ADRs.
