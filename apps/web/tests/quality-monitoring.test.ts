import { describe, expect, it } from "vitest";
import { assessProductionRevision } from "../lib/quality-monitoring";

describe("quality monitoring preconditions", () => {
  it("accepts a complete Git revision", () => {
    expect(assessProductionRevision("a".repeat(40))).toEqual({
      available: true,
      revision: "a".repeat(40),
    });
  });

  it.each([undefined, "", "main", "abc123"])(
    "classifies missing or malformed revision %s as an unavailable monitor signal",
    (revision) => {
      const result = assessProductionRevision(revision);
      expect(result.available).toBe(false);
      if (!result.available) {
        expect(result.finding).toContain("Agent prüft die erreichbaren Funktionen weiter");
        expect(result.finding).not.toContain("Anwendung ist ausgefallen");
      }
    },
  );
});
