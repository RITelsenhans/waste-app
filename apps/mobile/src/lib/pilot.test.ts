import type { CollectionEvent } from "@waste/api-client";
import { describe, expect, it } from "vitest";
import { formatCollectionDate, nextCollection } from "./pilot";

function collection(
  id: string,
  effectiveDate: string,
  status: CollectionEvent["status"] = "planned",
): CollectionEvent {
  return {
    addressId: "demo-musterstrasse-12",
    effectiveDate,
    id,
    lastModified: "2026-10-19T08:00:00Z",
    plannedDate: effectiveDate,
    publicationStatus: "published",
    publicationUpdatedAt: "2026-10-19T08:00:00Z",
    status,
    wasteTypeId: "residual",
    wasteTypeLabel: "Restabfall",
  };
}

describe("mobile pilot helpers", () => {
  it("selects the nearest non-cancelled future collection", () => {
    const result = nextCollection(
      [
        collection("later", "2026-10-23"),
        collection("cancelled", "2026-10-20", "cancelled"),
        collection("next", "2026-10-21"),
      ],
      new Date(2026, 9, 19),
    );

    expect(result?.id).toBe("next");
  });

  it("formats API dates without a timezone day shift", () => {
    expect(formatCollectionDate("2026-10-20")).toContain("20. Oktober");
  });
});
