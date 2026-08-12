import { TenantViewPage } from "../tenant-view-page";

export const dynamic = "force-dynamic";

export default function CalendarPage({ params }: { params: Promise<{ tenant: string }> }) {
  return <TenantViewPage params={params} view="calendar" />;
}
