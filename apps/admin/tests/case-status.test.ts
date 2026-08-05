import { describe, expect, it } from "vitest";
import { nextStatus } from "../lib/case-status";

describe("canonical pilot status progression", () => {
  it("moves a received case through review and processing to closure", () => {
    const progression = ["received"];
    let current = "received";
    while (nextStatus[current]) {
      current = nextStatus[current].status;
      progression.push(current);
    }

    expect(progression).toEqual(["received", "in-review", "in-progress", "completed", "closed"]);
  });
});
