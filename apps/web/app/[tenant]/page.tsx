import type { CSSProperties } from "react";
import { Action, Card, StatusBadge } from "@waste/ui";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../components/site-header";
import { demoHomePreview } from "../../features/home/demo-home-preview";
import {
  getTenantConfig,
  TenantConfigNotFoundError,
  type TenantConfig,
} from "../../lib/tenant-config";

export const dynamic = "force-dynamic";

type TenantPageProps = {
  params: Promise<{ tenant: string }>;
};

function DemoPreview({ config, tenantKey }: { config: TenantConfig; tenantKey: string }) {
  const preview = demoHomePreview;
  const tenantStyle = {
    "--tenant-primary": config.branding.primaryColor,
    "--tenant-info": config.branding.infoColor,
  } as CSSProperties;

  return (
    <div className="app-shell" style={tenantStyle}>
      <SiteHeader addressLabel={preview.addressLabel} config={config} tenantKey={tenantKey} />

      <aside className="demo-banner" id="demo-hinweis" aria-labelledby="demo-title">
        <div className="demo-banner__inner">
          <span className="demo-banner__label">Demovorschau</span>
          <p>
            <strong id="demo-title">Hier dürfen Sie ausprobieren.</strong> Alle Termine, Adressen
            und Standorte sind frei erfunden. Es werden keine Eingaben gespeichert.
          </p>
        </div>
      </aside>

      <main id="main-content" tabIndex={-1}>
        <section className="home-hero" aria-labelledby="page-title">
          <Card as="article" className="collection-hero">
            <div className="collection-hero__topline">
              <p className="eyebrow">Nächste Abholung</p>
              <StatusBadge tone="success">{preview.nextCollection.status}</StatusBadge>
            </div>
            <h1 id="page-title">
              <span className="collection-hero__weekday">{preview.nextCollection.weekday}</span>
              <span className="collection-hero__date">
                <span>{preview.nextCollection.day}</span>{" "}
                <span>{preview.nextCollection.month}</span>
              </span>
            </h1>
            <p className="collection-type">{preview.nextCollection.wasteTypes.join(" · ")}</p>
            <p className="collection-address">
              Testadresse <strong>{preview.addressLabel}</strong>
            </p>
            <Action href="#kalender">Alle Termine ansehen</Action>
          </Card>

          <Card as="aside" className="quick-actions" elevation="flat">
            <p className="eyebrow">Schnell erledigen</p>
            <h2>Was möchten Sie tun?</h2>
            <nav aria-label="Schnellaktionen">
              {preview.quickActions.map((action) => (
                <a href={action.href} key={action.href}>
                  <span aria-hidden="true">{action.eyebrow}</span>
                  <strong>{action.label}</strong>
                  <small>Vorschau öffnen</small>
                </a>
              ))}
            </nav>
          </Card>
        </section>

        <section className="home-section" id="kalender" aria-labelledby="calendar-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Kalender</p>
              <h2 id="calendar-title">Die nächsten Termine</h2>
            </div>
            <p>Beispieldaten für die gemeinsame Prüfung von Inhalt und Darstellung.</p>
          </div>
          <div className="collection-list">
            {preview.upcomingCollections.map((collection) => (
              <Card
                as="article"
                className="collection-card"
                elevation="flat"
                key={collection.dateLabel}
              >
                <p className="collection-card__weekday">{collection.weekday}</p>
                <p className="collection-card__date">{collection.dateLabel}</p>
                <h3>{collection.wasteType}</h3>
                <StatusBadge tone={collection.tone}>{collection.status}</StatusBadge>
              </Card>
            ))}
          </div>
          <p className="preview-boundary">
            Filter, Adresswechsel und Kalenderabonnement folgen mit dem fachlichen Kalenderpaket.
          </p>
        </section>

        <section className="home-section split-section" aria-label="Hinweise und Abfall-ABC">
          <Card as="article" className="notice-card" id="meldungen">
            <div className="notice-card__icon" aria-hidden="true">
              !
            </div>
            <div>
              <p className="eyebrow">Aktueller Hinweis</p>
              <h2>{preview.notice.title}</h2>
              <p>{preview.notice.body}</p>
              <StatusBadge tone="warning">Synthetische Meldung</StatusBadge>
            </div>
          </Card>

          <Card as="article" className="guide-card" id="abfall-abc" elevation="flat">
            <p className="eyebrow">Abfall-ABC</p>
            <h2>Wohin damit?</h2>
            <p>
              So wird die Suche künftig beginnen. Welche Begriffe suchen Bürgerinnen und Bürger
              besonders häufig?
            </p>
            <ul className="search-chips" aria-label="Beispielhafte Suchbegriffe">
              {preview.popularSearches.map((search) => (
                <li key={search}>{search}</li>
              ))}
            </ul>
            <p className="preview-boundary">
              Die eigentliche Suche benötigt freigegebene ABC-Daten.
            </p>
          </Card>
        </section>

        <section className="home-section" id="standorte" aria-labelledby="sites-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">In Ihrer Nähe</p>
              <h2 id="sites-title">Entsorgungsstandorte</h2>
            </div>
            <p>Die Liste bleibt später auch ohne Kartenanbieter vollständig nutzbar.</p>
          </div>
          <div className="site-list">
            {preview.sites.map((site) => (
              <Card as="article" className="site-card" elevation="flat" key={site.name}>
                <div className="site-card__marker" aria-hidden="true">
                  Ort
                </div>
                <div>
                  <h3>{site.name}</h3>
                  <p>{site.detail}</p>
                </div>
                <strong>{site.distance}</strong>
              </Card>
            ))}
          </div>
          <p className="preview-boundary">
            Karte, Filter und Navigation folgen nach der Entscheidung zum Kartenanbieter.
          </p>
        </section>

        <section className="feedback-section" aria-labelledby="feedback-title">
          <div>
            <p className="eyebrow">Für den Nutzertest</p>
            <h2 id="feedback-title">Finden Sie sich auf Anhieb zurecht?</h2>
          </div>
          <ul>
            <li>Ist der nächste Termin sofort erkennbar?</li>
            <li>Sind die wichtigsten Wege richtig benannt?</li>
            <li>Fehlt eine Information, die Sie täglich brauchen?</li>
          </ul>
        </section>
      </main>

      <footer className="site-footer" id="mehr">
        <div className="footer-inner">
          <p>
            <strong>{config.name}</strong>
            <br />
            Nutzertest mit ausschließlich synthetischen Daten
          </p>
          <nav aria-label="Service und Recht">
            <a href="#demo-hinweis">Hilfe und Kontakt</a>
            <a href={config.legalLinks.imprint}>Impressum</a>
            <a href={config.legalLinks.privacy}>Datenschutz</a>
            <a href={config.legalLinks.accessibility}>Barrierefreiheit</a>
          </nav>
        </div>
        <div className="legal-placeholders" aria-label="Hinweise zum Demo-Stand">
          <p id="impressum">Impressum: Für den technischen Demo-Mandanten nicht hinterlegt.</p>
          <p id="datenschutz">
            Datenschutz: Es werden keine produktiven oder personenbezogenen Daten verwendet.
          </p>
          <p id="barrierefreiheit">
            Barrierefreiheit: Die formale Erklärung folgt nach der vorgesehenen BITV-/WCAG-Prüfung.
          </p>
        </div>
      </footer>

      <nav className="mobile-nav" aria-label="Mobile Hauptnavigation">
        <a aria-current="page" href={`/${tenantKey}`}>
          Start
        </a>
        <a href="#kalender">Kalender</a>
        <a href="#abfall-abc">ABC</a>
        <a href="#standorte">Standorte</a>
        <a href="#mehr">Mehr</a>
      </nav>
    </div>
  );
}

function TenantSetup({ config, tenantKey }: { config: TenantConfig; tenantKey: string }) {
  return (
    <div className="app-shell">
      <SiteHeader config={config} tenantKey={tenantKey} />
      <main className="centered-state" id="main-content" tabIndex={-1}>
        <Card className="state-card">
          <StatusBadge tone="info">Mandant konfiguriert</StatusBadge>
          <h1>{config.name}</h1>
          <p>Für diesen Mandanten ist noch keine freigegebene Startseiten-Vorschau aktiviert.</p>
        </Card>
      </main>
    </div>
  );
}

async function loadTenantOrNotFound(tenant: string): Promise<TenantConfig> {
  try {
    return await getTenantConfig(tenant);
  } catch (error) {
    if (error instanceof TenantConfigNotFoundError) {
      notFound();
    }
    throw error;
  }
}

export default async function TenantPage({ params }: TenantPageProps) {
  const { tenant } = await params;
  const config = await loadTenantOrNotFound(tenant);

  if (config.enabledFeatures.demoPreview !== true) {
    return <TenantSetup config={config} tenantKey={tenant} />;
  }

  return <DemoPreview config={config} tenantKey={tenant} />;
}
