import assert from "node:assert/strict";
import test from "node:test";
import {
  equivalentRevisionsFromLog,
  resolveProductionRevision,
} from "../resolve-production-revision.mjs";

const expectedRevision = "a".repeat(40);
const equivalentRevision = "b".repeat(40);
const differentRevision = "c".repeat(40);
const expectedTree = "d".repeat(40);
const differentTree = "e".repeat(40);

test("collects only revisions with the expected Git tree", () => {
  const revisions = equivalentRevisionsFromLog(
    `${expectedRevision} ${expectedTree}\n${equivalentRevision} ${expectedTree}\n${differentRevision} ${differentTree}`,
    expectedRevision,
    expectedTree,
  );

  assert.deepEqual(revisions, [expectedRevision, equivalentRevision]);
});

test("resolves revision, tree and equivalent history through bounded git calls", () => {
  const calls = [];
  const result = resolveProductionRevision((arguments_) => {
    calls.push(arguments_);
    if (arguments_[0] === "rev-parse" && arguments_[1] === "HEAD") return expectedRevision;
    if (arguments_[0] === "rev-parse") return expectedTree;
    return `${expectedRevision} ${expectedTree}\n${equivalentRevision} ${expectedTree}`;
  });

  assert.deepEqual(result, {
    revision: expectedRevision,
    tree: expectedTree,
    equivalentRevisions: [expectedRevision, equivalentRevision],
  });
  assert.deepEqual(calls[2], ["log", "--max-count=1000", "--format=%H %T", "HEAD"]);
});

test("rejects malformed revision evidence", () => {
  assert.throws(() => equivalentRevisionsFromLog("", "not-a-revision", expectedTree), /ungültig/);
});
