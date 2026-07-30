import { Action, Card } from "@waste/ui";

export default function NotFound() {
  return (
    <main className="centered-state">
      <Card className="state-card">
        <p className="eyebrow">Mandant nicht gefunden</p>
        <h1>Dieser Einstieg ist nicht konfiguriert.</h1>
        <p>Prüfen Sie den Link oder wechseln Sie zum bereitgestellten Demo-Mandanten.</p>
        <Action href="/demo">Demo öffnen</Action>
      </Card>
    </main>
  );
}
