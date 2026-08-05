import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const moduleDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(moduleDirectory, "../..");

export function buildQualityReport(liveReport, environment = process.env) {
  const findings = Array.isArray(liveReport.findings) ? liveReport.findings : [];
  const passed = findings.filter((finding) => finding.status === "passed").length;
  const failed = findings.filter((finding) => finding.status === "failed").length;
  return {
    schemaVersion: 1,
    generatedAt: liveReport.generatedAt ?? new Date().toISOString(),
    target: liveReport.target ?? environment.MONITOR_BASE_URL ?? "unbekannt",
    mode: liveReport.mode ?? "read-only-live",
    revision: environment.GITHUB_SHA?.slice(0, 12) ?? "lokaler Lauf",
    runNumber: environment.GITHUB_RUN_NUMBER ?? "lokal",
    overallStatus: failed === 0 && findings.length > 0 ? "passed" : "failed",
    statistics: {
      total: findings.length,
      passed,
      failed,
      durationMs: findings.reduce((total, finding) => total + Number(finding.durationMs ?? 0), 0),
    },
    findings,
  };
}

export function renderMarkdown(report) {
  const status = report.overallStatus === "passed" ? "✅ Erfolgreich" : "❌ Fehler gefunden";
  const rows = report.findings
    .map(
      (finding) =>
        `| ${finding.status === "passed" ? "✅" : "❌"} | ${escapeMarkdown(finding.title)} | ${escapeMarkdown(finding.finding)} | ${formatDuration(finding.durationMs)} |`,
    )
    .join("\n");
  return `# Qualitätsagent – ${status}

- Ziel: ${escapeMarkdown(report.target)}
- Zeitpunkt: ${formatTimestamp(report.generatedAt)}
- Revision: \`${report.revision}\`
- Ergebnis: ${report.statistics.passed}/${report.statistics.total} erfolgreich

| Status | Prüfschritt | Befund | Dauer |
| --- | --- | --- | ---: |
${rows || "| ❌ | Keine Prüfdaten | Der Lauf hat keine Findings erzeugt. | – |"}

Der vollständige, selbstständig animierte Bericht liegt im Workflow-Artefakt \`quality-agent-report\`.
`;
}

export function renderHtml(report) {
  const safeData = JSON.stringify(report).replaceAll("<", "\\u003c");
  const cards = report.findings
    .map(
      (finding, index) => `
        <article class="step" data-index="${index}" data-status="${escapeHtml(finding.status)}">
          <span class="step__number">${index + 1}</span>
          <div><small>${escapeHtml(finding.area)}</small><strong>${escapeHtml(finding.title)}</strong></div>
          <span class="step__state">${finding.status === "passed" ? "✓" : "!"}</span>
        </article>`,
    )
    .join("");
  const staticFindings = report.findings
    .map(
      (finding) => `
        <li class="finding finding--${escapeHtml(finding.status)}">
          <span aria-hidden="true">${finding.status === "passed" ? "✓" : "!"}</span>
          <div><strong>${escapeHtml(finding.title)}</strong><p>${escapeHtml(finding.finding)}</p></div>
          <time>${formatDuration(finding.durationMs)}</time>
        </li>`,
    )
    .join("");

  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Qualitätsagent – ${report.overallStatus === "passed" ? "Erfolgreich" : "Findings"}</title>
  <style>
    :root { color-scheme: dark; --petrol:#073b4c; --teal:#00a6a6; --amber:#ffb000; --red:#c8102e; --mint:#7be0c3; --ink:#08232d; --paper:#f5fbfa; }
    * { box-sizing:border-box; }
    body { margin:0; min-width:320px; color:#eefafa; background:radial-gradient(circle at 15% 5%,#176879 0,transparent 28rem),linear-gradient(145deg,#052933,#071a22 72%); font:16px/1.5 Inter,ui-sans-serif,system-ui,-apple-system,sans-serif; }
    main { width:min(1180px,calc(100% - 32px)); margin:auto; padding:40px 0 64px; }
    .hero { display:grid; grid-template-columns:1.7fr .7fr; gap:24px; align-items:stretch; }
    .panel { border:1px solid rgba(255,255,255,.13); border-radius:28px; background:rgba(7,59,76,.76); box-shadow:0 24px 80px rgba(0,0,0,.28); backdrop-filter:blur(18px); }
    .hero__copy { padding:clamp(28px,5vw,56px); position:relative; overflow:hidden; }
    .hero__copy::after { content:""; position:absolute; width:260px; height:260px; right:-100px; top:-120px; border:48px solid rgba(0,166,166,.2); border-radius:50%; }
    .eyebrow { color:var(--mint); font-weight:800; letter-spacing:.12em; text-transform:uppercase; }
    h1 { max-width:780px; margin:.15em 0; font-size:clamp(2.25rem,6vw,5rem); line-height:.98; }
    .lead { max-width:720px; color:#bcd3d8; font-size:1.08rem; }
    .overall { padding:28px; display:flex; flex-direction:column; justify-content:center; text-align:center; }
    .ring { --score:${Math.round((report.statistics.passed / Math.max(1, report.statistics.total)) * 100)}%; width:160px; aspect-ratio:1; margin:0 auto 18px; display:grid; place-items:center; border-radius:50%; background:conic-gradient(${report.overallStatus === "passed" ? "var(--teal)" : "var(--red)"} var(--score),rgba(255,255,255,.12) 0); position:relative; }
    .ring::before { content:""; position:absolute; inset:13px; border-radius:inherit; background:var(--petrol); }
    .ring strong { position:relative; font-size:2.3rem; }
    .meta { display:flex; flex-wrap:wrap; gap:10px; margin-top:24px; }
    .pill { padding:8px 13px; border-radius:999px; color:#cce2e5; background:rgba(255,255,255,.08); }
    .stage { margin-top:28px; padding:26px; overflow:hidden; }
    .stage h2,.details h2 { margin:0 0 6px; font-size:1.4rem; }
    .stage__hint { margin:0 0 22px; color:#aac9ce; }
    .timeline { display:flex; gap:12px; overflow-x:auto; padding:2px 2px 18px; scrollbar-color:var(--teal) transparent; }
    .step { flex:0 0 215px; min-height:92px; display:grid; grid-template-columns:auto 1fr auto; gap:11px; align-items:center; padding:15px; border:1px solid rgba(255,255,255,.11); border-radius:18px; color:#a9c2c8; background:#092e39; transform:translateY(0); transition:.45s ease; }
    .step small,.step strong { display:block; }
    .step small { color:#78aab2; }
    .step__number,.step__state { display:grid; place-items:center; width:32px; height:32px; border-radius:50%; background:rgba(255,255,255,.08); font-weight:900; }
    .step.is-active { color:white; border-color:var(--amber); box-shadow:0 12px 36px rgba(255,176,0,.18); transform:translateY(-4px); }
    .step.is-active .step__number { color:var(--ink); background:var(--amber); }
    .step[data-status="passed"] .step__state { color:var(--mint); }
    .step[data-status="failed"] .step__state { color:white; background:var(--red); }
    .progress { height:7px; border-radius:999px; background:rgba(255,255,255,.1); overflow:hidden; }
    .progress i { display:block; width:0; height:100%; border-radius:inherit; background:linear-gradient(90deg,var(--teal),var(--amber)); transition:width .5s ease; }
    .spotlight { min-height:230px; margin-top:20px; padding:clamp(22px,4vw,38px); display:grid; grid-template-columns:88px 1fr auto; gap:24px; align-items:center; border-radius:24px; color:var(--ink); background:linear-gradient(135deg,#f8fffe,#d8f7ef); }
    .spotlight.is-failed { color:white; background:linear-gradient(135deg,#8d0b22,var(--red)); }
    .spotlight__icon { display:grid; place-items:center; width:76px; height:76px; border-radius:24px; color:white; background:var(--teal); font-size:2.4rem; font-weight:900; box-shadow:0 12px 28px rgba(0,0,0,.18); }
    .spotlight.is-failed .spotlight__icon { background:#4c0714; }
    .spotlight small { font-weight:900; letter-spacing:.08em; text-transform:uppercase; opacity:.72; }
    .spotlight h3 { margin:2px 0 6px; font-size:clamp(1.45rem,3vw,2.3rem); line-height:1.05; }
    .spotlight p { margin:0; max-width:760px; font-size:1.08rem; }
    .spotlight time { font-weight:800; white-space:nowrap; }
    .details { margin-top:28px; padding:26px; }
    .findings { list-style:none; padding:0; margin:20px 0 0; display:grid; gap:10px; }
    .finding { display:grid; grid-template-columns:38px 1fr auto; gap:14px; align-items:start; padding:16px; border-radius:15px; background:rgba(255,255,255,.06); }
    .finding > span { display:grid; place-items:center; width:30px; height:30px; border-radius:50%; color:var(--ink); background:var(--mint); font-weight:900; }
    .finding--failed > span { color:white; background:var(--red); }
    .finding p { margin:3px 0 0; color:#bdd3d7; }
    .finding time { color:#8db0b6; white-space:nowrap; }
    footer { margin-top:24px; color:#90acb2; font-size:.9rem; }
    @media (max-width:760px) { .hero { grid-template-columns:1fr; } .spotlight { grid-template-columns:58px 1fr; } .spotlight__icon { width:54px;height:54px;border-radius:16px; } .spotlight time { grid-column:2; } .finding { grid-template-columns:34px 1fr; } .finding time { grid-column:2; } }
    @media (prefers-reduced-motion:reduce) { *,*::before,*::after { scroll-behavior:auto!important; transition:none!important; animation:none!important; } }
  </style>
</head>
<body>
  <main>
    <section class="hero">
      <div class="panel hero__copy">
        <p class="eyebrow">Regio IT · autonomer Qualitätslauf</p>
        <h1>Was funktioniert – und wo müssen wir handeln?</h1>
        <p class="lead">Die Prüfung läuft zweimal täglich lesend durch die veröffentlichte Demo. Unten wechseln die Schritte automatisch; kein Durchklicken nötig.</p>
        <div class="meta"><span class="pill">${escapeHtml(formatTimestamp(report.generatedAt))}</span><span class="pill">Revision ${escapeHtml(report.revision)}</span><span class="pill">${escapeHtml(report.target)}</span></div>
      </div>
      <aside class="panel overall">
        <div class="ring"><strong>${report.statistics.passed}/${report.statistics.total}</strong></div>
        <strong>${report.overallStatus === "passed" ? "Alle Checks erfolgreich" : `${report.statistics.failed} Findings`}</strong>
        <span>${formatDuration(report.statistics.durationMs)} Prüfzeit</span>
      </aside>
    </section>

    <section class="panel stage" aria-labelledby="stage-title">
      <h2 id="stage-title">Automatischer Prüfablauf</h2>
      <p class="stage__hint">Der Fokus wandert selbstständig von links nach rechts und beginnt anschließend erneut.</p>
      <div class="timeline">${cards}</div>
      <div class="progress" aria-hidden="true"><i></i></div>
      <article class="spotlight" aria-live="off">
        <span class="spotlight__icon">✓</span>
        <div><small>Prüfung</small><h3>Bericht wird vorbereitet</h3><p>Die Findings erscheinen automatisch.</p></div>
        <time>0 ms</time>
      </article>
    </section>

    <section class="panel details">
      <h2>Alle Findings auf einen Blick</h2>
      <p class="stage__hint">Statische, druckbare Fassung für Nachweis und Nacharbeit.</p>
      <ol class="findings">${staticFindings || "<li>Keine Prüfdaten vorhanden.</li>"}</ol>
    </section>
    <footer>Read-only-Live-Prüfung · Keine Testvorgänge erzeugt · Keine automatische Codeänderung oder Veröffentlichung</footer>
  </main>
  <script>
    const report = ${safeData};
    const steps = [...document.querySelectorAll('.step')];
    const spotlight = document.querySelector('.spotlight');
    const progress = document.querySelector('.progress i');
    let active = 0;
    function show(index) {
      if (!report.findings.length) return;
      const finding = report.findings[index];
      steps.forEach((step, current) => step.classList.toggle('is-active', current === index));
      const selected = steps[index];
      selected?.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'nearest', inline:'center'});
      spotlight.classList.toggle('is-failed', finding.status === 'failed');
      spotlight.querySelector('.spotlight__icon').textContent = finding.status === 'passed' ? '✓' : '!';
      spotlight.querySelector('small').textContent = finding.area;
      spotlight.querySelector('h3').textContent = finding.title;
      spotlight.querySelector('p').textContent = finding.finding;
      spotlight.querySelector('time').textContent = new Intl.NumberFormat('de-DE').format(finding.durationMs) + ' ms';
      progress.style.width = ((index + 1) / report.findings.length * 100) + '%';
    }
    show(active);
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches && report.findings.length > 1) {
      setInterval(() => { active = (active + 1) % report.findings.length; show(active); }, 3200);
    }
  </script>
</body>
</html>`;
}

function formatTimestamp(value) {
  try {
    return new Intl.DateTimeFormat("de-DE", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Europe/Berlin",
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}

function formatDuration(value) {
  const duration = Number(value ?? 0);
  return duration >= 1000 ? `${(duration / 1000).toFixed(1)} s` : `${duration} ms`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeMarkdown(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

async function main() {
  const input = resolve(
    repositoryRoot,
    process.argv[2] ?? "build/quality-agent/live-findings.json",
  );
  const outputDirectory = resolve(repositoryRoot, process.argv[3] ?? "build/quality-agent");
  let liveReport;
  try {
    liveReport = JSON.parse(await readFile(input, "utf8"));
  } catch (error) {
    liveReport = {
      generatedAt: new Date().toISOString(),
      target: process.env.MONITOR_BASE_URL ?? "unbekannt",
      mode: "monitor-bootstrap-failure",
      findings: [
        {
          id: "report-input",
          area: "Agent",
          title: "Prüfdaten erzeugen",
          status: "failed",
          finding: `Der Live-Lauf hat keine lesbare Ergebnisdatei erzeugt: ${error instanceof Error ? error.message : String(error)}`,
          durationMs: 0,
        },
      ],
    };
  }
  const report = buildQualityReport(liveReport);
  await mkdir(outputDirectory, { recursive: true });
  await Promise.all([
    writeFile(resolve(outputDirectory, "quality-report.json"), JSON.stringify(report, null, 2)),
    writeFile(resolve(outputDirectory, "quality-report.html"), renderHtml(report)),
    writeFile(resolve(outputDirectory, "quality-summary.md"), renderMarkdown(report)),
  ]);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
