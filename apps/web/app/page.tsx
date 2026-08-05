import Link from "next/link";

type Municipality = {
  tenantId: string;
  name: string;
  city: string;
  primaryColor: string;
};

const API = (process.env.API_BASE_URL ?? "http://localhost:8080").replace(/\/+$/, "");

export default async function RootPage() {
  const municipalities = await fetch(`${API}/v1/tenants`, { cache: "no-store" })
    .then((response) => (response.ok ? (response.json() as Promise<Municipality[]>) : []))
    .catch(() => [] as Municipality[]);

  return (
    <main className="municipality-chooser">
      <div>
        <p className="eyebrow">Abfall APP</p>
        <h1>Welche Kommune möchten Sie öffnen?</h1>
        <p>Ohne Anmeldung: Wählen Sie eine teilnehmende Stadt oder Gemeinde.</p>
        <div className="municipality-grid">
          {municipalities.map((municipality) => (
            <Link
              href={`/${municipality.tenantId}`}
              key={municipality.tenantId}
              style={{ borderColor: municipality.primaryColor }}
            >
              <span style={{ background: municipality.primaryColor }} aria-hidden="true" />
              <strong>{municipality.name}</strong>
              <small>{municipality.city}</small>
            </Link>
          ))}
          {municipalities.length === 0 && (
            <Link href="/demo">
              <strong>Demo-Kommune öffnen</strong>
              <small>Lokaler Pilot</small>
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
