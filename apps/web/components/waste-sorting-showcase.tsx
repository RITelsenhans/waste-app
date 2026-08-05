"use client";

import { useState } from "react";
import { Card, Icon, StatusBadge } from "@waste/ui";

const API = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(/\/+$/, "");

type GuideEntry = { id: string; name: string; disposalRoute: string; notes: string };
type SampleId = "batteries" | "toaster" | "jar";

const samples: Array<{
  id: SampleId;
  label: string;
  hint: string;
  query: string;
  scene: string;
}> = [
  {
    id: "batteries",
    label: "Batterien",
    hint: "AA-Zellen und Knopfzelle",
    query: "Batterien",
    scene: "batteries",
  },
  {
    id: "toaster",
    label: "Alter Toaster",
    hint: "Elektrogerät mit Kabel",
    query: "Toaster",
    scene: "toaster",
  },
  {
    id: "jar",
    label: "Marmeladenglas",
    hint: "Leeres Verpackungsglas",
    query: "Marmeladenglas",
    scene: "jar",
  },
];

export function WasteSortingShowcase({ tenantKey }: { tenantKey: string }) {
  const [selectedId, setSelectedId] = useState<SampleId>("toaster");
  const [result, setResult] = useState<GuideEntry | null>(null);
  const [state, setState] = useState<"ready" | "analysing" | "complete" | "error">("ready");
  const selected = samples.find((sample) => sample.id === selectedId) ?? samples[1];

  async function analyse() {
    setState("analysing");
    setResult(null);
    try {
      const [response] = await Promise.all([
        fetch(
          `${API}/v1/waste-guide/search?tenantId=${tenantKey}&q=${encodeURIComponent(selected.query)}`,
        ),
        new Promise((resolve) => window.setTimeout(resolve, 700)),
      ]);
      if (!response.ok) throw new Error(`Anfrage fehlgeschlagen (${response.status}).`);
      const entries = (await response.json()) as GuideEntry[];
      if (!entries[0]) throw new Error("Für dieses Beispiel wurde kein Entsorgungsweg gefunden.");
      setResult(entries[0]);
      setState("complete");
    } catch {
      setState("error");
    }
  }

  function selectSample(id: SampleId) {
    setSelectedId(id);
    setResult(null);
    setState("ready");
  }

  return (
    <section className="home-section sorting-showcase" id="sortierkompass">
      <div className="sorting-showcase__head">
        <div>
          <p className="eyebrow">Neu · Visuelle Entsorgungshilfe</p>
          <h2 className="section-title">
            <span>
              <Icon name="camera" />
            </span>
            SortierKompass
          </h2>
          <p className="sorting-showcase__lead">
            Gegenstand ansehen, kommunale Regeln zuordnen und den richtigen Entsorgungsweg sofort
            verstehen.
          </p>
        </div>
        <StatusBadge tone="info">Interaktiver Pilot</StatusBadge>
      </div>

      <div className="sorting-showcase__layout">
        <div className="sorting-stage">
          <div
            aria-label={`Synthetisches Beispielfoto: ${selected.label}`}
            className={`sorting-stage__photo sorting-stage__photo--${selected.scene} ${state === "analysing" ? "is-analysing" : ""}`}
            role="img"
          >
            <span className="sorting-stage__camera-label">
              <Icon name="camera" /> Beispielfoto
            </span>
            {state === "analysing" && <span className="sorting-stage__scan" aria-hidden="true" />}
          </div>

          <div aria-label="Synthetisches Beispielfoto auswählen" className="sorting-samples">
            {samples.map((sample) => (
              <button
                aria-pressed={selectedId === sample.id}
                className={selectedId === sample.id ? "is-selected" : undefined}
                key={sample.id}
                onClick={() => selectSample(sample.id)}
                type="button"
              >
                <span
                  className={`sorting-samples__thumb sorting-samples__thumb--${sample.scene}`}
                />
                <span>
                  <strong>{sample.label}</strong>
                  <small>{sample.hint}</small>
                </span>
              </button>
            ))}
          </div>
        </div>

        <Card as="article" className="sorting-result">
          <div className="sorting-result__topline">
            <span>Kommunale Zuordnung</span>
            <Icon name={state === "complete" ? "sparkles" : "scan"} />
          </div>

          {state === "complete" && result ? (
            <div className="sorting-result__content" aria-live="polite">
              <StatusBadge tone="success">Beispiel zugeordnet</StatusBadge>
              <p className="sorting-result__object">{selected.label}</p>
              <h3>{result.name}</h3>
              <div className="sorting-result__route">
                <small>Empfohlener Entsorgungsweg</small>
                <strong>{result.disposalRoute}</strong>
              </div>
              <p>{result.notes}</p>
              <div className="sorting-result__actions">
                <a className="button-link" href="#standorte">
                  <Icon name="map-pin" /> Standort finden
                </a>
                {selectedId === "toaster" && <a href="#nachtzugang">24/7-Abgabe ansehen →</a>}
              </div>
            </div>
          ) : (
            <div className="sorting-result__empty" aria-live="polite">
              <span className="sorting-result__number">01</span>
              <h3>
                {state === "analysing" ? "Kommunale Regeln werden geprüft …" : selected.label}
              </h3>
              <p>
                {state === "error"
                  ? "Der Entsorgungsweg konnte gerade nicht geladen werden. Bitte erneut versuchen."
                  : state === "analysing"
                    ? "Das Beispielfoto wird mit dem Demo-Abfall-ABC abgeglichen."
                    : "Wählen Sie ein Beispiel und starten Sie die transparente Demo-Zuordnung."}
              </p>
              <button disabled={state === "analysing"} onClick={() => void analyse()} type="button">
                <Icon name="scan" />
                {state === "analysing" ? "Wird geprüft …" : "Beispielfoto prüfen"}
              </button>
            </div>
          )}
        </Card>
      </div>

      <p className="sorting-showcase__disclaimer">
        <Icon name="info" />
        <span>
          <strong>Transparenter Pilot:</strong> Es werden ausschließlich die drei synthetischen
          Beispielfotos verwendet. Eigene Fotos und eine produktive KI-Erkennung folgen erst nach
          Datenschutz-, Modell- und Betriebsfreigabe.
        </span>
      </p>
    </section>
  );
}
