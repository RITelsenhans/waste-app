"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Icon } from "@waste/ui";

const API = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(/\/+$/, "");

type Customization = {
  tenantId: string;
  name: string;
  shortName: string;
  city: string;
  reportingOffice: string;
  phone: string;
  email: string;
  primaryColor: string;
  infoColor: string;
};

const colorPalettes = [
  { name: "Regio", primary: "#C8102E", info: "#008F8C" },
  { name: "Stadtblau", primary: "#005A9C", info: "#007C91" },
  { name: "Kommunalgrün", primary: "#137333", info: "#39796B" },
  { name: "Violett", primary: "#6A3FA0", info: "#3A7D8C" },
  { name: "Warm", primary: "#A84300", info: "#8B6B00" },
];

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, options);
  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(problem?.detail ?? `Anfrage fehlgeschlagen (${response.status}).`);
  }
  return response.json() as Promise<T>;
}

export function MunicipalityCustomization({ onMessage }: { onMessage: (message: string) => void }) {
  const [customization, setCustomization] = useState<Customization | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#C8102E");
  const [infoColor, setInfoColor] = useState("#008F8C");

  useEffect(() => {
    void request<Customization>("/v1/admin/tenants/demo")
      .then((item) => {
        setCustomization(item);
        setPrimaryColor(item.primaryColor);
        setInfoColor(item.infoColor);
      })
      .catch((error: Error) => onMessage(error.message));
  }, [onMessage]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const updated = await request<Customization>("/v1/admin/tenants/demo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          shortName: form.get("shortName"),
          city: form.get("city"),
          reportingOffice: form.get("reportingOffice"),
          phone: form.get("phone"),
          email: form.get("email"),
          primaryColor,
          infoColor,
        }),
      });
      setCustomization(updated);
      onMessage(
        "Kommunenprofil gespeichert. Die Bürgeransicht übernimmt es beim nächsten Neuladen.",
      );
    } catch (error) {
      onMessage((error as Error).message);
    }
  }

  if (!customization) return <p>Kommunenprofil wird geladen …</p>;

  return (
    <section className="municipality-panel" aria-labelledby="municipality-title">
      <p className="eyebrow">Übergeordnete Customizing-Schicht</p>
      <h2 id="municipality-title">
        <span className="form-icon">
          <Icon name="map-pin" />
        </span>
        Kommune konfigurieren
      </h2>
      <p>
        Diese Angaben gelten zentral für den ausgewählten kommunalen Mandanten und erscheinen in
        Bürgeransicht, Kontaktwegen und Meldestellen.
      </p>
      <form className="waste-card waste-card--raised municipality-form" onSubmit={save}>
        <div className="form-section">
          <h3>Auftritt</h3>
          <div className="edit-grid">
            <label>
              Name der Kommune
              <input name="name" defaultValue={customization.name} required />
            </label>
            <label>
              Kurzname
              <input name="shortName" defaultValue={customization.shortName} required />
            </label>
            <label>
              Ort / Versorgungsgebiet
              <input name="city" defaultValue={customization.city} required />
            </label>
          </div>
        </div>
        <div className="form-section">
          <h3>Kontakt und Meldestelle</h3>
          <div className="edit-grid">
            <label>
              Zuständige Meldestelle
              <input name="reportingOffice" defaultValue={customization.reportingOffice} required />
            </label>
            <label>
              Telefonnummer
              <input name="phone" type="tel" defaultValue={customization.phone} required />
            </label>
            <label>
              E-Mail-Adresse
              <input name="email" type="email" defaultValue={customization.email} required />
            </label>
          </div>
        </div>
        <div className="form-section">
          <h3>Farben</h3>
          <p className="field-help">Farbwelt auswählen oder darunter individuell anpassen.</p>
          <div className="palette-grid" aria-label="Vordefinierte Farbwelten">
            {colorPalettes.map((palette) => {
              const selected =
                palette.primary === primaryColor.toUpperCase() &&
                palette.info === infoColor.toUpperCase();
              return (
                <button
                  aria-pressed={selected}
                  className="palette-button"
                  key={palette.name}
                  onClick={() => {
                    setPrimaryColor(palette.primary);
                    setInfoColor(palette.info);
                  }}
                  type="button"
                >
                  <span style={{ background: palette.primary }} />
                  <span style={{ background: palette.info }} />
                  <strong>{palette.name}</strong>
                </button>
              );
            })}
          </div>
          <div className="color-grid">
            <label>
              Primärfarbe
              <input
                name="primaryColor"
                type="color"
                value={primaryColor}
                onChange={(event) => setPrimaryColor(event.target.value.toUpperCase())}
              />
            </label>
            <label>
              Informationsfarbe
              <input
                name="infoColor"
                type="color"
                value={infoColor}
                onChange={(event) => setInfoColor(event.target.value.toUpperCase())}
              />
            </label>
          </div>
        </div>
        <button type="submit">Kommunenprofil speichern</button>
      </form>
    </section>
  );
}
