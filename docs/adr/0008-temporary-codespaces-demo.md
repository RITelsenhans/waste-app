# ADR-0008: Zeitlich begrenzte Codespaces-Demo mit Anwendungsschutz

- Status: angenommen
- Datum: 3. August 2026

## Kontext

Für die testfähige Bürgeransicht wird kurzfristig ein per Browser erreichbarer Link
benötigt. Eine freigegebene Regio-IT-Laufzeitplattform, Domain und ein angebundener
Identitätsprovider sind noch nicht benannt. D-030 bleibt das Zielbild: GitHub steuert
eine spätere Bereitstellung, ersetzt aber nicht dauerhaft die Regio-IT-Laufzeit.

GitHub Codespaces kann Web, Spring API und PostgreSQL vorübergehend gemeinsam ausführen
und Port 3000 über einen TLS-Tunnel weiterleiten. Ein öffentlich weitergeleiteter Port
besitzt selbst keine GitHub-Anmeldung. Die lokale Pilotpflege darf wegen ihrer noch
fehlenden Rollen- und Benutzeranmeldung nicht veröffentlicht werden.

## Entscheidung

- GitHub Codespaces ist ausschließlich eine zeitlich begrenzte, nicht produktive
  Fallback-Umgebung für Vorführungen mit synthetischen Daten.
- Der Dev Container verwendet Java 21, Node.js 22, pnpm 11.9 und einen internen
  PostgreSQL-17-Dienst. Nur Port 3000 wird automatisch weitergeleitet.
- `pnpm dev:codespace` aktiviert einen fehlertoleranten, aber sicher geschlossenen
  Freigabemodus. Fehlen `DEMO_ACCESS_PASSWORD` oder `DEMO_SESSION_SECRET`, startet die
  Demo nicht.
- Der erste API-Start darf im Codespace wegen des initial leeren Gradle-Caches bis zu
  zehn Minuten auf Abhängigkeitsauflösung und Kompilierung warten. Der lokale Start
  behält sein zweiminütiges Fehlerzeitfenster; beide Grenzen bleiben per Umgebung
  ausdrücklich überschreibbar.
- Port 3000 veröffentlicht genau die Next.js-Anwendung. Sie leitet `/v1/*` intern an
  Spring Boot weiter. API-Port 8080, PostgreSQL, Mailpit und Port 3001 werden nicht
  veröffentlicht; die Pflegeoberfläche wird nicht gestartet und alle
  `/v1/admin/*`-Endpunkte werden durch die API-Konfiguration deaktiviert.
- Vor allen Seiten und `/v1/*` liegt eine kleine Anwendungsauthentifizierung. Der
  Passwortvergleich verwendet konstante Zeit über mit dem Sitzungsschlüssel erzeugte
  HMAC-SHA-256-Authentikatoren. Nach erfolgreicher
  Anmeldung wird ein HMAC-signiertes Cookie mit `HttpOnly`, `Secure`, `SameSite=Strict`
  und maximal acht Stunden Gültigkeit gesetzt. Abgelaufene oder manipulierte Cookies
  werden abgewiesen. Das gemeinsame Passwort wird getrennt vom Link weitergegeben.
- Der Freigabestart leitet die erwartete öffentliche HTTPS-Origin deterministisch aus
  `CODESPACE_NAME` und Port 3000 ab. Anmeldung, Abmeldung und Weiterleitungen akzeptieren
  primär den nicht durch JavaScript veränderbaren Fetch-Metadata-Wert `Sec-Fetch-Site:
same-origin` und verwenden die explizite Origin als Fallback. `same-site` und
  `cross-site` werden abgewiesen; uneinheitliche Forwarded-Header des GitHub-Tunnels
  sind nicht sicherheitsentscheidend.
- Der normale lokale Befehl `pnpm dev` aktiviert diesen Schutz nicht und behält Web,
  Pflege-Unit, API, PostgreSQL und Mailpit für die lokale Entwicklung bei.
- Es werden keine Authentifizierungsbibliotheken ergänzt; Node.js-Kryptografie und die
  vorhandenen Next.js-Mittel reichen für den abgegrenzten Demo-Zweck aus.

## Folgen

Kolleginnen und Kollegen können den Bürgerweg über einen einzigen HTTPS-Link testen,
ohne Zugriff auf Pflegeoberfläche oder Datenbank zu erhalten. Der Codespace verursacht
laufzeitabhängige GitHub-Kosten, ist an den Besitzer gebunden und besitzt weder
Produktions-SLA noch Backup-, Restore-, Monitoring-, WAF- oder Regio-IT-SSO-Konzept.
Der öffentliche Link ist nur so lange erreichbar, wie der Codespace und der Prozess
laufen. Beim Neustart ist die Portfreigabe erneut zu prüfen.

Vor realen Pilotdaten oder einem dauerhaften Nutzerkreis muss diese Ausnahme durch die
freigegebene Regio-IT-Plattform mit OIDC/Rollen, zentralem Secret Management,
Datenschutz-, Sicherheits- und Betriebsfreigabe ersetzt werden. Eine Einschränkung der
Codespaces-Portsichtbarkeit durch Organisationsrichtlinien kann die öffentliche
Fallbacklösung verhindern; dann ist keine Umgehung vorgesehen.
