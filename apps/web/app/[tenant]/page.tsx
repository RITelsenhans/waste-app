import type { CSSProperties } from "react";
import { Action, Card, StatusBadge } from "@waste/ui";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../components/site-header";
import {
  getTenantConfig,
  TenantConfigNotFoundError,
  type TenantConfig,
} from "../../lib/tenant-config";

export const dynamic = "force-dynamic";

type TenantPageProps = {
  params: Promise<{ tenant: string }>;
};

function TenantHome({ config, tenantKey }: { config: TenantConfig; tenantKey: string }) {
  const tenantStyle = {
    "--tenant-primary": config.branding.primaryColor,
    "--tenant-info": config.branding.infoColor,
  } as CSSProperties;

  return (
    <div className="app-shell" style={tenantStyle}>
      <SiteHeader config={config} tenantKey={tenantKey} />
      <main id="main-content">
        <section className="hero" aria-labelledby="page-title">
          <div className="hero-copy">
            <p className="eyebrow">Phase 1 · Technischer Projektstart</p>
            <h1 id="page-title">Willkommen bei {config.name}</h1>
            <p className="hero-lead">
              Die mandantenfähige Web- und API-Grundlage steht. Fachliche Informationen werden in
              den nächsten, separat beauftragten Phase-1-Paketen ergänzt.
            </p>
            <Action className="hero-action" href="#projektstatus">
              Technischen Stand ansehen
            </Action>
          </div>
          <Card as="aside" className="tenant-card" aria-label="Aktive Mandantenkonfiguration">
            <StatusBadge tone="success">Demo aktiv</StatusBadge>
            <dl>
              <div>
                <dt>Mandant</dt>
                <dd>{config.shortName}</dd>
              </div>
              <div>
                <dt>Sprache</dt>
                <dd>{config.locales.join(", ")}</dd>
              </div>
              <div>
                <dt>Zeitzone</dt>
                <dd>{config.timezone}</dd>
              </div>
              <div>
                <dt>Konfiguration</dt>
                <dd>{config.contentVersion}</dd>
              </div>
            </dl>
          </Card>
        </section>

        <section className="content-section" id="projektstatus" aria-labelledby="status-title">
          <div className="section-heading">
            <p className="eyebrow">Engineering Foundation</p>
            <h2 id="status-title">Bereit für die ersten fachlichen Phase-1-Pakete</h2>
          </div>
          <div className="status-grid">
            <Card as="article" className="status-card">
              <span className="card-index" aria-hidden="true">
                01
              </span>
              <h3>Mandantenfähig</h3>
              <p>Branding, Sprache, Zeitzone und Feature Flags kommen aus der API-Konfiguration.</p>
            </Card>
            <Card as="article" className="status-card">
              <span className="card-index" aria-hidden="true">
                02
              </span>
              <h3>Vertragsbasiert</h3>
              <p>
                Readiness und Mandantenkonfiguration sind als OpenAPI-3.1-Verträge dokumentiert.
              </p>
            </Card>
            <Card as="article" className="status-card">
              <span className="card-index" aria-hidden="true">
                03
              </span>
              <h3>Bewusst begrenzt</h3>
              <p>Kalender, Abfall-ABC, Standorte und Phase-2-Services sind noch nicht aktiviert.</p>
            </Card>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <p>
            <strong>{config.name}</strong>
            <br />
            Technischer Demo-Stand ohne produktive Daten
          </p>
          <nav aria-label="Rechtliche Informationen">
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

  return <TenantHome config={config} tenantKey={tenant} />;
}
