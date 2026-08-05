import { notFound } from "next/navigation";
import { CitizenPilot } from "../../components/citizen-pilot";
import {
  getTenantConfig,
  TenantConfigNotFoundError,
  type TenantConfig,
} from "../../lib/tenant-config";

export const dynamic = "force-dynamic";

type TenantPageProps = { params: Promise<{ tenant: string }> };

async function loadTenant(tenant: string): Promise<TenantConfig> {
  try {
    return await getTenantConfig(tenant);
  } catch (error) {
    if (error instanceof TenantConfigNotFoundError) notFound();
    throw error;
  }
}

export default async function TenantPage({ params }: TenantPageProps) {
  const { tenant } = await params;
  const config = await loadTenant(tenant);
  return <CitizenPilot config={config} tenantKey={tenant} />;
}
