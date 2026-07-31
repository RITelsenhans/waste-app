"use client";

import type { CSSProperties, FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { Card, StatusBadge } from "@waste/ui";
import type { TenantConfig } from "../lib/tenant-config";
import { SiteHeader } from "./site-header";

const API = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(/\/+$/, "");

type Address = { id: string; displayLabel: string };
type Collection = { id: string; wasteTypeLabel: string; effectiveDate: string; status: string };
type GuideEntry = { id: string; name: string; disposalRoute: string; notes: string };
type Site = { id: string; name: string; address: string; openingHours: string; openNow: boolean };
type Notice = { id: string; title: string; body: string };
type Slot = { id: string; date: string; timeWindow: string; remainingCapacity: number };
type Rule = { preparationInstructions: string; items: { id: string; label: string }[] };
type CaseCreated = { reference: string; accessToken: string; status: string; createdAt: string };
type CaseDetail = {
  reference: string;
  subject: string;
  status: string;
  summary: string;
  events: { publicLabel: string; occurredAt: string }[];
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, options);
  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(problem?.detail ?? `Anfrage fehlgeschlagen (${response.status}).`);
  }
  return response.json() as Promise<T>;
}

const statusLabel: Record<string, string> = {
  planned: "Geplant",
  moved: "Verschoben",
  cancelled: "Entfällt",
  additional: "Zusatztermin",
  received: "Eingegangen",
  "in-review": "In Prüfung",
  "in-progress": "In Bearbeitung",
  completed: "Erledigt",
  closed: "Abgeschlossen",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "long",
  }).format(new Date(`${value}T12:00:00`));
}

export function CitizenPilot({ config, tenantKey }: { config: TenantConfig; tenantKey: string }) {
  const [addressQuery, setAddressQuery] = useState("Muster");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [address, setAddress] = useState<Address | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [guideQuery, setGuideQuery] = useState("");
  const [guide, setGuide] = useState<GuideEntry[]>([]);
  const [rules, setRules] = useState<Rule | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [lastCase, setLastCase] = useState<CaseCreated | null>(null);
  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);
  const [message, setMessage] = useState("Demo-Daten werden geladen …");

  const loadAddressData = useCallback(
    async (selected: Address) => {
      setAddress(selected);
      localStorage.setItem(`waste-address-${tenantKey}`, JSON.stringify(selected));
      const query = new URLSearchParams({ tenantId: tenantKey, addressId: selected.id });
      const [nextCollections, nextNotices, nextSlots] = await Promise.all([
        request<Collection[]>(`/v1/addresses/${selected.id}/collections?tenantId=${tenantKey}`),
        request<Notice[]>(`/v1/notices?${query}`),
        request<Slot[]>(`/v1/bulk-waste/slots?${query}`),
      ]);
      setCollections(nextCollections);
      setNotices(nextNotices);
      setSlots(nextSlots);
      setMessage(`${selected.displayLabel} ist ausgewählt.`);
    },
    [tenantKey],
  );

  useEffect(() => {
    void Promise.all([
      request<Site[]>(`/v1/sites?tenantId=${tenantKey}`).then(setSites),
      request<Rule>(`/v1/bulk-waste/rules?tenantId=${tenantKey}`).then(setRules),
      request<Address[]>(`/v1/addresses/search?tenantId=${tenantKey}&q=Muster`).then((items) => {
        setAddresses(items);
        const stored = localStorage.getItem(`waste-address-${tenantKey}`);
        const selected = stored ? (JSON.parse(stored) as Address) : items[0];
        if (selected) return loadAddressData(selected);
        return undefined;
      }),
    ]).catch((error: Error) => setMessage(error.message));
  }, [loadAddressData, tenantKey]);

  const nextCollection = collections[0];
  const style = {
    "--tenant-primary": config.branding.primaryColor,
    "--tenant-info": config.branding.infoColor,
  } as CSSProperties;

  async function searchAddresses(event: FormEvent) {
    event.preventDefault();
    try {
      const items = await request<Address[]>(
        `/v1/addresses/search?tenantId=${tenantKey}&q=${encodeURIComponent(addressQuery)}`,
      );
      setAddresses(items);
      setMessage(
        items.length ? `${items.length} Demo-Adresse(n) gefunden.` : "Keine Demo-Adresse gefunden.",
      );
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  async function searchGuide(event: FormEvent) {
    event.preventDefault();
    try {
      setGuide(
        await request<GuideEntry[]>(
          `/v1/waste-guide/search?tenantId=${tenantKey}&q=${encodeURIComponent(guideQuery)}`,
        ),
      );
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  async function submitDefect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const files = data
      .getAll("attachments")
      .filter((item): item is File => item instanceof File && item.size > 0);
    try {
      const created = await request<CaseCreated>("/v1/cases/defects", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({
          tenantId: tenantKey,
          category: data.get("category"),
          address: data.get("address"),
          description: data.get("description"),
          occurredAt: new Date(String(data.get("occurredAt"))).toISOString(),
          contactEmail: data.get("email") || null,
          consent: data.get("consent") === "on",
          attachmentNames: files.slice(0, 3).map((file) => file.name),
        }),
      });
      setLastCase(created);
      setMessage(`Meldung ${created.reference} wurde angelegt.`);
      form.reset();
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  async function submitBulk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!address) {
      setMessage("Bitte zuerst eine Adresse auswählen.");
      return;
    }
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const created = await request<CaseCreated>("/v1/bulk-waste/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({
          tenantId: tenantKey,
          addressId: address.id,
          slotId: data.get("slotId"),
          items: [{ itemTypeId: data.get("itemTypeId"), quantity: Number(data.get("quantity")) }],
          contactEmail: data.get("email") || null,
          consent: data.get("consent") === "on",
        }),
      });
      setLastCase(created);
      setMessage(`Sperrmüllauftrag ${created.reference} wurde angelegt.`);
      form.reset();
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  async function loadCase() {
    if (!lastCase) return;
    try {
      setCaseDetail(
        await request<CaseDetail>(
          `/v1/cases/${lastCase.reference}?accessToken=${lastCase.accessToken}`,
        ),
      );
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  return (
    <div className="app-shell" style={style}>
      <SiteHeader addressLabel={address?.displayLabel} config={config} tenantKey={tenantKey} />
      <aside className="demo-banner" id="demo-hinweis">
        <div className="demo-banner__inner">
          <span className="demo-banner__label">Lokaler Pilot</span>
          <p>
            <strong>Hier dürfen Sie wirklich ausprobieren.</strong> Alle Inhalte sind synthetisch;
            Eingaben landen nur in Ihrer lokalen Datenbank.
          </p>
        </div>
      </aside>
      <main id="main-content" tabIndex={-1}>
        <p className="live-message" role="status">
          {message}
        </p>
        <section className="home-hero" aria-labelledby="page-title">
          <Card as="article" className="collection-hero">
            <div className="collection-hero__topline">
              <p className="eyebrow">Nächste Abholung</p>
              <StatusBadge tone="success">
                {nextCollection ? statusLabel[nextCollection.status] : "Adresse wählen"}
              </StatusBadge>
            </div>
            <h1 id="page-title">
              {nextCollection ? formatDate(nextCollection.effectiveDate) : "Ihre Termine"}
            </h1>
            <p className="collection-type">
              {nextCollection?.wasteTypeLabel ?? "Wählen Sie eine Demo-Adresse aus."}
            </p>
            <p className="collection-address">
              {address?.displayLabel ?? "Noch keine Adresse gewählt"}
            </p>
            <a className="button-link" href="#adresse">
              Adresse wechseln
            </a>
          </Card>
          <Card as="aside" className="quick-actions" elevation="flat">
            <p className="eyebrow">Direkt erledigen</p>
            <h2>Was möchten Sie tun?</h2>
            <nav aria-label="Schnellaktionen">
              <a href="#abfall-abc">
                <span>ABC</span>
                <strong>Entsorgungsweg suchen</strong>
                <small>Suche öffnen</small>
              </a>
              <a href="#meldung">
                <span>!</span>
                <strong>Problem melden</strong>
                <small>Formular öffnen</small>
              </a>
              <a href="#sperrmuell">
                <span>SP</span>
                <strong>Sperrmüll bestellen</strong>
                <small>Termin wählen</small>
              </a>
            </nav>
          </Card>
        </section>
        <section className="home-section" id="adresse">
          <p className="eyebrow">Adresse</p>
          <h2>Für welchen Abholort?</h2>
          <form className="search-form" onSubmit={searchAddresses}>
            <label>
              Demo-Straße oder Ort
              <input
                value={addressQuery}
                onChange={(event) => setAddressQuery(event.target.value)}
                minLength={2}
                required
              />
            </label>
            <button type="submit">Suchen</button>
          </form>
          <div className="result-list">
            {addresses.map((item) => (
              <button
                className={address?.id === item.id ? "result-button is-selected" : "result-button"}
                key={item.id}
                onClick={() => void loadAddressData(item)}
                type="button"
              >
                {item.displayLabel}
              </button>
            ))}
          </div>
        </section>
        <section className="home-section" id="kalender">
          <p className="eyebrow">Abfuhrkalender</p>
          <h2>Die nächsten Termine</h2>
          <div className="collection-list">
            {collections.map((item) => (
              <Card as="article" className="collection-card" elevation="flat" key={item.id}>
                <p className="collection-card__weekday">{formatDate(item.effectiveDate)}</p>
                <h3>{item.wasteTypeLabel}</h3>
                <StatusBadge tone={item.status === "moved" ? "warning" : "success"}>
                  {statusLabel[item.status] ?? item.status}
                </StatusBadge>
              </Card>
            ))}
          </div>
        </section>
        <section className="home-section split-section" id="abfall-abc">
          <Card as="article" className="guide-card">
            <p className="eyebrow">Abfall-ABC</p>
            <h2>Wohin damit?</h2>
            <form className="search-form" onSubmit={searchGuide}>
              <label>
                Gegenstand
                <input
                  value={guideQuery}
                  onChange={(event) => setGuideQuery(event.target.value)}
                  placeholder="z. B. Akku"
                  minLength={2}
                  required
                />
              </label>
              <button type="submit">Suchen</button>
            </form>
            <div className="result-stack">
              {guide.map((item) => (
                <article key={item.id}>
                  <h3>{item.name}</h3>
                  <p>
                    <strong>{item.disposalRoute}</strong>
                  </p>
                  <p>{item.notes}</p>
                </article>
              ))}
            </div>
          </Card>
          <Card as="article">
            <p className="eyebrow">Aktuelle Hinweise</p>
            <h2>Was ist wichtig?</h2>
            {notices.map((notice) => (
              <article key={notice.id}>
                <h3>{notice.title}</h3>
                <p>{notice.body}</p>
              </article>
            ))}
          </Card>
        </section>
        <section className="home-section" id="standorte">
          <p className="eyebrow">Standorte</p>
          <h2>Entsorgungsmöglichkeiten</h2>
          <div className="site-list">
            {sites.map((site) => (
              <Card as="article" className="site-card" elevation="flat" key={site.id}>
                <div>
                  <h3>{site.name}</h3>
                  <p>
                    {site.address}
                    <br />
                    {site.openingHours}
                  </p>
                </div>
                <StatusBadge tone={site.openNow ? "success" : "neutral"}>
                  {site.openNow ? "Jetzt geöffnet" : "Geschlossen"}
                </StatusBadge>
              </Card>
            ))}
          </div>
        </section>
        <section className="home-section form-grid" id="meldung">
          <div>
            <p className="eyebrow">Reklamation</p>
            <h2>Problem melden</h2>
            <p>Das Foto wird im Pilot nur ausgewählt und namentlich vermerkt, nicht hochgeladen.</p>
          </div>
          <form className="waste-card waste-card--raised pilot-form" onSubmit={submitDefect}>
            <label>
              Kategorie
              <select name="category" required>
                <option value="bin-not-emptied">Tonne nicht geleert</option>
                <option value="illegal-dumping">Wilde Ablagerung</option>
                <option value="damaged-bin">Behälter beschädigt</option>
              </select>
            </label>
            <label>
              Ort oder Adresse
              <input name="address" defaultValue={address?.displayLabel} minLength={4} required />
            </label>
            <label>
              Zeitpunkt
              <input name="occurredAt" type="datetime-local" required />
            </label>
            <label>
              Beschreibung
              <textarea name="description" minLength={10} maxLength={2000} required />
            </label>
            <label>
              E-Mail (optional)
              <input name="email" type="email" />
            </label>
            <label>
              Fotos auswählen (max. 3)
              <input name="attachments" type="file" accept="image/*" multiple />
            </label>
            <label className="check">
              <input name="consent" type="checkbox" required /> Ich stimme der lokalen
              Demo-Verarbeitung zu.
            </label>
            <button type="submit">Meldung absenden</button>
          </form>
        </section>
        <section className="home-section form-grid" id="sperrmuell">
          <div>
            <p className="eyebrow">Sperrmüll</p>
            <h2>Abholung bestellen</h2>
            <p>{rules?.preparationInstructions}</p>
          </div>
          <form className="waste-card waste-card--raised pilot-form" onSubmit={submitBulk}>
            <label>
              Gegenstand
              <select name="itemTypeId" required>
                {rules?.items.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Anzahl
              <input name="quantity" type="number" min="1" max="10" defaultValue="1" required />
            </label>
            <label>
              Termin
              <select name="slotId" required>
                {slots.map((slot) => (
                  <option value={slot.id} key={slot.id}>
                    {formatDate(slot.date)}, {slot.timeWindow} ({slot.remainingCapacity} frei)
                  </option>
                ))}
              </select>
            </label>
            <label>
              E-Mail (optional)
              <input name="email" type="email" />
            </label>
            <label className="check">
              <input name="consent" type="checkbox" required /> Ich stimme der lokalen
              Demo-Verarbeitung zu.
            </label>
            <button type="submit">Verbindlich im Demo-System bestellen</button>
          </form>
        </section>
        {lastCase && (
          <section className="home-section confirmation" id="vorgang">
            <p className="eyebrow">Bestätigung</p>
            <h2>Ihr Vorgang: {lastCase.reference}</h2>
            <p>Bewahren Sie diese Referenz für den lokalen Test auf.</p>
            <button type="button" onClick={() => void loadCase()}>
              Status abrufen
            </button>
            {caseDetail && (
              <Card>
                <h3>{caseDetail.subject}</h3>
                <p>{caseDetail.summary}</p>
                <ol>
                  {caseDetail.events.map((item) => (
                    <li key={item.occurredAt}>{item.publicLabel}</li>
                  ))}
                </ol>
              </Card>
            )}
          </section>
        )}
      </main>
      <footer className="site-footer" id="mehr">
        <div className="footer-inner">
          <p>
            <strong>{config.name}</strong>
            <br />
            Funktionaler Pilot mit ausschließlich synthetischen Daten
          </p>
          <nav aria-label="Fußnavigation">
            <a href="#demo-hinweis">Hinweise</a>
            <a href="#adresse">Adresse</a>
            <a href="#meldung">Problem melden</a>
          </nav>
        </div>
      </footer>
      <nav className="mobile-nav" aria-label="Mobile Hauptnavigation">
        <a aria-current="page" href={`/${tenantKey}`}>
          Start
        </a>
        <a href="#kalender">Kalender</a>
        <a href="#abfall-abc">ABC</a>
        <a href="#meldung">Melden</a>
        <a href="#mehr">Mehr</a>
      </nav>
    </div>
  );
}
