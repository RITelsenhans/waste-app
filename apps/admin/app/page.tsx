"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Card, Icon, StatusBadge } from "@waste/ui";
import { ContentManager } from "../components/content-manager";
import { MunicipalityCustomization } from "../components/municipality-customization";
import { nextStatus, type CaseTransition } from "../lib/case-status";

const API = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(/\/+$/, "");
type Case = {
  reference: string;
  caseType: string;
  subject: string;
  status: string;
  summary: string;
  updatedAt: string;
};
type Address = { id: string; displayLabel: string };
type Workspace = "create" | "manage" | "cases" | "municipality";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, options);
  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(problem?.detail ?? `Anfrage fehlgeschlagen (${response.status}).`);
  }
  return response.json() as Promise<T>;
}

function values(form: HTMLFormElement) {
  return new FormData(form);
}

export default function AdminPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [contentRevision, setContentRevision] = useState(0);
  const [workspace, setWorkspace] = useState<Workspace>("create");
  const [message, setMessage] = useState("Bereit für synthetische Eingaben.");

  async function loadCases() {
    try {
      setCases(await request<Case[]>("/v1/admin/cases?tenantId=demo"));
    } catch (error) {
      setMessage((error as Error).message);
    }
  }
  useEffect(() => {
    void Promise.all([
      request<Case[]>("/v1/admin/cases?tenantId=demo").then(setCases),
      request<Address[]>("/v1/addresses/search?tenantId=demo&q=Demo-Stadt").then(setAddresses),
    ]).catch((error: Error) => setMessage(error.message));
  }, []);

  async function submit(path: string, payload: object, form: HTMLFormElement) {
    try {
      await request(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setMessage("Eintrag wurde gespeichert und ist sofort in der Bürgeransicht sichtbar.");
      setContentRevision((current) => current + 1);
      form.reset();
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  async function collection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = values(event.currentTarget);
    await submit(
      "/v1/admin/collections",
      {
        tenantId: "demo",
        addressId: data.get("addressId"),
        wasteTypeId: data.get("wasteTypeId"),
        wasteTypeLabel: data.get("wasteTypeLabel"),
        plannedDate: data.get("plannedDate"),
        effectiveDate: data.get("effectiveDate"),
        status: data.get("status"),
      },
      event.currentTarget,
    );
  }
  async function guide(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = values(event.currentTarget);
    await submit(
      "/v1/admin/waste-guide",
      {
        tenantId: "demo",
        name: data.get("name"),
        category: data.get("category"),
        disposalRoute: data.get("disposalRoute"),
        notes: data.get("notes"),
        synonyms: String(data.get("synonyms"))
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      },
      event.currentTarget,
    );
  }
  async function site(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = values(event.currentTarget);
    await submit(
      "/v1/admin/sites",
      {
        tenantId: "demo",
        name: data.get("name"),
        siteType: data.get("siteType"),
        address: data.get("address"),
        openingHours: data.get("openingHours"),
        acceptedWasteTypes: String(data.get("acceptedWasteTypes"))
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        openNow: data.get("openNow") === "on",
        latitude: Number(data.get("latitude")),
        longitude: Number(data.get("longitude")),
      },
      event.currentTarget,
    );
  }
  async function notice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = values(event.currentTarget);
    await submit(
      "/v1/admin/notices",
      {
        tenantId: "demo",
        addressId: data.get("addressId") || null,
        noticeType: data.get("noticeType"),
        title: data.get("title"),
        body: data.get("body"),
        priority: data.get("priority"),
        validFrom: new Date(String(data.get("validFrom"))).toISOString(),
        validUntil: new Date(String(data.get("validUntil"))).toISOString(),
      },
      event.currentTarget,
    );
  }
  async function changeStatus(reference: string, transition: CaseTransition) {
    try {
      await request(`/v1/admin/cases/${reference}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: transition.status,
          publicLabel: transition.publicLabel,
        }),
      });
      setMessage(`Status von ${reference} wurde aktualisiert.`);
      await loadCases();
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  return (
    <main>
      <header>
        <div className="brand">
          <span>regio iT</span>
          <div>
            <strong>Abfall Pilotpflege</strong>
            <small>Demo Kommune</small>
          </div>
        </div>
        <a href="http://localhost:3000/demo">Bürgeransicht öffnen</a>
      </header>
      <aside>
        <strong>Nur lokal · keine Anmeldung</strong> Diese Pflegeoberfläche ist ausschließlich für
        synthetische Testdaten vorgesehen und darf nicht öffentlich betrieben werden.
      </aside>
      <p className="status" role="status">
        {message}
      </p>
      <section>
        <p className="eyebrow">Eingabe-Unit</p>
        <h1>
          <Icon name="sparkles" />
          Kommunale Daten pflegen
        </h1>
        <p>
          Termine, Entsorgungswege, Standorte und Hinweise werden hier getrennt von der
          Bürgeransicht erfasst.
        </p>
        <nav className="workspace-tabs" aria-label="Arbeitsbereiche">
          <button aria-pressed={workspace === "create"} onClick={() => setWorkspace("create")}>
            <Icon name="sparkles" /> Neu anlegen
          </button>
          <button aria-pressed={workspace === "manage"} onClick={() => setWorkspace("manage")}>
            <Icon name="calendar" /> Bestand bearbeiten
          </button>
          <button aria-pressed={workspace === "cases"} onClick={() => setWorkspace("cases")}>
            <Icon name="warning" /> Vorgänge
          </button>
          <button
            aria-pressed={workspace === "municipality"}
            onClick={() => setWorkspace("municipality")}
          >
            <Icon name="map-pin" /> Kommune
          </button>
        </nav>
      </section>
      {workspace === "create" && (
        <div className="form-grid">
          <form className="waste-card waste-card--raised" id="termine" onSubmit={collection}>
            <h2>
              <span className="form-icon">
                <Icon name="calendar" />
              </span>
              Abfuhrtermin
            </h2>
            <label>
              Adresse
              <select name="addressId" required>
                {addresses.length === 0 && <option value="">Adressen werden geladen …</option>}
                {addresses.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.displayLabel}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Abfallart-ID
              <input name="wasteTypeId" defaultValue="restabfall" required />
            </label>
            <label>
              Bezeichnung
              <input name="wasteTypeLabel" defaultValue="Restabfall" minLength={2} required />
            </label>
            <label>
              Geplantes Datum
              <input name="plannedDate" type="date" required />
            </label>
            <label>
              Tatsächliches Datum
              <input name="effectiveDate" type="date" required />
            </label>
            <label>
              Status
              <select name="status">
                <option value="planned">Geplant</option>
                <option value="moved">Verschoben</option>
                <option value="cancelled">Entfällt</option>
                <option value="additional">Zusatztermin</option>
              </select>
            </label>
            <button>Termin speichern</button>
          </form>
          <form className="waste-card waste-card--raised" id="abc" onSubmit={guide}>
            <h2>
              <span className="form-icon">
                <Icon name="recycle" />
              </span>
              Abfall-ABC
            </h2>
            <label>
              Begriff
              <input name="name" minLength={2} required />
            </label>
            <label>
              Kategorie
              <input name="category" minLength={2} required />
            </label>
            <label>
              Entsorgungsweg
              <textarea name="disposalRoute" minLength={2} required />
            </label>
            <label>
              Hinweise
              <textarea name="notes" />
            </label>
            <label>
              Synonyme, komma-getrennt
              <input name="synonyms" />
            </label>
            <button>ABC-Eintrag speichern</button>
          </form>
          <form className="waste-card waste-card--raised" id="orte" onSubmit={site}>
            <h2>
              <span className="form-icon">
                <Icon name="map-pin" />
              </span>
              Standort
            </h2>
            <label>
              Name
              <input name="name" minLength={2} required />
            </label>
            <label>
              Typ
              <input name="siteType" defaultValue="recycling_center" required />
            </label>
            <label>
              Adresse
              <input name="address" required />
            </label>
            <label>
              Öffnungszeiten
              <input name="openingHours" required />
            </label>
            <label>
              Abfallarten, komma-getrennt
              <input name="acceptedWasteTypes" required />
            </label>
            <div className="coordinate-grid">
              <label>
                Breitengrad
                <input
                  name="latitude"
                  type="number"
                  step="0.000001"
                  defaultValue="50.775346"
                  required
                />
              </label>
              <label>
                Längengrad
                <input
                  name="longitude"
                  type="number"
                  step="0.000001"
                  defaultValue="6.083887"
                  required
                />
              </label>
            </div>
            <label className="check">
              <input name="openNow" type="checkbox" /> Im Demo-Zeitpunkt geöffnet
            </label>
            <button>Standort speichern</button>
          </form>
          <form className="waste-card waste-card--raised" id="hinweise" onSubmit={notice}>
            <h2>
              <span className="form-icon">
                <Icon name="megaphone" />
              </span>
              Hinweis
            </h2>
            <label>
              Titel
              <input name="title" minLength={3} required />
            </label>
            <label>
              Text
              <textarea name="body" minLength={3} required />
            </label>
            <label>
              Typ
              <input name="noticeType" defaultValue="service" required />
            </label>
            <label>
              Priorität
              <select name="priority">
                <option value="info">Information</option>
                <option value="warning">Warnung</option>
                <option value="critical">Kritisch</option>
              </select>
            </label>
            <label>
              Nur für Adresse (optional)
              <select name="addressId" defaultValue="">
                <option value="">Alle Adressen</option>
                {addresses.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.displayLabel}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Gültig ab
              <input name="validFrom" type="datetime-local" required />
            </label>
            <label>
              Gültig bis
              <input name="validUntil" type="datetime-local" required />
            </label>
            <button>Hinweis veröffentlichen</button>
          </form>
        </div>
      )}
      {workspace === "manage" && (
        <ContentManager key={contentRevision} addresses={addresses} onMessage={setMessage} />
      )}
      {workspace === "municipality" && <MunicipalityCustomization onMessage={setMessage} />}
      {workspace === "cases" && (
        <section id="vorgaenge">
          <div className="section-head">
            <div>
              <p className="eyebrow">Bearbeitung</p>
              <h2>
                <span className="form-icon">
                  <Icon name="warning" />
                </span>
                Reklamationen und Aufträge
              </h2>
            </div>
            <button onClick={() => void loadCases()}>Aktualisieren</button>
          </div>
          <div className="case-list">
            {cases.length === 0 && (
              <p>Noch keine Vorgänge vorhanden. Legen Sie einen in der Bürgeransicht an.</p>
            )}
            {cases.map((item) => (
              <Card as="article" key={item.reference}>
                <div>
                  <StatusBadge
                    tone={
                      item.status === "completed" || item.status === "closed" ? "success" : "info"
                    }
                  >
                    {item.status}
                  </StatusBadge>
                  <h3>{item.subject}</h3>
                  <p>
                    {item.reference} · {item.summary}
                  </p>
                </div>
                <div className="case-actions">
                  {nextStatus[item.status] ? (
                    <button
                      onClick={() => void changeStatus(item.reference, nextStatus[item.status])}
                    >
                      {nextStatus[item.status].label}
                    </button>
                  ) : (
                    <span>Kein weiterer Pilotstatus</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
