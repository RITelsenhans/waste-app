"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { Icon, StatusBadge } from "@waste/ui";
import { adminRequest } from "../lib/admin-api";

type Address = { id: string; displayLabel: string };
type Publication = {
  publicationStatus: "draft" | "published";
  publicationUpdatedAt: string;
};
type Collection = {
  id: string;
  addressId: string;
  wasteTypeId: string;
  wasteTypeLabel: string;
  plannedDate: string;
  effectiveDate: string;
  status: string;
} & Publication;
type GuideEntry = {
  id: string;
  name: string;
  category: string;
  disposalRoute: string;
  notes: string;
  synonyms: string[];
} & Publication;
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
} & Publication;
type Notice = {
  id: string;
  addressId: string | null;
  noticeType: string;
  title: string;
  body: string;
  priority: string;
  validFrom: string;
  validUntil: string;
} & Publication;

function PublicationEditor({ status }: { status: Publication["publicationStatus"] }) {
  return (
    <label>
      Freigabe
      <select name="publicationStatus" defaultValue={status}>
        <option value="draft">Entwurf – nicht öffentlich</option>
        <option value="published">Veröffentlicht</option>
      </select>
    </label>
  );
}

function PublicationBadge({ status }: { status: Publication["publicationStatus"] }) {
  return (
    <StatusBadge tone={status === "published" ? "success" : "warning"}>
      {status === "published" ? "Veröffentlicht" : "Entwurf"}
    </StatusBadge>
  );
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
  tenantId,
}: {
  addresses: Address[];
  onMessage: (message: string) => void;
  tenantId: string;
}) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [guide, setGuide] = useState<GuideEntry[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);

  const load = useCallback(async () => {
    try {
      const [nextCollections, nextGuide, nextSites, nextNotices] = await Promise.all([
        adminRequest<Collection[]>(
          `/v1/admin/collections?tenantId=${encodeURIComponent(tenantId)}`,
        ),
        adminRequest<GuideEntry[]>(
          `/v1/admin/waste-guide?tenantId=${encodeURIComponent(tenantId)}`,
        ),
        adminRequest<Site[]>(`/v1/admin/sites?tenantId=${encodeURIComponent(tenantId)}`),
        adminRequest<Notice[]>(`/v1/admin/notices?tenantId=${encodeURIComponent(tenantId)}`),
      ]);
      setCollections(nextCollections);
      setGuide(nextGuide);
      setSites(nextSites);
      setNotices(nextNotices);
    } catch (error) {
      onMessage((error as Error).message);
    }
  }, [onMessage, tenantId]);

  useEffect(() => {
    void Promise.all([
      adminRequest<Collection[]>(`/v1/admin/collections?tenantId=${encodeURIComponent(tenantId)}`),
      adminRequest<GuideEntry[]>(`/v1/admin/waste-guide?tenantId=${encodeURIComponent(tenantId)}`),
      adminRequest<Site[]>(`/v1/admin/sites?tenantId=${encodeURIComponent(tenantId)}`),
      adminRequest<Notice[]>(`/v1/admin/notices?tenantId=${encodeURIComponent(tenantId)}`),
    ])
      .then(([nextCollections, nextGuide, nextSites, nextNotices]) => {
        setCollections(nextCollections);
        setGuide(nextGuide);
        setSites(nextSites);
        setNotices(nextNotices);
      })
      .catch((error: Error) => onMessage(error.message));
  }, [onMessage, tenantId]);

  async function save(path: string, id: string, payload: object) {
    try {
      await adminRequest(`${path}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const status = (payload as { publicationStatus?: string }).publicationStatus;
      onMessage(
        status === "published"
          ? "Änderung wurde veröffentlicht und ist in der Bürgeransicht abrufbar."
          : "Änderung wurde als Entwurf gespeichert und ist nicht öffentlich sichtbar.",
      );
      await load();
    } catch (error) {
      onMessage((error as Error).message);
    }
  }

  async function remove(path: string, id: string, label: string) {
    if (!window.confirm(`„${label}“ wirklich aus dem lokalen Pilotbestand löschen?`)) return;
    try {
      await adminRequest<void>(`${path}/${id}?tenantId=${encodeURIComponent(tenantId)}`, {
        method: "DELETE",
      });
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
                  tenantId,
                  addressId: form.get("addressId") || null,
                  noticeType: form.get("noticeType"),
                  title: form.get("title"),
                  body: form.get("body"),
                  priority: form.get("priority"),
                  validFrom: new Date(String(form.get("validFrom"))).toISOString(),
                  validUntil: new Date(String(form.get("validUntil"))).toISOString(),
                  publicationStatus: form.get("publicationStatus"),
                });
              }}
            >
              <div className="editable-list__title">
                <strong>{item.title}</strong>
                <StatusBadge tone={new Date(item.validUntil) < new Date() ? "neutral" : "info"}>
                  {new Date(item.validUntil) < new Date() ? "Abgelaufen" : "Aktiv/künftig"}
                </StatusBadge>
                <PublicationBadge status={item.publicationStatus} />
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
                <PublicationEditor status={item.publicationStatus} />
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
                  tenantId,
                  addressId: form.get("addressId"),
                  wasteTypeId: form.get("wasteTypeId"),
                  wasteTypeLabel: form.get("wasteTypeLabel"),
                  plannedDate: form.get("plannedDate"),
                  effectiveDate: form.get("effectiveDate"),
                  status: form.get("status"),
                  publicationStatus: form.get("publicationStatus"),
                });
              }}
            >
              <div className="editable-list__title">
                <strong>
                  {item.wasteTypeLabel} · {item.effectiveDate}
                </strong>
                <PublicationBadge status={item.publicationStatus} />
              </div>
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
                <PublicationEditor status={item.publicationStatus} />
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
                  tenantId,
                  name: form.get("name"),
                  category: form.get("category"),
                  disposalRoute: form.get("disposalRoute"),
                  notes: form.get("notes"),
                  synonyms: values(form.get("synonyms")),
                  publicationStatus: form.get("publicationStatus"),
                });
              }}
            >
              <div className="editable-list__title">
                <strong>{item.name}</strong>
                <PublicationBadge status={item.publicationStatus} />
              </div>
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
              <PublicationEditor status={item.publicationStatus} />
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
                  tenantId,
                  name: form.get("name"),
                  siteType: form.get("siteType"),
                  address: form.get("address"),
                  openingHours: form.get("openingHours"),
                  acceptedWasteTypes: values(form.get("acceptedWasteTypes")),
                  openNow: form.get("openNow") === "on",
                  latitude: Number(form.get("latitude")),
                  longitude: Number(form.get("longitude")),
                  publicationStatus: form.get("publicationStatus"),
                });
              }}
            >
              <div className="editable-list__title">
                <strong>{item.name}</strong>
                <PublicationBadge status={item.publicationStatus} />
              </div>
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
              <PublicationEditor status={item.publicationStatus} />
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
