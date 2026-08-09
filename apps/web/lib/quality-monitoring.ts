export type ProductionRevisionExpectation =
  { available: true; revision: string } | { available: false; finding: string };

export function assessProductionRevision(value: string | undefined): ProductionRevisionExpectation {
  if (value && /^[0-9a-f]{40}$/.test(value)) {
    return { available: true, revision: value };
  }

  return {
    available: false,
    finding:
      "Die erwartete Produktionsrevision wurde vom Workflow nicht bereitgestellt. " +
      "Der Agent prüft die erreichbaren Funktionen weiter, kann den neuesten Push in diesem Lauf aber nicht verifizieren.",
  };
}
