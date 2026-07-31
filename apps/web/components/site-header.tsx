import Image from "next/image";
import Link from "next/link";
import type { TenantConfig } from "../lib/tenant-config";

type SiteHeaderProps = {
  addressLabel?: string;
  config: TenantConfig;
  tenantKey: string;
};

export function SiteHeader({ addressLabel, config, tenantKey }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">
        Zum Hauptinhalt
      </a>
      <div className="header-inner">
        <Link
          aria-label={`${config.name} – Startseite`}
          className="brand-link"
          href={`/${tenantKey}`}
        >
          <Image
            alt="regio iT"
            className="brand-logo"
            height={59}
            priority
            src={config.branding.logoUrl}
            width={171}
          />
        </Link>
        {addressLabel ? (
          <nav className="desktop-nav" aria-label="Hauptnavigation">
            <Link aria-current="page" href={`/${tenantKey}`}>
              Start
            </Link>
            <a href="#kalender">Kalender</a>
            <a href="#abfall-abc">Abfall-ABC</a>
            <a href="#standorte">Standorte</a>
            <a href="#mehr">Mehr</a>
          </nav>
        ) : (
          <span />
        )}
        <a className="address-label" href="#demo-hinweis">
          <span aria-hidden="true">●</span>
          <span>
            <small>{addressLabel ? "Testadresse" : "Mandant"}</small>
            {addressLabel ?? config.shortName}
          </span>
        </a>
      </div>
    </header>
  );
}
