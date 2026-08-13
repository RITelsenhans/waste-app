import { appendFile, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const moduleDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(moduleDirectory, "../..");
const maximumInlineAttachmentBytes = 2_500_000;

export function buildMailPayload(report, reportHtml, options) {
  if (reportHtml.byteLength > maximumInlineAttachmentBytes) {
    throw new Error(
      `Der HTML-Bericht ist mit ${reportHtml.byteLength} Bytes zu groß für den begrenzten Microsoft-Graph-Direktversand.`,
    );
  }

  const recipients = splitRecipients(options.recipients);
  if (recipients.length === 0) throw new Error("Mindestens ein E-Mail-Empfänger ist erforderlich.");
  const status = mailStatus(report.overallStatus);
  const actionItems = report.findings.filter((finding) => finding.status !== "passed").slice(0, 5);
  const actions =
    actionItems.length === 0
      ? "<p><strong>Keine Maßnahme erforderlich.</strong> Der nächste Qualitätslauf prüft erneut.</p>"
      : `<ol>${actionItems
          .map(
            (finding) =>
              `<li><strong>${escapeHtml(finding.title)}</strong><br>${escapeHtml(finding.action ?? finding.recommendation ?? finding.finding)}<br><small>${escapeHtml(finding.deadline ?? "Zeitnah prüfen")}</small></li>`,
          )
          .join("")}</ol>`;

  return {
    message: {
      subject: `${status.subjectPrefix} Abfall APP – ${status.subject}`,
      body: {
        contentType: "HTML",
        content: `<!doctype html><html lang="de"><body style="font-family:Segoe UI,Arial,sans-serif;color:#17233a;line-height:1.5"><div style="max-width:720px;margin:auto"><div style="border-top:8px solid ${status.color};padding:20px;background:#f6f8fb"><p style="margin:0;color:${status.color};font-weight:700">${status.label}</p><h1 style="margin:4px 0 12px">Qualitätsbericht der Abfall APP</h1><p><strong>Ergebnis:</strong> ${report.statistics.passed}/${report.statistics.total} erfolgreich · ${report.statistics.warnings} Hinweise · ${report.statistics.failed} Fehler</p><p><strong>Workflow-Quelle:</strong> ${escapeHtml(report.workflowBranch)}<br><strong>Geprüfte Produktion:</strong> ${escapeHtml(report.productionBranch)}<br><strong>Revision:</strong> ${escapeHtml(report.revision)}<br><strong>Zeitpunkt:</strong> ${escapeHtml(formatTimestamp(report.generatedAt))}</p><h2>Was ist zu tun?</h2>${actions}<p><a href="${escapeHtml(options.artifactUrl)}" style="display:inline-block;padding:11px 16px;border-radius:22px;background:#008f8c;color:white;text-decoration:none;font-weight:700">Vollständigen Bericht herunterladen</a></p><p style="font-size:13px;color:#5f6b7a">Die animierte HTML-Auswertung ist zusätzlich angehängt. E-Mail-Programme führen ihre Animation aus Sicherheitsgründen nicht direkt in der Nachricht aus; bitte den Anhang lokal öffnen. Ein Zustellfehler dieser E-Mail ist kein Produktionsfehler der Anwendung.</p><p style="font-size:12px;color:#73808f">GitHub-Lauf: <a href="${escapeHtml(options.runUrl)}">${escapeHtml(options.runUrl)}</a></p></div></div></body></html>`,
      },
      toRecipients: recipients.map((address) => ({ emailAddress: { address } })),
      attachments: [
        {
          "@odata.type": "#microsoft.graph.fileAttachment",
          name: "quality-report.html",
          contentType: "text/html",
          contentBytes: reportHtml.toString("base64"),
        },
      ],
    },
    saveToSentItems: true,
  };
}

export async function sendWithMicrosoftGraph(config, payload, fetchImplementation = fetch) {
  const tokenResponse = await fetchImplementation(
    `https://login.microsoftonline.com/${encodeURIComponent(config.tenantId)}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }),
    },
  );
  if (!tokenResponse.ok) {
    throw new Error(
      `Microsoft-Identitätsplattform antwortet mit HTTP ${tokenResponse.status}: ${await safeErrorText(tokenResponse)}`,
    );
  }
  const token = await tokenResponse.json();
  if (typeof token.access_token !== "string" || token.access_token.length === 0) {
    throw new Error("Microsoft-Identitätsplattform lieferte kein Zugriffstoken.");
  }

  const mailResponse = await fetchImplementation(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(config.sender)}/sendMail`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
  if (mailResponse.status !== 202) {
    throw new Error(
      `Microsoft Graph lehnt den Mailversand mit HTTP ${mailResponse.status} ab: ${await safeErrorText(mailResponse)}`,
    );
  }
}

function mailStatus(status) {
  if (status === "failed") {
    return {
      color: "#b42318",
      label: "ROT · Produktionsabweichung nachgewiesen",
      subject: "Produktionsabweichung nachgewiesen",
      subjectPrefix: "[ROT]",
    };
  }
  if (status === "warning") {
    return {
      color: "#b26a00",
      label: "GELB · Hinweise oder Monitoring unvollständig",
      subject: "Hinweise oder Monitoring unvollständig",
      subjectPrefix: "[GELB]",
    };
  }
  return {
    color: "#2e7d32",
    label: "GRÜN · Qualitätslauf erfolgreich",
    subject: "Qualitätslauf erfolgreich",
    subjectPrefix: "[GRÜN]",
  };
}

function splitRecipients(value) {
  return String(value ?? "")
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatTimestamp(value) {
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function safeErrorText(response) {
  return (await response.text()).replaceAll(/\s+/g, " ").slice(0, 800) || "keine Details";
}

async function appendSummary(markdown) {
  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, `\n${markdown}\n`);
  } else {
    console.log(markdown);
  }
}

async function writeOutput(key, value) {
  if (process.env.GITHUB_OUTPUT) {
    await appendFile(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
  }
}

async function main() {
  const required = {
    tenantId: process.env.M365_TENANT_ID,
    clientId: process.env.M365_CLIENT_ID,
    clientSecret: process.env.M365_CLIENT_SECRET,
    sender: process.env.QUALITY_REPORT_EMAIL_SENDER,
    recipients: process.env.QUALITY_REPORT_EMAIL_TO,
    artifactUrl: process.env.REPORT_ARTIFACT_URL,
    runUrl: process.env.QUALITY_REPORT_RUN_URL,
  };
  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  if (missing.length > 0) {
    await writeOutput("configured", "false");
    await appendSummary(
      `## Berichtszustellung\n\n⚪ Microsoft-365-Versand noch nicht aktiviert. Fehlende Konfiguration: ${missing.join(", ")}.`,
    );
    return;
  }

  const reportPath = resolve(
    repositoryRoot,
    process.env.QUALITY_REPORT_JSON ?? "build/quality-agent/quality-report.json",
  );
  const htmlPath = resolve(
    repositoryRoot,
    process.env.QUALITY_REPORT_HTML ?? "build/quality-agent/quality-report.html",
  );
  try {
    const report = JSON.parse(await readFile(reportPath, "utf8"));
    const reportHtml = await readFile(htmlPath);
    const payload = buildMailPayload(report, reportHtml, required);
    await sendWithMicrosoftGraph(required, payload);
    await writeOutput("configured", "true");
    await writeOutput("delivered", "true");
    await appendSummary(
      `## Berichtszustellung\n\n✅ Microsoft 365 hat den Qualitätsbericht für den Versand angenommen.`,
    );
  } catch (error) {
    await writeOutput("configured", "true");
    await writeOutput("delivered", "false");
    await appendSummary(
      `## Berichtszustellung\n\n⚠️ Die Berichtsmail konnte nicht zugestellt werden. Das ist kein Produktionsfehler der Anwendung. Details stehen im Schritt **Qualitätsbericht per Microsoft 365 versenden**.`,
    );
    throw error;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
