"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { Icon, StatusBadge } from "@waste/ui";

const API = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(/\/+$/, "");

type Address = { id: string; displayLabel: string };
type Collection = {
  id: string;
  addressId: string;
  wasteTypeId: string;
  wasteTypeLabel: string;
  plannedDate: string;
  effectiveDate: string;
  status: string;
};
type GuideEntry = {
  id: string;
  name: string;
  category: string;
  disposalRoute: string;
  notes: string;
  synonyms: string[];
};
type Site = {
  id: string;
  name: string;
  siteType: string;
  address: string;
  openingHours: string;
  acceptedWasteTypes: string[];
  openNow: boolean;
  latitude: number;
  longitude: number;
};
type Notice = {
  id: string;
  addressId: string | null;
  noticeType: string;
  title: string;
  body: string;
  priority: string;
  validFrom: string;
  validUntil: string;
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, options);
  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(problem?.detail ?? `Anfrage fehlgeschlagen (${response.status}).`);
  }
  return (response.status === 204 ? undefined : await response.json()) as T;
}

function data(form: HTMLFormElement) {
  return new FormData(form);
}

function values(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function localDateTime(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function ContentManager({
  addresses,
  onMessage,
}: {
  addresses: Address[];
  onMessage: (message: string) => void;
}) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [guide, setGuide] = useState<GuideEntry[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);

  const load = useCallback(async () => {
    try {
      const [nextCollections, nextGuide, nextSites, nextNotices] = await Promise.all([
        request<Collection[]>("/v1/admin/collections?tenantId=demo"),
        request<GuideEntry[]>("/v1/admin/waste-guide?tenantId=demo"),
        request<Site[]>("/v1/admin/sites?tenantId=demo"),
        request<Notice[]>("/v1/admin/notices?tenantId=demo"),
      ]);
      setCollections(nextCollections);
      setGuide(nextGuide);
      setSites(nextSites);
      setNotices(nextNotices);
    } catch (error) {
      onMessage((error as Error).message);
    }
  }, [onMessage]);

  useEffect(() => {
    void Promise.all([
      request<Collection[]>("/v1/admin/collections?tenantId=demo"),
      request<GuideEntry[]>("/v1/admin/waste-guide?tenantId=demo"),
      request<Site[]>("/v1/admin/sites?tenantId=demo"),
      request<Notice[]>("/v1/admin/notices?tenantId=demo"),
    ])
      .then(([nextCollections, nextGuide, nextSites, nextNotices]) => {
        setCollections(nextCollections);
        setGuide(nextGuide);
        setSites(nextSites);
        setNotices(nextNotices);
      })
      .catch((error: Error) => onMessage(error.message));
  }, [onMessage]);

  async function save(path: string, id: string, payload: object) {
    try {
      await request(`${path}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      onMessage("Änderung wurde gespeichert und ist in der Bürgeransicht abrufbar.");
      await load();
    } catch (error) {
      onMessage((error as Error).message);
    }
  }

  async function remove(path: string, id: string, label: string) {
    if (!window.confirm(`„${label}“ wirklich aus dem lokalen Pilotbestand löschen?`)) return;
    try {
      await request<void>(`${path}/${id}?tenantId=demo`, { method: "DELETE" });
      onMessage(`„${label}“ wurde gelöscht.`);
      await load();
    } catch (error) {
      onMessage((error as Error).message);
    }
  }

  return (
    <section className="content-manager" id="bestand">
      <p className="eyebrow">Bestand verwalten</p>
      <h2>
        <span className="form-icon">
          <Icon name="sparkles" />
        </span>
        Vorhandene Einträge ändern oder löschen
      </h2>
      <p>
        Aufklappen, Werte korrigieren und speichern. Abgelaufene Hinweise bleiben hier sichtbar.
      </p>

      <details>
        <summary>
          Hinweise <span>{notices.length}</span>
        </summary>
        <div className="editable-list">
          {notices.map((item) => (
            <form
              key={item.id}
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                const form = data(event.currentTarget);
                void save("/v1/admin/notices", item.id, {
                  tenantId: "demo",
                  addressId: form.get("addressId") || null,
                  noticeType: form.get("noticeType"),
                  title: form.get("title"),
                  body: form.get("body"),
                  priority: form.get("priority"),
                  validFrom: new Date(String(form.get("validFrom"))).toISOString(),
                  validUntil: new Date(String(form.get("validUntil"))).toISOString(),
                });
              }}
            >
              <div className="editable-list__title">
                <strong>{item.title}</strong>
                <StatusBadge tone={new Date(item.validUntil) < new Date() ? "neutral" : "info"}>
                  {new Date(item.validUntil) < new Date() ? "Abgelaufen" : "Aktiv/künftig"}
                </StatusBadge>
              </div>
              <label>
                Titel
                <input name="title" defaultValue={item.title} required />
              </label>
              <label>
                Text
                <textarea name="body" defaultValue={item.body} required />
              </label>
              <div className="edit-grid">
                <label>
                  Typ
                  <input name="noticeType" defaultValue={item.noticeType} required />
                </label>
                <label>
                  Priorität
                  <select name="priority" defaultValue={item.priority}>
                    <option value="info">Information</option>
                    <option value="warning">Warnung</option>
                    <option value="critical">Kritisch</option>
                  </select>
                </label>
                <label>
                  Nur für Adresse
                  <select name="addressId" defaultValue={item.addressId ?? ""}>
                    <option value="">Alle Adressen</option>
                    {addresses.map((address) => (
                      <option key={address.id} value={address.id}>
                        {address.displayLabel}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Gültig ab
                  <input
                    name="validFrom"
                    type="datetime-local"
                    defaultValue={localDateTime(item.validFrom)}
                    required
                  />
                </label>
                <label>
                  Gültig bis
                  <input
                    name="validUntil"
                    type="datetime-local"
                    defaultValue={localDateTime(item.validUntil)}
                    required
                  />
                </label>
              </div>
              <div className="edit-actions">
                <button type="submit">Änderungen speichern</button>
                <button
                  className="danger-button"
                  type="button"
                  onClick={() => void remove("/v1/admin/notices", item.id, item.title)}
                >
                  Löschen
                </button>
              </div>
            </form>
          ))}
        </div>
      </details>

      <details>
        <summary>
          Abfuhrtermine <span>{collections.length}</span>
        </summary>
        <div className="editable-list">
          {collections.map((item) => (
            <form
              key={item.id}
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                const form = data(event.currentTarget);
                void save("/v1/admin/collections", item.id, {
                  tenantId: "demo",
                  addressId: form.get("addressId"),
                  wasteTypeId: form.get("wasteTypeId"),
                  wasteTypeLabel: form.get("wasteTypeLabel"),
                  plannedDate: form.get("plannedDate"),
                  effectiveDate: form.get("effectiveDate"),
                  status: form.get("status"),
                });
              }}
            >
              <strong>
                {item.wasteTypeLabel} · {item.effectiveDate}
              </strong>
              <div className="edit-grid">
                <label>
                  Adresse
                  <select name="addressId" defaultValue={item.addressId}>
                    {addresses.map((address) => (
                      <option key={address.id} value={address.id}>
                        {address.displayLabel}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Abfallart-ID
                  <input name="wasteTypeId" defaultValue={item.wasteTypeId} required />
                </label>
                <label>
                  Bezeichnung
                  <input name="wasteTypeLabel" defaultValue={item.wasteTypeLabel} required />
                </label>
                <label>
                  Geplant
                  <input name="plannedDate" type="date" defaultValue={item.plannedDate} required />
                </label>
                <label>
                  Tatsächlich
                  <input
                    name="effectiveDate"
                    type="date"
                    defaultValue={item.effectiveDate}
                    required
                  />
                </label>
                <label>
                  Status
                  <select name="status" defaultValue={item.status}>
                    <option value="planned">Geplant</option>
                    <option value="moved">Verschoben</option>
                    <option value="cancelled">Entfällt</option>
                    <option value="additional">Zusatztermin</option>
                  </select>
                </label>
              </div>
              <div className="edit-actions">
                <button type="submit">Änderungen speichern</button>
                <button
                  className="danger-button"
                  type="button"
                  onClick={() => void remove("/v1/admin/collections", item.id, item.wasteTypeLabel)}
                >
                  Löschen
                </button>
              </div>
            </form>
          ))}
        </div>
      </details>

      <details>
        <summary>
          Abfall-ABC <span>{guide.length}</span>
        </summary>
        <div className="editable-list">
          {guide.map((item) => (
            <form
              key={item.id}
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                const form = data(event.currentTarget);
                void save("/v1/admin/waste-guide", item.id, {
                  tenantId: "demo",
                  name: form.get("name"),
                  category: form.get("category"),
                  disposalRoute: form.get("disposalRoute"),
                  notes: form.get("notes"),
                  synonyms: values(form.get("synonyms")),
                });
              }}
            >
              <strong>{item.name}</strong>
              <div className="edit-grid">
                <label>
                  Begriff
                  <input name="name" defaultValue={item.name} required />
                </label>
                <label>
                  Kategorie
                  <input name="category" defaultValue={item.category} required />
                </label>
              </div>
              <label>
                Entsorgungsweg
                <textarea name="disposalRoute" defaultValue={item.disposalRoute} required />
              </label>
              <label>
                Hinweise
                <textarea name="notes" defaultValue={item.notes} />
              </label>
              <label>
                Synonyme
                <input name="synonyms" defaultValue={item.synonyms.join(", ")} />
              </label>
              <div className="edit-actions">
                <button type="submit">Änderungen speichern</button>
                <button
                  className="danger-button"
                  type="button"
                  onClick={() => void remove("/v1/admin/waste-guide", item.id, item.name)}
                >
                  Löschen
                </button>
              </div>
            </form>
          ))}
        </div>
      </details>

      <details>
        <summary>
          Standorte <span>{sites.length}</span>
        </summary>
        <div className="editable-list">
          {sites.map((item) => (
            <form
              key={item.id}
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                const form = data(event.currentTarget);
                void save("/v1/admin/sites", item.id, {
                  tenantId: "demo",
                  name: form.get("name"),
                  siteType: form.get("siteType"),
                  address: form.get("address"),
                  openingHours: form.get("openingHours"),
                  acceptedWasteTypes: values(form.get("acceptedWasteTypes")),
                  openNow: form.get("openNow") === "on",
                  latitude: Number(form.get("latitude")),
                  longitude: Number(form.get("longitude")),
                });
              }}
            >
              <strong>{item.name}</strong>
              <div className="edit-grid">
                <label>
                  Name
                  <input name="name" defaultValue={item.name} required />
                </label>
                <label>
                  Typ
                  <input name="siteType" defaultValue={item.siteType} required />
                </label>
                <label>
                  Adresse
                  <input name="address" defaultValue={item.address} required />
                </label>
                <label>
                  Öffnungszeiten
                  <input name="openingHours" defaultValue={item.openingHours} required />
                </label>
                <label>
                  Breitengrad
                  <input
                    name="latitude"
                    type="number"
                    step="0.000001"
                    defaultValue={item.latitude}
                    required
                  />
                </label>
                <label>
                  Längengrad
                  <input
                    name="longitude"
                    type="number"
                    step="0.000001"
                    defaultValue={item.longitude}
                    required
                  />
                </label>
              </div>
              <label>
                Abfallarten
                <input
                  name="acceptedWasteTypes"
                  defaultValue={item.acceptedWasteTypes.join(", ")}
                  required
                />
              </label>
              <label className="check">
                <input name="openNow" type="checkbox" defaultChecked={item.openNow} /> Im
                Demo-Zeitpunkt geöffnet
              </label>
              <div className="edit-actions">
                <button type="submit">Änderungen speichern</button>
                <button
                  className="danger-button"
                  type="button"
                  onClick={() => void remove("/v1/admin/sites", item.id, item.name)}
                >
                  Löschen
                </button>
              </div>
            </form>
          ))}
        </div>
      </details>
    </section>
  );
}
