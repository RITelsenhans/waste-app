"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Card, Icon, StatusBadge } from "@waste/ui";
import { CLIENT_API_BASE_URL as API } from "../lib/client-api";

type AccessEvent = { eventType: string; label: string; occurredAt: string };
type AccessRequest = {
  reference: string;
  accessToken: string;
  siteName: string;
  plannedArrivalAt: string;
  accessWindowStart: string;
  accessWindowEnd: string;
  itemDescription: string;
  identificationMethod: "code" | "license-plate";
  credential: string | null;
  credentialHint: string;
  status: "authorized" | "entry-granted" | "on-site" | "exit-granted" | "completed";
  gateState: "closed" | "open-entry" | "open-exit";
  nextSimulationEvent: "arrival-scan" | "entry-confirmed" | "exit-scan" | "exit-confirmed" | null;
  events: AccessEvent[];
};

type SiteSummary = { id: string; name: string };

type StoredAccessState = {
  access: AccessRequest | null;
  credential: string;
  itemDescription: string;
  licensePlate: string;
  method: "code" | "license-plate";
  plannedArrival: string;
};

function storageKey(tenantKey: string) {
  return `waste-recycling-access-${tenantKey}`;
}

function isStoredAccessState(value: unknown): value is StoredAccessState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<StoredAccessState>;
  return (
    (candidate.access === null ||
      (typeof candidate.access === "object" &&
        typeof candidate.access.reference === "string" &&
        typeof candidate.access.accessToken === "string" &&
        Array.isArray(candidate.access.events))) &&
    typeof candidate.credential === "string" &&
    typeof candidate.itemDescription === "string" &&
    typeof candidate.licensePlate === "string" &&
    (candidate.method === "code" || candidate.method === "license-plate") &&
    typeof candidate.plannedArrival === "string"
  );
}

const statusLabels: Record<AccessRequest["status"], string> = {
  authorized: "Zugang erteilt",
  "entry-granted": "Einfahrt offen",
  "on-site": "Fahrzeug auf dem Hof",
  "exit-granted": "Ausfahrt offen",
  completed: "Besuch abgeschlossen",
};

const actionLabels: Record<Exclude<AccessRequest["nextSimulationEvent"], null>, string> = {
  "arrival-scan": "Ankunft jetzt scannen",
  "entry-confirmed": "Einfahrt jetzt bestätigen",
  "exit-scan": "Ausfahrt jetzt freigeben",
  "exit-confirmed": "Ausfahrt jetzt abschließen",
};

const journeySteps = [
  {
    eventType: "arrival-scan",
    title: "Ankunft",
    description: "Scanner erkennt Kennzeichen oder Code.",
    icon: "scan",
    scene: "arrival",
  },
  {
    eventType: "entry-confirmed",
    title: "Einfahrt",
    description: "Schranke öffnet, Fahrzeug fährt ein.",
    icon: "gate",
    scene: "entry",
  },
  {
    eventType: "exit-scan",
    title: "Abgabe",
    description: "Fernseher wird am E-Schrott abgegeben.",
    icon: "television",
    scene: "dropoff",
  },
  {
    eventType: "exit-confirmed",
    title: "Ausfahrt",
    description: "Ausfahrt erkannt, Schranke schließt wieder.",
    icon: "car",
    scene: "exit",
  },
] as const;

function tomorrowAtTen() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(22, 0, 0, 0);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

async function request<T>(path: string, options: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, options);
  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(problem?.detail ?? `Anfrage fehlgeschlagen (${response.status}).`);
  }
  return response.json() as Promise<T>;
}

export function RecyclingAccessShowcase({
  tenantKey,
  site,
}: {
  tenantKey: string;
  site: SiteSummary | null;
}) {
  const [plannedArrival, setPlannedArrival] = useState(tomorrowAtTen);
  const [method, setMethod] = useState<"code" | "license-plate">("license-plate");
  const [itemDescription, setItemDescription] = useState("Fernseher");
  const [licensePlate, setLicensePlate] = useState("DEMO-TV-22");
  const [access, setAccess] = useState<AccessRequest | null>(null);
  const [credential, setCredential] = useState("");
  const [message, setMessage] = useState("Noch keine Zufahrt beantragt.");
  const [pending, setPending] = useState(false);
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = window.sessionStorage.getItem(storageKey(tenantKey));
        if (!stored) return;
        const state = JSON.parse(stored) as unknown;
        if (!isStoredAccessState(state)) {
          window.sessionStorage.removeItem(storageKey(tenantKey));
          return;
        }
        setAccess(state.access);
        setCredential(state.credential);
        setItemDescription(state.itemDescription);
        setLicensePlate(state.licensePlate);
        setMethod(state.method);
        setPlannedArrival(state.plannedArrival);
        if (state.access) {
          setMessage(
            state.access.status === "completed"
              ? "Der zuletzt simulierte Besuch ist abgeschlossen."
              : `Zugang ${state.access.reference} wurde in dieser Sitzung wiederhergestellt.`,
          );
        }
      } catch {
        window.sessionStorage.removeItem(storageKey(tenantKey));
      } finally {
        setStorageReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [tenantKey]);

  useEffect(() => {
    if (!storageReady) return;
    const state: StoredAccessState = {
      access,
      credential,
      itemDescription,
      licensePlate,
      method,
      plannedArrival,
    };
    window.sessionStorage.setItem(storageKey(tenantKey), JSON.stringify(state));
  }, [
    access,
    credential,
    itemDescription,
    licensePlate,
    method,
    plannedArrival,
    storageReady,
    tenantKey,
  ]);

  useEffect(() => {
    if (window.location.hash !== "#nachtzufahrt") return;
    const timer = window.setTimeout(() => {
      document.getElementById("nachtzufahrt")?.scrollIntoView({ block: "start" });
    }, 100);
    return () => window.clearTimeout(timer);
  }, [site]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!site) {
      setMessage("Der Demo-Recyclinghof ist noch nicht geladen.");
      return;
    }
    const form = event.currentTarget;
    const data = new FormData(form);
    setPending(true);
    try {
      const created = await request<AccessRequest>("/v1/recycling-access/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({
          tenantId: tenantKey,
          siteId: site.id,
          plannedArrivalAt: new Date(String(data.get("plannedArrivalAt"))).toISOString(),
          wasteType: "electronics",
          itemDescription,
          identificationMethod: method,
          syntheticLicensePlate: method === "license-plate" ? licensePlate : null,
          syntheticDataConfirmed: data.get("syntheticDataConfirmed") === "on",
        }),
      });
      const issuedCredential = created.credential ?? created.credentialHint;
      setAccess(created);
      setCredential(issuedCredential);
      setMessage(
        `Zugang ${created.reference} ist ausgestellt. Starten Sie jetzt die Hardware-Simulation.`,
      );
      window.setTimeout(() => {
        document.getElementById("nachtzufahrt-aktion")?.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
          block: "start",
        });
      }, 0);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setPending(false);
    }
  }

  async function simulateNext() {
    if (!access?.nextSimulationEvent) return;
    setPending(true);
    try {
      const updated = await request<AccessRequest>(
        `/v1/recycling-access/requests/${access.reference}/simulation-events`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
          body: JSON.stringify({
            accessToken: access.accessToken,
            eventType: access.nextSimulationEvent,
            credential,
          }),
        },
      );
      setAccess(updated);
      setMessage(updated.events.at(-1)?.label ?? "Simulationsschritt abgeschlossen.");
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setPending(false);
    }
  }

  function startNewSimulation() {
    setAccess(null);
    setCredential("");
    setMessage("Noch keine Zufahrt beantragt.");
  }

  const gateOpen = access != null && access.gateState !== "closed";
  const currentJourneyStep = access?.nextSimulationEvent
    ? journeySteps.findIndex((step) => step.eventType === access.nextSimulationEvent)
    : access?.status === "completed"
      ? journeySteps.length
      : -1;
  const journeyProgress =
    currentJourneyStep < 0
      ? 0
      : Math.min(100, (currentJourneyStep / (journeySteps.length - 1)) * 100);
  const focusedJourneyIndex =
    currentJourneyStep === journeySteps.length
      ? journeySteps.length - 1
      : Math.max(0, currentJourneyStep);
  const focusedJourneyStep = journeySteps[focusedJourneyIndex];

  return (
    <section className="home-section access-showcase" id="nachtzugang">
      <div className="access-showcase__intro">
        <p className="eyebrow">Showcase · Rund um die Uhr</p>
        <h2 className="section-title">
          <span>
            <Icon name="recycle" />
          </span>
          24/7-Zugang zum Recyclinghof
        </h2>
        <p className="section-lead">
          Fernseher um 22 Uhr abgeben: Zugang vorab beantragen, am Tor identifizieren und die
          sichere Ein- und Ausfahrt hier vollständig simulieren.
        </p>
        <div className="simulation-disclaimer">
          <Icon name="info" />
          <p>
            <strong>Hardware-Simulation.</strong> Keine Kamera und keine Schranke sind verbunden.
            Verwenden Sie kein echtes Kennzeichen.
          </p>
        </div>
        <a className="access-showcase__jump" href="#nachtzufahrt">
          <span>
            <Icon name="car" />
          </span>
          <strong>Grafische Simulation mit Auto direkt ansehen</strong>
          <span aria-hidden="true">↓</span>
        </a>
      </div>

      <div className="access-showcase__grid">
        <Card as="article" className="access-request-card">
          <div className="access-step-label">1 · Zugang beantragen</div>
          <h3>Was möchten Sie abgeben?</h3>
          <form className="pilot-form" onSubmit={submit}>
            <label>
              Recyclinghof
              <input value={site?.name ?? "Wird geladen …"} readOnly />
            </label>
            <label>
              Gegenstand
              <select
                name="itemDescription"
                onChange={(event) => setItemDescription(event.target.value)}
                required
                value={itemDescription}
              >
                <option>Fernseher</option>
                <option>Computerbildschirm</option>
                <option>Kleines Elektrogerät</option>
              </select>
            </label>
            <label>
              Gewünschte Ankunft
              <input
                name="plannedArrivalAt"
                onChange={(event) => setPlannedArrival(event.target.value)}
                required
                type="datetime-local"
                value={plannedArrival}
              />
            </label>
            <fieldset className="access-methods">
              <legend>Erkennung am Tor</legend>
              <label className={method === "license-plate" ? "is-selected" : undefined}>
                <input
                  checked={method === "license-plate"}
                  name="identificationMethod"
                  onChange={() => setMethod("license-plate")}
                  type="radio"
                />
                <span>
                  <strong>Synthetisches Kennzeichen</strong>
                  <small>Der Scanner erkennt „DEMO-TV-22“ berührungslos.</small>
                </span>
                <Icon name="scan" />
              </label>
              <label className={method === "code" ? "is-selected" : undefined}>
                <input
                  checked={method === "code"}
                  name="identificationMethod"
                  onChange={() => setMethod("code")}
                  type="radio"
                />
                <span>
                  <strong>Persönlicher Zugangscode</strong>
                  <small>Die datensparsame Alternative zur Fahrzeugerkennung.</small>
                </span>
                <Icon name="key" />
              </label>
            </fieldset>
            {method === "license-plate" && (
              <label>
                Demo-Kennzeichen
                <input
                  autoCapitalize="characters"
                  name="licensePlate"
                  onChange={(event) => setLicensePlate(event.target.value)}
                  pattern="DEMO-[A-Za-z0-9-]{2,20}"
                  required
                  value={licensePlate}
                />
                <small>Nur Werte mit „DEMO-“ werden akzeptiert.</small>
              </label>
            )}
            <label className="check-label">
              <input name="syntheticDataConfirmed" required type="checkbox" />
              Ich verwende ausschließlich synthetische Testdaten.
            </label>
            <button disabled={pending || !plannedArrival || !site} type="submit">
              {pending ? "Wird verarbeitet …" : "Zugang verbindlich simulieren"}
            </button>
          </form>
        </Card>

        <Card as="article" className="access-pass-card">
          <div className="access-step-label">2 · Digitale Zufahrtskarte</div>
          {access ? (
            <>
              <div className="access-pass-card__head">
                <div>
                  <p className="eyebrow">{access.siteName}</p>
                  <h3>{access.itemDescription}</h3>
                </div>
                <StatusBadge tone={access.status === "completed" ? "success" : "info"}>
                  {statusLabels[access.status]}
                </StatusBadge>
              </div>
              <dl className="access-pass-details">
                <div>
                  <dt>Vorgang</dt>
                  <dd>{access.reference}</dd>
                </div>
                <div>
                  <dt>Zeitfenster</dt>
                  <dd>
                    {formatTime(access.accessWindowStart)}–
                    {new Intl.DateTimeFormat("de-DE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(access.accessWindowEnd))}{" "}
                    Uhr
                  </dd>
                </div>
              </dl>
              <div className="access-credential">
                <small>
                  {access.identificationMethod === "license-plate"
                    ? "Synthetisches Kennzeichen"
                    : "Ihr einmaliger Demo-Code"}
                </small>
                <strong>{credential}</strong>
              </div>
              <p className="access-pass-note">
                Am realen Tor würde dieses Medium durch eine zugelassene Gerätekomponente geprüft.
              </p>
              <button onClick={startNewSimulation} type="button">
                Neue Simulation starten
              </button>
            </>
          ) : (
            <div className="access-empty-state">
              <Icon name="sparkles" />
              <h3>Ihre Zufahrtskarte erscheint hier</h3>
              <p>Füllen Sie links den kurzen Demo-Antrag aus.</p>
            </div>
          )}
        </Card>
      </div>

      <Card as="article" className="access-journey" id="nachtzufahrt">
        <div className="access-journey__head">
          <div>
            <div className="access-step-label">3 · Interaktive Nachtzufahrt</div>
            <h3>Von der Ankunft bis zur geschlossenen Schranke</h3>
            <p>Jeder große Schritt schaltet den nächsten Abschnitt der Simulation frei.</p>
          </div>
          <StatusBadge
            tone={gateOpen ? "warning" : access?.status === "completed" ? "success" : "neutral"}
          >
            {gateOpen ? "Schranke geöffnet" : "Schranke geschlossen"}
          </StatusBadge>
        </div>

        <div
          aria-label="Horizontaler Zeitstrahl der simulierten Zufahrt"
          className="journey-scroll"
          tabIndex={0}
        >
          <div className="journey-progress" aria-label="Fortschritt der Zufahrt">
            <span className="journey-progress__track" aria-hidden="true">
              <i style={{ width: `${journeyProgress}%` }} />
            </span>
            {journeySteps.map((step, index) => {
              const completed =
                currentJourneyStep === journeySteps.length || index < currentJourneyStep;
              const current = index === currentJourneyStep;
              return (
                <div
                  className={`journey-progress__stop ${completed ? "is-complete" : ""} ${current ? "is-current" : ""}`}
                  key={step.eventType}
                >
                  <span>{completed ? "✓" : index + 1}</span>
                  <small>{step.title}</small>
                </div>
              );
            })}
          </div>

          <div className="journey-scenes">
            {journeySteps.map((step, index) => {
              const completed =
                currentJourneyStep === journeySteps.length || index < currentJourneyStep;
              const current = index === currentJourneyStep;
              return (
                <section
                  className={`journey-card ${completed ? "is-complete" : ""} ${current ? "is-current" : ""}`}
                  key={step.eventType}
                >
                  <div
                    aria-label={`Zeichentrickszene: ${step.description}`}
                    className={`journey-card__scene journey-card__scene--${step.scene}`}
                    role="img"
                  >
                    <span className="journey-card__number">{index + 1}</span>
                    {completed && <span className="journey-card__done">Erledigt ✓</span>}
                  </div>
                  <div className="journey-card__body">
                    <div className="journey-card__title">
                      <span>
                        <Icon name={step.icon} />
                      </span>
                      <div>
                        <small>Schritt {index + 1}</small>
                        <h4>{step.title}</h4>
                      </div>
                    </div>
                    <p>{completed ? "Erledigt" : current ? "Jetzt aktiv" : "Folgt"}</p>
                  </div>
                </section>
              );
            })}
          </div>
        </div>

        <div className="journey-control" id="nachtzufahrt-aktion" aria-live="polite">
          <div
            aria-label={`Aktuelle Zeichentrickszene: ${focusedJourneyStep.description}`}
            className={`journey-control__scene journey-card__scene--${focusedJourneyStep.scene}`}
            role="img"
          >
            <span className="journey-control__label">
              Schritt {focusedJourneyIndex + 1} · {focusedJourneyStep.title}
            </span>
          </div>
          <div className="journey-control__panel">
            <p className="eyebrow">Aktion und Ergebnis</p>
            <h4>{focusedJourneyStep.description}</h4>
            <button
              className="journey-action"
              disabled={!access?.nextSimulationEvent || pending}
              onClick={() => void simulateNext()}
              type="button"
            >
              {pending
                ? "Wird verarbeitet …"
                : access?.nextSimulationEvent
                  ? actionLabels[access.nextSimulationEvent]
                  : access?.status === "completed"
                    ? "Simulation abgeschlossen"
                    : "Zuerst Zugang beantragen"}
            </button>
            <div className="journey-live-status">
              <span aria-hidden="true">
                <Icon name={access?.status === "completed" ? "sparkles" : "info"} />
              </span>
              <p className="gate-message">
                <strong>Unmittelbares Ergebnis</strong>
                {message}
              </p>
            </div>
          </div>
        </div>

        {access && (
          <ol className="access-timeline" aria-label="Protokoll der simulierten Zufahrt">
            {access.events.map((event, index) => (
              <li key={`${event.eventType}-${event.occurredAt}`}>
                <span>{index + 1}</span>
                <div>
                  <strong>{event.label}</strong>
                  <small>
                    {new Intl.DateTimeFormat("de-DE", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    }).format(new Date(event.occurredAt))}{" "}
                    Uhr
                  </small>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </section>
  );
}
