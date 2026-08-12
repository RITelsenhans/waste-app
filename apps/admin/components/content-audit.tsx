"use client";

import { useEffect, useState } from "react";
import { Icon, StatusBadge } from "@waste/ui";
import { adminRequest } from "../lib/admin-api";

type AuditEvent = {
  id: string;
  contentType: "collections" | "waste-guide" | "sites" | "notices";
  contentId: string;
  action: "created" | "updated" | "published" | "moved-to-draft" | "deleted";
  publicationStatus: "draft" | "published" | null;
  actorLabel: string;
  occurredAt: string;
};

const contentLabels: Record<AuditEvent["contentType"], string> = {
  collections: "Abfuhrtermin",
  "waste-guide": "Abfall-ABC",
  sites: "Standort",
  notices: "Hinweis",
};

const actionLabels: Record<AuditEvent["action"], string> = {
  created: "angelegt",
  updated: "bearbeitet",
  published: "veröffentlicht",
  "moved-to-draft": "in Entwurf zurückgesetzt",
  deleted: "gelöscht",
};

export function ContentAudit({ tenantId }: { tenantId: string }) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [message, setMessage] = useState("Änderungsverlauf wird geladen …");

  async function load() {
    try {
      const items = await adminRequest<AuditEvent[]>(
        `/v1/admin/content-audit?tenantId=${encodeURIComponent(tenantId)}&limit=100`,
      );
      setEvents(items);
      setMessage(
        items.length === 0
          ? "Seit Einführung des Freigabeworkflows wurden noch keine Änderungen protokolliert."
          : `${items.length} protokollierte Änderungen geladen.`,
      );
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  useEffect(() => {
    void adminRequest<AuditEvent[]>(
      `/v1/admin/content-audit?tenantId=${encodeURIComponent(tenantId)}&limit=100`,
    )
      .then((items) => {
        setEvents(items);
        setMessage(
          items.length === 0
            ? "Seit Einführung des Freigabeworkflows wurden noch keine Änderungen protokolliert."
            : `${items.length} protokollierte Änderungen geladen.`,
        );
      })
      .catch((error: Error) => setMessage(error.message));
  }, [tenantId]);

  return (
    <section className="audit-panel" id="aenderungsverlauf">
      <div className="section-head">
        <div>
          <p className="eyebrow">Nachvollziehbarkeit</p>
          <h2>
            <span className="form-icon">
              <Icon name="sparkles" />
            </span>
            Änderungsverlauf
          </h2>
          <p>{message}</p>
        </div>
        <button onClick={() => void load()}>Aktualisieren</button>
      </div>
      <ol className="audit-list">
        {events.map((event) => (
          <li key={event.id}>
            <div>
              <strong>{contentLabels[event.contentType]}</strong> {actionLabels[event.action]}
              <small>
                {new Intl.DateTimeFormat("de-DE", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(event.occurredAt))}
                {" · "}
                {event.actorLabel}
              </small>
              <code>{event.contentId}</code>
            </div>
            {event.publicationStatus && (
              <StatusBadge tone={event.publicationStatus === "published" ? "success" : "warning"}>
                {event.publicationStatus === "published" ? "Veröffentlicht" : "Entwurf"}
              </StatusBadge>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
