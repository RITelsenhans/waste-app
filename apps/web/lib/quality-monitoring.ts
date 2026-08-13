export type ProductionRevisionExpectation =
  | {
      available: true;
      revision: string;
      tree?: string;
      equivalentRevisions: readonly string[];
    }
  | { available: false; finding: string };

const REVISION_PATTERN = /^[0-9a-f]{40}$/;

export function assessProductionRevision(
  value: string | undefined,
  treeValue?: string,
  equivalentValues?: string,
): ProductionRevisionExpectation {
  if (value && REVISION_PATTERN.test(value)) {
    const equivalentRevisions = new Set([value]);
    for (const candidate of equivalentValues?.split(",") ?? []) {
      const normalized = candidate.trim().toLowerCase();
      if (REVISION_PATTERN.test(normalized)) equivalentRevisions.add(normalized);
    }

    return {
      available: true,
      revision: value,
      tree: treeValue && REVISION_PATTERN.test(treeValue) ? treeValue : undefined,
      equivalentRevisions: [...equivalentRevisions],
    };
  }

  return {
    available: false,
    finding:
      "Die erwartete Produktionsrevision wurde vom Workflow nicht bereitgestellt. " +
      "Der Agent prüft die erreichbaren Funktionen weiter, kann den neuesten Push in diesem Lauf aber nicht verifizieren.",
  };
}

export type ProductionRevisionMatch = "exact" | "equivalent" | "mismatch";

export function compareProductionRevision(
  deployedRevision: string,
  expectation: Extract<ProductionRevisionExpectation, { available: true }>,
): ProductionRevisionMatch {
  if (deployedRevision === expectation.revision) return "exact";
  if (expectation.tree && expectation.equivalentRevisions.includes(deployedRevision)) {
    return "equivalent";
  }
  return "mismatch";
}
