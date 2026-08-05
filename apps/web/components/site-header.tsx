"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { TenantConfig } from "../lib/tenant-config";

type SiteHeaderProps = {
  addressLabel?: string;
  config: TenantConfig;
  tenantKey: string;
};

type Municipality = {
  tenantId: string;
  name: string;
  city: string;
};

const API = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(/\/+$/, "");

export function SiteHeader({ addressLabel, config, tenantKey }: SiteHeaderProps) {
  const [municipalities, setMunicipalities] = useState<Municipality[]>([
    { tenantId: tenantKey, name: config.name, city: config.serviceArea.city },
  ]);

  useEffect(() => {
    void fetch(`${API}/v1/tenants`)
      .then((response) => (response.ok ? (response.json() as Promise<Municipality[]>) : []))
      .then((items) => {
        if (items.length) setMunicipalities(items);
      });
  }, []);

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
          <span className="municipality-name">{config.name}</span>
        </Link>
        <div className="header-context">
          <label className="municipality-switcher">
            <small>Kommune</small>
            <select
              aria-label="Kommune auswählen"
              value={tenantKey}
              onChange={(event) => {
                const tenant = municipalities.find(
                  (municipality) => municipality.tenantId === event.currentTarget.value,
                );
                if (tenant) window.location.assign(`/${encodeURIComponent(tenant.tenantId)}`);
              }}
            >
              {municipalities.map((municipality) => (
                <option key={municipality.tenantId} value={municipality.tenantId}>
                  {municipality.name}
                </option>
              ))}
            </select>
          </label>
          {addressLabel && (
            <a className="address-label" href="#adresse">
              <span aria-hidden="true">●</span>
              <span>
                <small>Abholadresse</small>
                {addressLabel}
              </span>
            </a>
          )}
        </div>
        <nav className="desktop-nav" aria-label="Hauptnavigation">
          <Link aria-current="page" href={`/${tenantKey}`}>
            Start
          </Link>
          <a href="#kalender">Kalender</a>
          <a href="#abfall-abc">Abfall-ABC</a>
          <a href="#standorte">Standorte</a>
          <a href="#mehr">Mehr</a>
        </nav>
      </div>
    </header>
  );
}
