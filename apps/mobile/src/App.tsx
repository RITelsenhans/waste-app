import { Capacitor } from "@capacitor/core";
import {
  AddressNotFoundError,
  getAddressOverview,
  getTenantConfig,
  type AddressOverview,
  type TenantConfig,
} from "@waste/api-client";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { DEFAULT_ADDRESS_QUERY, formatCollectionDate, nextCollection } from "./lib/pilot";
import { loadAddressQuery, saveAddressQuery } from "./lib/preferences";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

type ConnectionState = "connecting" | "offline" | "online";

export function App() {
  const [query, setQuery] = useState(DEFAULT_ADDRESS_QUERY);
  const [tenant, setTenant] = useState<TenantConfig>();
  const [overview, setOverview] = useState<AddressOverview>();
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const [message, setMessage] = useState("Pilot-API wird verbunden …");

  const refresh = useCallback(async (addressQuery: string, persist: boolean) => {
    const normalizedQuery = addressQuery.trim();
    if (normalizedQuery.length < 2) {
      setConnection("offline");
      setMessage("Bitte mindestens zwei Zeichen der Testadresse eingeben.");
      return;
    }

    setConnection("connecting");
    setMessage("Pilot-API wird verbunden …");

    try {
      const [tenantConfig, addressOverview] = await Promise.all([
        getTenantConfig("demo", { apiBaseUrl: API_BASE_URL }),
        getAddressOverview(normalizedQuery, "demo", { apiBaseUrl: API_BASE_URL }),
      ]);
      if (persist) await saveAddressQuery(normalizedQuery);
      setTenant(tenantConfig);
      setOverview(addressOverview);
      setConnection("online");
      setMessage(persist ? "Testadresse gespeichert und synchronisiert." : "Pilot-API verbunden.");
    } catch (error) {
      setOverview(undefined);
      setConnection("offline");
      setMessage(
        error instanceof AddressNotFoundError
          ? "Keine synthetische Pilotadresse gefunden. Beispiel: Musterstraße 12."
          : "Pilot-API derzeit nicht erreichbar. Bitte Internetverbindung prüfen und erneut versuchen.",
      );
    }
  }, []);

  useEffect(() => {
    let active = true;

    void loadAddressQuery().then((savedQuery) => {
      if (!active) return;
      const initialQuery = savedQuery ?? DEFAULT_ADDRESS_QUERY;
      setQuery(initialQuery);
      void refresh(initialQuery, false);
    });

    return () => {
      active = false;
    };
  }, [refresh]);

  const upcoming = useMemo(
    () => (overview ? nextCollection(overview.collections) : undefined),
    [overview],
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void refresh(query, true);
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Abfall App</p>
          <h1>{tenant?.shortName ?? "Aachen"}</h1>
        </div>
        <span className={`connection connection--${connection}`} aria-live="polite">
          <span aria-hidden="true" />
          {connection === "online"
            ? "API verbunden"
            : connection === "connecting"
              ? "Verbinde"
              : "Offline"}
        </span>
      </header>

      <main>
        <section className="pilot-notice" aria-label="Hinweis zum Technikpilot">
          <span aria-hidden="true">◆</span>
          <p>
            <strong>Synthetischer iOS-Technikpilot</strong>
            Keine echten Adress- oder Abfalldaten.
          </p>
        </section>

        <section className="hero-card" aria-labelledby="next-collection-title">
          <p className="section-label" id="next-collection-title">
            Nächste Abholung
          </p>
          {upcoming ? (
            <>
              <p className="collection-date">{formatCollectionDate(upcoming.effectiveDate)}</p>
              <div className="waste-row">
                <span className={`bin-dot bin-dot--${upcoming.wasteTypeId}`} aria-hidden="true" />
                <strong>{upcoming.wasteTypeLabel}</strong>
              </div>
            </>
          ) : (
            <p className="empty-state">
              {connection === "connecting"
                ? "Termine werden geladen …"
                : "Noch kein kommender Termin geladen."}
            </p>
          )}
          <p className="address-label">
            {overview?.address.displayLabel ?? "Musterstraße 12, 52062 Aachen"}
          </p>
        </section>

        <section className="address-card" aria-labelledby="address-title">
          <div>
            <p className="section-label">Lokale Einstellung</p>
            <h2 id="address-title">Pilotadresse</h2>
          </div>
          <form onSubmit={submit}>
            <label htmlFor="address">Straße und Hausnummer</label>
            <div className="input-row">
              <input
                id="address"
                name="address"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                autoComplete="street-address"
                enterKeyHint="done"
              />
              <button type="submit" disabled={connection === "connecting"}>
                Speichern
              </button>
            </div>
          </form>
          <p className={`status-message status-message--${connection}`} aria-live="polite">
            {message}
          </p>
        </section>

        <section className="proof-card" aria-labelledby="proof-title">
          <p className="section-label">Technischer Nachweis</p>
          <h2 id="proof-title">Was hier bereits echt ist</h2>
          <ul>
            <li>installierbare iOS-App-Hülle</li>
            <li>lokal gespeicherte Adressauswahl</li>
            <li>gemeinsamer OpenAPI-Vertrag mit Web und API</li>
          </ul>
        </section>
      </main>

      <footer>
        {Capacitor.isNativePlatform() ? "Native iOS-Hülle" : "Browser-Vorschau"} · Technikspike
      </footer>
    </div>
  );
}
