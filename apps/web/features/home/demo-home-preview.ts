export type DemoCollection = {
  dateLabel: string;
  weekday: string;
  wasteType: string;
  tone: "info" | "success" | "warning";
  status: string;
};

export type DemoQuickAction = {
  eyebrow: string;
  href: string;
  label: string;
};

/**
 * Ausschließlich synthetische Inhalte für die freigegebene Demo-Vorschau.
 * Die Werte bilden keine fachliche Datenquelle und dürfen nicht für
 * Produktionsmandanten verwendet werden.
 */
export const demoHomePreview = {
  addressLabel: "Musterstraße 12",
  nextCollection: {
    day: "4.",
    month: "August",
    weekday: "Dienstag",
    wasteTypes: ["Restabfall"],
    status: "Planmäßig",
  },
  quickActions: [
    { eyebrow: "ABC", href: "#abfall-abc", label: "Abfall nachschlagen" },
    { eyebrow: "Ort", href: "#standorte", label: "Standort finden" },
    { eyebrow: "Kal", href: "#kalender", label: "Termine ansehen" },
  ] satisfies DemoQuickAction[],
  upcomingCollections: [
    {
      dateLabel: "4. August",
      weekday: "Dienstag",
      wasteType: "Restabfall",
      tone: "success",
      status: "Planmäßig",
    },
    {
      dateLabel: "7. August",
      weekday: "Freitag",
      wasteType: "Bioabfall",
      tone: "success",
      status: "Planmäßig",
    },
    {
      dateLabel: "11. August",
      weekday: "Dienstag",
      wasteType: "Papier",
      tone: "warning",
      status: "Geänderter Termin",
    },
  ] satisfies DemoCollection[],
  notice: {
    body: "Die Papierabholung wird in dieser Vorschau beispielhaft auf Dienstag verlegt.",
    title: "Terminänderung in der Testansicht",
  },
  popularSearches: ["Batterien", "Elektrogeräte", "Grünschnitt", "Altglas"],
  sites: [
    {
      detail: "Wertstoffhof · heute bis 18:00 Uhr",
      distance: "2,4 km",
      name: "Recyclinghof Nord",
    },
    {
      detail: "Grünschnitt und Papier · heute bis 17:00 Uhr",
      distance: "4,1 km",
      name: "Sammelstelle am Park",
    },
  ],
} as const;
