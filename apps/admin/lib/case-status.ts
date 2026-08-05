export type CaseTransition = { status: string; label: string; publicLabel: string };

export const nextStatus: Record<string, CaseTransition> = {
  received: {
    status: "in-review",
    label: "Prüfung beginnen",
    publicLabel: "Ihr Vorgang wird geprüft.",
  },
  "in-review": {
    status: "in-progress",
    label: "Bearbeitung beginnen",
    publicLabel: "Ihr Vorgang ist in Bearbeitung.",
  },
  "in-progress": {
    status: "completed",
    label: "Als erledigt markieren",
    publicLabel: "Ihr Vorgang wurde erledigt.",
  },
  completed: {
    status: "closed",
    label: "Vorgang schließen",
    publicLabel: "Ihr Vorgang wurde abgeschlossen.",
  },
};
