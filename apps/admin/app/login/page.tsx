import { isAdminAuthConfigured, safeAdminReturnTo } from "../../lib/admin-auth";
import styles from "./login.module.css";

type LoginPageProps = {
  searchParams: Promise<{ configuration?: string; error?: string; returnTo?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const parameters = await searchParams;
  const configurationMissing = parameters.configuration === "missing" || !isAdminAuthConfigured();
  const invalidPassword = parameters.error === "invalid";
  const returnTo = safeAdminReturnTo(parameters.returnTo ?? null);

  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="login-title">
        <div className={styles.logo} aria-label="regio iT">
          regio iT
        </div>
        <p className={styles.eyebrow}>Geschützte Pilotverwaltung</p>
        <h1 id="login-title">Abfall APP Admin</h1>
        <p>
          Hier werden ausschließlich synthetische Pilotdaten gepflegt. Verwenden Sie zunächst
          dasselbe Passwort wie für die Bürgeransicht.
        </p>
        {configurationMissing ? (
          <p className={styles.error} role="alert">
            Der Admin-Zugang ist noch nicht vollständig konfiguriert.
          </p>
        ) : (
          <form action="/admin-auth/login" className={styles.form} method="post">
            {invalidPassword && (
              <p className={styles.error} role="alert">
                Das Passwort ist nicht korrekt.
              </p>
            )}
            <input name="returnTo" type="hidden" value={returnTo} />
            <label htmlFor="admin-password">Passwort</label>
            <input
              autoComplete="current-password"
              autoFocus
              id="admin-password"
              name="password"
              required
              type="password"
            />
            <button type="submit">Admin Area öffnen</button>
          </form>
        )}
        <p className={styles.notice}>Zeitlich begrenzter Pilotzugang · Keine Produktivdaten</p>
      </section>
    </main>
  );
}
