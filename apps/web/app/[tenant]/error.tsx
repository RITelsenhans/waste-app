"use client";

import { Action, Card } from "@waste/ui";

export default function TenantError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="centered-state">
      <Card className="state-card" role="alert">
        <p className="eyebrow">Technischer Fehler</p>
        <h1>Die Mandantenkonfiguration ist gerade nicht erreichbar.</h1>
        <p>Stellen Sie sicher, dass die lokale API läuft, und versuchen Sie es erneut.</p>
        <Action onClick={reset}>Erneut versuchen</Action>
      </Card>
    </main>
  );
}
