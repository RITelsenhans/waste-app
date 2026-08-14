import { TenantViewPage } from "../../tenant-view-page";

export const dynamic = "force-dynamic";

export default function ContainerShopPage({ params }: { params: Promise<{ tenant: string }> }) {
  return <TenantViewPage params={params} view="containerShop" />;
}
