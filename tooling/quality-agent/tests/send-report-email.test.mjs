import assert from "node:assert/strict";
import { test } from "node:test";
import { buildMailPayload, sendWithMicrosoftGraph } from "../send-report-email.mjs";

const report = {
  generatedAt: "2026-08-09T08:00:00Z",
  overallStatus: "warning",
  productionBranch: "feat/produktion",
  revision: "abcdef123456",
  workflowBranch: "main",
  statistics: { total: 2, passed: 1, warnings: 1, failed: 0 },
  findings: [
    {
      title: "Monitoring <prüfen>",
      status: "warning",
      action: "Revision nachreichen.",
      deadline: "Innerhalb 1 Arbeitstags",
    },
  ],
};

test("baut eine klassifizierte Microsoft-Graph-Mail mit HTML-Anhang", () => {
  const payload = buildMailPayload(report, Buffer.from("<html>Bericht</html>"), {
    recipients: "one@example.invalid; two@example.invalid",
    artifactUrl: "https://example.invalid/artifact",
    runUrl: "https://example.invalid/run",
  });

  assert.match(payload.message.subject, /^\[GELB\]/);
  assert.deepEqual(
    payload.message.toRecipients.map((recipient) => recipient.emailAddress.address),
    ["one@example.invalid", "two@example.invalid"],
  );
  assert.match(payload.message.body.content, /Monitoring &lt;prüfen&gt;/);
  assert.match(payload.message.body.content, /Innerhalb 1 Arbeitstags/);
  assert.equal(payload.message.attachments[0].name, "quality-report.html");
  assert.equal(
    Buffer.from(payload.message.attachments[0].contentBytes, "base64").toString(),
    "<html>Bericht</html>",
  );
  assert.equal(payload.saveToSentItems, true);
});

test("sendet per Client-Credentials ausschließlich an die Graph-sendMail-Route", async () => {
  const requests = [];
  const fakeFetch = async (url, options) => {
    requests.push({ url, options });
    if (requests.length === 1) {
      return new Response(JSON.stringify({ access_token: "test-token" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(null, { status: 202 });
  };

  await sendWithMicrosoftGraph(
    {
      tenantId: "tenant-id",
      clientId: "client-id",
      clientSecret: "client-secret",
      sender: "sender@example.invalid",
    },
    { message: { subject: "Test" }, saveToSentItems: true },
    fakeFetch,
  );

  assert.equal(requests.length, 2);
  assert.match(requests[0].url, /login\.microsoftonline\.com\/tenant-id/);
  assert.equal(requests[0].options.body.get("scope"), "https://graph.microsoft.com/.default");
  assert.match(
    requests[1].url,
    /graph\.microsoft\.com\/v1\.0\/users\/sender%40example\.invalid\/sendMail$/,
  );
  assert.equal(requests[1].options.headers.Authorization, "Bearer test-token");
});

test("weist einen abgelehnten Graph-Versand ohne Preisgabe des Secrets aus", async () => {
  let call = 0;
  const fakeFetch = async () => {
    call += 1;
    if (call === 1) {
      return new Response(JSON.stringify({ access_token: "test-token" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response("Forbidden", { status: 403 });
  };

  await assert.rejects(
    sendWithMicrosoftGraph(
      {
        tenantId: "tenant-id",
        clientId: "client-id",
        clientSecret: "do-not-log-this-secret",
        sender: "sender@example.invalid",
      },
      { message: { subject: "Test" } },
      fakeFetch,
    ),
    (error) => {
      assert.match(error.message, /HTTP 403/);
      assert.doesNotMatch(error.message, /do-not-log-this-secret/);
      return true;
    },
  );
});
