import styles from "./demo-session-control.module.css";

export function DemoSessionControl() {
  return (
    <aside className={styles.bar} aria-label="Demo-Sitzung">
      <span>Geschützte Demo · synthetische Testdaten</span>
      <form action="/demo-auth/logout" method="post">
        <button type="submit">Abmelden</button>
      </form>
    </aside>
  );
}
