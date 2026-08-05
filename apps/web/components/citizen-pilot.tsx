"use client";

import type { CSSProperties, FormEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Card, Icon, StatusBadge } from "@waste/ui";
import type { TenantConfig } from "../lib/tenant-config";
import { RecyclingAccessShowcase } from "./recycling-access-showcase";
import { SiteHeader } from "./site-header";
import { WasteSortingShowcase } from "./waste-sorting-showcase";

const API = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(/\/+$/, "");

type Address = { id: string; displayLabel: string };
type Collection = { id: string; wasteTypeLabel: string; effectiveDate: string; status: string };
type GuideEntry = { id: string; name: string; disposalRoute: string; notes: string };
type Site = {
  id: string;
  name: string;
  address: string;
  openingHours: string;
  openNow: boolean;
  latitude: number;
  longitude: number;
};
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

const calendarWeekdays = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function calendarMonths(reference = new Date()) {
  return Array.from(
    { length: 3 },
    (_, offset) => new Date(reference.getFullYear(), reference.getMonth() + offset, 1),
  );
}

function calendarDays(month: Date): Array<number | null> {
  const leadingEmptyDays = (month.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: Array<number | null> = [
    ...Array.from({ length: leadingEmptyDays }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function calendarDateKey(month: Date, day: number) {
  const monthNumber = String(month.getMonth() + 1).padStart(2, "0");
  return `${month.getFullYear()}-${monthNumber}-${String(day).padStart(2, "0")}`;
}

export function CitizenPilot({ config, tenantKey }: { config: TenantConfig; tenantKey: string }) {
  const [addressQuery, setAddressQuery] = useState("");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressSearchCompleted, setAddressSearchCompleted] = useState(false);
  const [address, setAddress] = useState<Address | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [noticesUpdatedAt, setNoticesUpdatedAt] = useState<Date | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [guideQuery, setGuideQuery] = useState("");
  const [guide, setGuide] = useState<GuideEntry[]>([]);
  const [rules, setRules] = useState<Rule | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [lastCase, setLastCase] = useState<CaseCreated | null>(null);
  const [lastNotificationEmail, setLastNotificationEmail] = useState<string | null>(null);
  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [message, setMessage] = useState("Demo-Daten werden geladen …");
  const addressResultsRef = useRef<HTMLDivElement>(null);

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
      setNoticesUpdatedAt(new Date());
      setSlots(nextSlots);
      setMessage(`${selected.displayLabel} ist ausgewählt.`);
    },
    [tenantKey],
  );

  useEffect(() => {
    void Promise.all([
      request<Site[]>(`/v1/sites?tenantId=${tenantKey}`).then((items) => {
        setSites(items);
        setSelectedSiteId((current) => current ?? items[0]?.id ?? null);
      }),
      request<Rule>(`/v1/bulk-waste/rules?tenantId=${tenantKey}`).then(setRules),
      request<Address[]>(`/v1/addresses/search?tenantId=${tenantKey}&q=Demo-Stadt`).then(
        (items) => {
          const stored = localStorage.getItem(`waste-address-${tenantKey}`);
          const selected = stored
            ? (JSON.parse(stored) as Address)
            : (items.find((item) => item.id === "demo-musterstrasse-12") ?? items[0]);
          if (selected) return loadAddressData(selected);
          return undefined;
        },
      ),
    ]).catch((error: Error) => setMessage(error.message));
  }, [loadAddressData, tenantKey]);

  useEffect(() => {
    if (!address) return undefined;
    const interval = window.setInterval(() => {
      const query = new URLSearchParams({ tenantId: tenantKey, addressId: address.id });
      void request<Notice[]>(`/v1/notices?${query}`).then((items) => {
        setNotices(items);
        setNoticesUpdatedAt(new Date());
      });
    }, 10_000);
    return () => window.clearInterval(interval);
  }, [address, tenantKey]);

  const nextCollection = collections[0];
  const selectedSite = sites.find((site) => site.id === selectedSiteId) ?? sites[0];
  const mapUrl = selectedSite
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${selectedSite.longitude - 0.018}%2C${selectedSite.latitude - 0.012}%2C${selectedSite.longitude + 0.018}%2C${selectedSite.latitude + 0.012}&layer=mapnik&marker=${selectedSite.latitude}%2C${selectedSite.longitude}`
    : null;
  const style = {
    "--tenant-primary": config.branding.primaryColor,
    "--tenant-info": config.branding.infoColor,
  } as CSSProperties;

  async function searchAddresses(event: FormEvent) {
    event.preventDefault();
    try {
      const normalized = addressQuery.trim().toLocaleLowerCase("de-DE");
      const query = [config.name, config.shortName]
        .map((value) => value.toLocaleLowerCase("de-DE"))
        .includes(normalized)
        ? config.serviceArea.city
        : addressQuery;
      const items = await request<Address[]>(
        `/v1/addresses/search?tenantId=${tenantKey}&q=${encodeURIComponent(query)}`,
      );
      setAddresses(items);
      setAddressSearchCompleted(true);
      setMessage(
        items.length ? `${items.length} Demo-Adresse(n) gefunden.` : "Keine Demo-Adresse gefunden.",
      );
      window.requestAnimationFrame(() => addressResultsRef.current?.focus());
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  async function refreshNotices() {
    if (!address) return;
    try {
      const query = new URLSearchParams({ tenantId: tenantKey, addressId: address.id });
      setNotices(await request<Notice[]>(`/v1/notices?${query}`));
      setNoticesUpdatedAt(new Date());
      setMessage("Aktuelle Hinweise wurden neu geladen.");
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
      const email = String(data.get("email") ?? "").trim();
      setLastNotificationEmail(email || null);
      setMessage(
        email
          ? `Meldung ${created.reference} wurde angelegt. Die Bestätigung wird an ${email} versendet.`
          : `Meldung ${created.reference} wurde angelegt.`,
      );
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
      setLastNotificationEmail(null);
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
            <Icon className="collection-hero__icon" name="truck" />
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
              <a href="#sortierkompass">
                <span>
                  <Icon name="camera" />
                </span>
                <strong>SortierKompass testen</strong>
                <small>Beispielfoto prüfen</small>
              </a>
              <a href="#meldung">
                <span>
                  <Icon name="warning" />
                </span>
                <strong>Problem melden</strong>
                <small>Formular öffnen</small>
              </a>
              <a href="#sperrmuell">
                <span>
                  <Icon name="truck" />
                </span>
                <strong>Sperrmüll bestellen</strong>
                <small>Termin wählen</small>
              </a>
              {config.enabledFeatures.recyclingAccessShowcase && (
                <a href="#nachtzugang">
                  <span>
                    <Icon name="recycle" />
                  </span>
                  <strong>24/7-Zugang testen</strong>
                  <small>Tor-Simulation starten</small>
                </a>
              )}
            </nav>
          </Card>
        </section>
        <section className="home-section" id="adresse">
          <p className="eyebrow">Adresse</p>
          <h2 className="section-title">
            <span>
              <Icon name="home" />
            </span>
            Für welchen Abholort?
          </h2>
          <form className="search-form" onSubmit={searchAddresses}>
            <label>
              Straße, Hausnummer, Ort oder Postleitzahl
              <input
                value={addressQuery}
                onChange={(event) => setAddressQuery(event.target.value)}
                placeholder={`z. B. Musterstraße 12 oder ${config.serviceArea.city}`}
                minLength={2}
                required
              />
            </label>
            <button type="submit">Suchen</button>
          </form>
          <p className="search-hint">
            Aktuelle Testdaten: <strong>{config.serviceArea.city}</strong>. Sie können auch nach „
            {config.name}“ suchen.
          </p>
          {addressSearchCompleted && (
            <div className="address-results" ref={addressResultsRef} tabIndex={-1}>
              <div className="address-results__head">
                <h3>
                  {addresses.length ? `${addresses.length} Treffer` : "Keine Adresse gefunden"}
                </h3>
                <button type="button" onClick={() => setAddressSearchCompleted(false)}>
                  Schließen
                </button>
              </div>
              <div className="result-list">
                {addresses.map((item) => (
                  <button
                    className={
                      address?.id === item.id ? "result-button is-selected" : "result-button"
                    }
                    key={item.id}
                    onClick={() => {
                      void loadAddressData(item);
                      setAddressSearchCompleted(false);
                      setAddressQuery("");
                    }}
                    type="button"
                  >
                    <Icon name="map-pin" />
                    {item.displayLabel}
                  </button>
                ))}
              </div>
              {addresses.length === 0 && (
                <p>
                  Für diese Kommune sind momentan nur synthetische Adressen in{" "}
                  <strong>{config.serviceArea.city}</strong> hinterlegt.
                </p>
              )}
            </div>
          )}
        </section>
        <section className="home-section" id="kalender">
          <p className="eyebrow">Abfuhrkalender</p>
          <h2 className="section-title">
            <span>
              <Icon name="calendar" />
            </span>
            Die nächsten Termine
          </h2>
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
          <div className="calendar-disclosure">
            <button
              aria-controls="quarter-calendar"
              aria-expanded={calendarOpen}
              className="calendar-toggle"
              onClick={() => setCalendarOpen((open) => !open)}
              type="button"
            >
              <Icon name="calendar" />
              {calendarOpen
                ? "Kalenderansicht schließen"
                : "Kalenderansicht für drei Monate öffnen"}
            </button>
            <p>Optional: alle zukünftigen Abholungen im nächsten Quartal als Kalender.</p>
          </div>
          {calendarOpen && (
            <div className="quarter-calendar" id="quarter-calendar">
              {calendarMonths().map((month) => (
                <section className="calendar-month" key={month.toISOString()}>
                  <h3>
                    {new Intl.DateTimeFormat("de-DE", {
                      month: "long",
                      year: "numeric",
                    }).format(month)}
                  </h3>
                  <div
                    className="calendar-grid"
                    role="grid"
                    aria-label={month.toLocaleDateString("de-DE", {
                      month: "long",
                      year: "numeric",
                    })}
                  >
                    {calendarWeekdays.map((weekday) => (
                      <span className="calendar-weekday" key={weekday} role="columnheader">
                        {weekday}
                      </span>
                    ))}
                    {calendarDays(month).map((day, index) => {
                      if (day === null) {
                        return (
                          <span
                            aria-hidden="true"
                            className="calendar-day is-empty"
                            key={`empty-${index}`}
                          />
                        );
                      }
                      const dateKey = calendarDateKey(month, day);
                      const events = collections.filter((item) => item.effectiveDate === dateKey);
                      return (
                        <article
                          aria-label={`${day}. ${month.toLocaleDateString("de-DE", { month: "long" })}${events.length ? `: ${events.map((item) => item.wasteTypeLabel).join(", ")}` : ": kein Termin"}`}
                          className={events.length ? "calendar-day has-events" : "calendar-day"}
                          key={dateKey}
                          role="gridcell"
                        >
                          <span>{day}</span>
                          {events.map((item) => (
                            <small
                              className={`calendar-event is-${item.status}`}
                              key={item.id}
                              title={item.wasteTypeLabel}
                            >
                              {item.wasteTypeLabel}
                            </small>
                          ))}
                        </article>
                      );
                    })}
                  </div>
                  <ul className="calendar-agenda" aria-label="Termine dieses Monats">
                    {collections
                      .filter((item) => {
                        const date = new Date(`${item.effectiveDate}T12:00:00`);
                        return (
                          date.getFullYear() === month.getFullYear() &&
                          date.getMonth() === month.getMonth()
                        );
                      })
                      .map((item) => (
                        <li key={`agenda-${item.id}`}>
                          <time dateTime={item.effectiveDate}>
                            {formatDate(item.effectiveDate)}
                          </time>
                          <strong>{item.wasteTypeLabel}</strong>
                          {item.status !== "planned" && (
                            <small>{statusLabel[item.status] ?? item.status}</small>
                          )}
                        </li>
                      ))}
                    {collections.every((item) => {
                      const date = new Date(`${item.effectiveDate}T12:00:00`);
                      return (
                        date.getFullYear() !== month.getFullYear() ||
                        date.getMonth() !== month.getMonth()
                      );
                    }) && <li className="is-empty">Keine Abholung in diesem Monat</li>}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </section>
        <WasteSortingShowcase tenantKey={tenantKey} />
        <section className="home-section split-section" id="abfall-abc">
          <Card as="article" className="guide-card">
            <p className="eyebrow">Abfall-ABC</p>
            <h2 className="section-title">
              <span>
                <Icon name="recycle" />
              </span>
              Wohin damit?
            </h2>
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
          <Card as="article" className="updates-card">
            <div className="updates-card__head">
              <div>
                <p className="eyebrow">Aktuelle Hinweise</p>
                <h2 className="section-title">
                  <span>
                    <Icon name="megaphone" />
                  </span>
                  Was ist wichtig?
                </h2>
              </div>
              <button
                className="refresh-button"
                onClick={() => void refreshNotices()}
                type="button"
              >
                Aktualisieren
              </button>
            </div>
            {notices.map((notice) => (
              <article key={notice.id}>
                <h3>{notice.title}</h3>
                <p>{notice.body}</p>
              </article>
            ))}
            {notices.length === 0 && <p>Für Ihre Adresse liegen derzeit keine Hinweise vor.</p>}
            {noticesUpdatedAt && (
              <small className="updated-at">
                Zuletzt aktualisiert:{" "}
                {noticesUpdatedAt.toLocaleTimeString("de-DE", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                Uhr
              </small>
            )}
          </Card>
        </section>
        <section className="home-section" id="standorte">
          <p className="eyebrow">Standorte</p>
          <h2 className="section-title">
            <span>
              <Icon name="map-pin" />
            </span>
            Entsorgungsmöglichkeiten
          </h2>
          <div className="site-explorer">
            <div className="map-panel">
              {mapUrl ? (
                <iframe
                  className="site-map"
                  loading="lazy"
                  src={mapUrl}
                  title={`Karte für ${selectedSite.name}`}
                />
              ) : (
                <div className="site-map site-map--empty">Karte wird geladen …</div>
              )}
              <div className="map-panel__footer">
                <span>
                  <Icon name="info" /> Kartendaten © OpenStreetMap
                </span>
                {selectedSite && (
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${selectedSite.latitude}&mlon=${selectedSite.longitude}#map=16/${selectedSite.latitude}/${selectedSite.longitude}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Große Karte öffnen <Icon name="chevron-right" />
                  </a>
                )}
              </div>
            </div>
            <div className="site-list">
              {sites.map((site, index) => (
                <Card
                  as="article"
                  className={site.id === selectedSite?.id ? "site-card is-selected" : "site-card"}
                  elevation="flat"
                  key={site.id}
                >
                  <span className="site-card__marker" aria-hidden="true">
                    {index + 1}
                  </span>
                  <div>
                    <h3>{site.name}</h3>
                    <p>
                      {site.address}
                      <br />
                      {site.openingHours}
                    </p>
                    <button
                      className="map-select"
                      onClick={() => setSelectedSiteId(site.id)}
                      type="button"
                    >
                      <Icon name="map-pin" /> Auf Karte zeigen
                    </button>
                  </div>
                  <StatusBadge tone={site.openNow ? "success" : "neutral"}>
                    {site.openNow ? "Jetzt geöffnet" : "Geschlossen"}
                  </StatusBadge>
                </Card>
              ))}
            </div>
          </div>
        </section>
        {config.enabledFeatures.recyclingAccessShowcase && (
          <RecyclingAccessShowcase
            site={sites.find((site) => site.id === "site-north") ?? null}
            tenantKey={tenantKey}
          />
        )}
        <section className="home-section form-grid" id="meldung">
          <div>
            <p className="eyebrow">Reklamation</p>
            <h2 className="section-title">
              <span>
                <Icon name="warning" />
              </span>
              Problem melden
            </h2>
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
            <h2 className="section-title">
              <span>
                <Icon name="truck" />
              </span>
              Abholung bestellen
            </h2>
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
            {lastNotificationEmail && (
              <p className="mail-confirmation">
                Die Bestätigung für <strong>{lastNotificationEmail}</strong> finden Sie im{" "}
                <a href="http://localhost:8025" rel="noreferrer" target="_blank">
                  lokalen Testpostfach
                </a>
                .
              </p>
            )}
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
            {config.serviceArea.reportingOffice} · {config.serviceArea.city}
            <br />
            <a href={`tel:${config.serviceArea.phone}`}>{config.serviceArea.phone}</a> ·{" "}
            <a href={`mailto:${config.serviceArea.email}`}>{config.serviceArea.email}</a>
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
          <Icon name="home" />
          Start
        </a>
        <a href="#kalender">
          <Icon name="calendar" />
          Kalender
        </a>
        <a href="#abfall-abc">
          <Icon name="recycle" />
          ABC
        </a>
        <a href="#meldung">
          <Icon name="warning" />
          Melden
        </a>
        <a href="#mehr">
          <Icon name="info" />
          Mehr
        </a>
      </nav>
    </div>
  );
}
