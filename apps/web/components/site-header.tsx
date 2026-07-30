import Image from "next/image";
import Link from "next/link";
import type { TenantConfig } from "../lib/tenant-config";

export function SiteHeader({ config, tenantKey }: { config: TenantConfig; tenantKey: string }) {
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
        <nav aria-label="Hauptnavigation">
          <Link aria-current="page" href={`/${tenantKey}`}>
            Start
          </Link>
          <a href="#projektstatus">Projektstatus</a>
        </nav>
        <div className="tenant-label" aria-label={`Aktiver Mandant: ${config.shortName}`}>
          <span aria-hidden="true">●</span>
          {config.shortName}
        </div>
      </div>
    </header>
  );
}
