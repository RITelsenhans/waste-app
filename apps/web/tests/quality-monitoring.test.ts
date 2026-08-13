import { describe, expect, it } from "vitest";
import { assessProductionRevision, compareProductionRevision } from "../lib/quality-monitoring";

describe("quality monitoring preconditions", () => {
  it("accepts a complete Git revision", () => {
    expect(assessProductionRevision("a".repeat(40))).toEqual({
      available: true,
      revision: "a".repeat(40),
      tree: undefined,
      equivalentRevisions: ["a".repeat(40)],
    });
  });

  it("accepts an exact deployment revision", () => {
    const expectation = assessProductionRevision("a".repeat(40), "c".repeat(40));
    expect(expectation.available).toBe(true);
    if (expectation.available) {
      expect(compareProductionRevision("a".repeat(40), expectation)).toBe("exact");
    }
  });

  it("accepts a different commit only with repository-proven tree equivalence", () => {
    const expectation = assessProductionRevision(
      "a".repeat(40),
      "c".repeat(40),
      `${"a".repeat(40)},${"b".repeat(40)},not-a-sha`,
    );
    expect(expectation.available).toBe(true);
    if (expectation.available) {
      expect(compareProductionRevision("b".repeat(40), expectation)).toBe("equivalent");
      expect(compareProductionRevision("d".repeat(40), expectation)).toBe("mismatch");
    }
  });

  it("fails closed when tree evidence is missing", () => {
    const expectation = assessProductionRevision(
      "a".repeat(40),
      undefined,
      `${"a".repeat(40)},${"b".repeat(40)}`,
    );
    expect(expectation.available).toBe(true);
    if (expectation.available) {
      expect(compareProductionRevision("b".repeat(40), expectation)).toBe("mismatch");
    }
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
