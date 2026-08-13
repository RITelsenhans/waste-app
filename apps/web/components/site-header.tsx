"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@waste/ui";
import { CLIENT_API_BASE_URL as API } from "../lib/client-api";
import type { TenantConfig } from "../lib/tenant-config";
import type { CitizenView } from "./citizen-pilot";

type SiteHeaderProps = {
  addressLabel?: string;
  config: TenantConfig;
  tenantKey: string;
  view: CitizenView;
};

type Municipality = {
  tenantId: string;
  name: string;
  city: string;
};

const navigation: { href: string; label: string; view: CitizenView }[] = [
  { href: "", label: "Start", view: "home" },
  { href: "/kalender", label: "Kalender", view: "calendar" },
  { href: "/abfall-abc", label: "Abfall-ABC", view: "guide" },
  { href: "/standorte", label: "Standorte", view: "sites" },
  { href: "/services", label: "Services", view: "services" },
];

export function SiteHeader({ addressLabel, config, tenantKey, view }: SiteHeaderProps) {
  const municipalityDisplayName = config.name.replace(/\s*·\s*Pilot\s*$/iu, "");
  const servicesActive = ["services", "sorting", "complaint", "bulk", "access"].includes(view);
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
          aria-label={`${municipalityDisplayName} – Startseite`}
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
          <span className="brand-copy">
            <strong>Abfall &amp; Recycling</strong>
            <small>{municipalityDisplayName}</small>
          </span>
        </Link>
        <nav className="desktop-nav" aria-label="Hauptnavigation">
          {navigation.map((item) => (
            <Link
              aria-current={
                view === item.view || (item.view === "services" && servicesActive)
                  ? "page"
                  : undefined
              }
              href={`/${tenantKey}${item.href}`}
              key={item.view}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="header-context">
          {municipalities.length > 1 && (
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
          )}
          {addressLabel && (
            <Link className="address-label" href={`/${tenantKey}#adresse`}>
              <Icon aria-hidden="true" name="map-pin" />
              <span>
                <small>Abholadresse</small>
                {addressLabel}
              </span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
