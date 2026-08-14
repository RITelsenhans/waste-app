import { Card, Icon, StatusBadge } from "@waste/ui";

const containerOptions = [
  {
    icon: "bag" as const,
    volume: "1 m³",
    title: "Projekt-Sack",
    description: "Für kleine Renovierungen, Gartenarbeiten und wenig Stellfläche.",
  },
  {
    icon: "container" as const,
    volume: "5 m³",
    title: "Kompaktcontainer",
    description: "Für Bad, Keller oder eine überschaubare Haushaltsauflösung.",
  },
  {
    icon: "container" as const,
    volume: "7 m³",
    title: "Projektcontainer",
    description: "Für größere Umbauten und umfangreichere sortierte Mengen.",
  },
];

export function ContainerShopShowcase({ tenantKey }: { tenantKey: string }) {
  return (
    <section className="home-section container-shop" id="container-shop">
      <header className="container-shop__intro">
        <div className="container-shop__title">
          <span aria-hidden="true">
            <Icon name="container" />
          </span>
          <div>
            <p className="eyebrow">Neue Service-Idee</p>
            <h2>Container passend zum Projekt finden</h2>
          </div>
        </div>
        <StatusBadge tone="info">Pilot-Vorschau</StatusBadge>
        <p>
          Größen vergleichen, den richtigen Entsorgungsweg klären und eine spätere Bestellung gut
          vorbereitet starten.
        </p>
      </header>

      <div className="container-shop__grid">
        {containerOptions.map((option) => (
          <Card as="article" className="container-option" elevation="flat" key={option.title}>
            <span className="container-option__icon" aria-hidden="true">
              <Icon name={option.icon} />
            </span>
            <strong className="container-option__volume">{option.volume}</strong>
            <h3>{option.title}</h3>
            <p>{option.description}</p>
          </Card>
        ))}
      </div>

      <aside className="container-shop__notice">
        <Icon name="info" />
        <div>
          <strong>Noch keine Bestellung und keine Preiszusage</strong>
          <p>
            Für den echten Shop fehlen Betreiber, Abfallarten, Preise, Stellplatzprüfung,
            Sondernutzung und Zahlungsweg. Diese Ansicht zeigt bewusst nur den nächsten
            Produktschritt.
          </p>
        </div>
        <a className="button-link" href={`/${tenantKey}/abfall-abc`}>
          Entsorgungsweg prüfen
        </a>
      </aside>
    </section>
  );
}
