import { notFound } from "next/navigation";
import { CitizenPilot, type CitizenView } from "../../components/citizen-pilot";
import {
  getTenantConfig,
  TenantConfigNotFoundError,
  type TenantConfig,
} from "../../lib/tenant-config";

async function loadTenant(tenant: string): Promise<TenantConfig> {
  try {
    return await getTenantConfig(tenant);
  } catch (error) {
    if (error instanceof TenantConfigNotFoundError) notFound();
    throw error;
  }
}

export async function TenantViewPage({
  params,
  view,
}: {
  params: Promise<{ tenant: string }>;
  view: CitizenView;
}) {
  const { tenant } = await params;
  const config = await loadTenant(tenant);
  return <CitizenPilot config={config} tenantKey={tenant} view={view} />;
}
