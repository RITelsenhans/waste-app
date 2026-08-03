import Image from "next/image";
import { isDemoAuthConfigured, safeDemoReturnTo } from "../../lib/demo-auth";
import styles from "./login.module.css";

type LoginPageProps = {
  searchParams: Promise<{ configuration?: string; error?: string; returnTo?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const parameters = await searchParams;
  const configurationMissing = parameters.configuration === "missing" || !isDemoAuthConfigured();
  const invalidPassword = parameters.error === "invalid";
  const returnTo = safeDemoReturnTo(parameters.returnTo ?? null);

  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="login-title">
        <Image
          alt="regio iT"
          className={styles.logo}
          height={59}
          priority
          src="/regio-it-logo.png"
          width={171}
        />
        <p className={styles.eyebrow}>Geschützte Testumgebung</p>
        <h1 id="login-title">Abfall APP Demo</h1>
        <p>
          Diese Umgebung enthält ausschließlich synthetische Testdaten. Bitte verwenden Sie das für
          die Vorführung bereitgestellte Passwort.
        </p>

        {configurationMissing ? (
          <p className={styles.error} role="alert">
            Der Demo-Zugriff ist noch nicht vollständig konfiguriert. Bitte informieren Sie die
            verantwortliche Person.
          </p>
        ) : (
          <form action="/demo-auth/login" className={styles.form} method="post">
            {invalidPassword && (
              <p className={styles.error} role="alert">
                Das Passwort ist nicht korrekt. Bitte versuchen Sie es erneut.
              </p>
            )}
            <input name="returnTo" type="hidden" value={returnTo} />
            <label htmlFor="demo-password">Passwort</label>
            <input
              autoComplete="current-password"
              autoFocus
              id="demo-password"
              name="password"
              required
              type="password"
            />
            <button type="submit">Demo öffnen</button>
          </form>
        )}
        <p className={styles.notice}>Zeitlich begrenzter Pilotzugang · Keine Produktivdaten</p>
      </section>
    </main>
  );
}
