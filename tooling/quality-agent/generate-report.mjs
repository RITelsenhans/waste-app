import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const moduleDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(moduleDirectory, "../..");

export function buildQualityReport(liveReport, environment = process.env) {
  const findings = Array.isArray(liveReport.findings) ? liveReport.findings.map(enrichFinding) : [];
  const passed = findings.filter((finding) => finding.status === "passed").length;
  const warnings = findings.filter((finding) => finding.status === "warning").length;
  const failed = findings.filter((finding) => finding.status === "failed").length;
  return {
    schemaVersion: 1,
    generatedAt: liveReport.generatedAt ?? new Date().toISOString(),
    target: liveReport.target ?? environment.MONITOR_BASE_URL ?? "unbekannt",
    mode: liveReport.mode ?? "read-only-live",
    revision:
      (
        environment.QUALITY_REPORT_REVISION ??
        environment.EXPECTED_PRODUCTION_REVISION ??
        liveReport.revision ??
        environment.GITHUB_SHA
      )?.slice(0, 12) ?? "lokaler Lauf",
    productionBranch:
      environment.QUALITY_REPORT_BRANCH ?? liveReport.productionBranch ?? "lokaler Stand",
    workflowBranch:
      environment.QUALITY_WORKFLOW_BRANCH ??
      liveReport.workflowBranch ??
      environment.GITHUB_REF_NAME ??
      "lokaler Start",
    runNumber: environment.GITHUB_RUN_NUMBER ?? "lokal",
    overallStatus:
      failed > 0 || findings.length === 0 ? "failed" : warnings > 0 ? "warning" : "passed",
    statistics: {
      total: findings.length,
      passed,
      warnings,
      failed,
      durationMs: findings.reduce((total, finding) => total + Number(finding.durationMs ?? 0), 0),
    },
    findings,
  };
}

export function renderMarkdown(report) {
  const status =
    report.overallStatus === "passed"
      ? "✅ Erfolgreich"
      : report.overallStatus === "warning"
        ? "⚠️ Hinweise vorhanden"
        : "❌ Fehler gefunden";
  const rows = report.findings
    .map(
      (finding) =>
        `| ${statusIcon(finding.status)} | ${escapeMarkdown(finding.title)} | ${escapeMarkdown(finding.finding)} | ${formatDuration(finding.durationMs)} |`,
    )
    .join("\n");
  return `# Qualitätsagent – ${status}

- Ziel: ${escapeMarkdown(report.target)}
- Prüflauf: ${formatTimestamp(report.generatedAt)}
- Workflow-Quelle: \`${escapeMarkdown(report.workflowBranch)}\`
- Geprüfte Produktion: \`${escapeMarkdown(report.productionBranch)}\`
- Geprüfte Revision: \`${report.revision}\`
- Ergebnis: ${report.statistics.passed}/${report.statistics.total} erfolgreich

| Status | Prüfschritt | Befund | Dauer |
| --- | --- | --- | ---: |
${rows || "| ❌ | Keine Prüfdaten | Der Lauf hat keine Findings erzeugt. | – |"}

Der vollständige, selbstständig animierte Bericht wird unterhalb dieser Zusammenfassung
als direkt anklickbares Workflow-Artefakt \`quality-agent-report\` verlinkt.
`;
}

export function renderHtml(report) {
  const safeData = JSON.stringify(report).replaceAll("<", "\\u003c");
  const actionItems = report.findings
    .filter((finding) => finding.status !== "passed")
    .sort((left, right) => actionRank(left.actionPriority) - actionRank(right.actionPriority));
  const visibleActionItems = actionItems.slice(0, 4);
  const stations = report.findings
    .map(
      (finding, index) => `
        <button class="station" type="button" data-index="${index}" data-status="${escapeHtml(finding.status)}" aria-label="Prüfschritt ${index + 1}: ${escapeHtml(finding.title)}">
          <span class="station__dot" data-result="${finding.status === "passed" ? "✓" : finding.status === "warning" ? "?" : "!"}"></span>
          <span class="station__number">${index + 1}</span>
        </button>`,
    )
    .join("");
  const resultItems = report.findings
    .map(
      (finding, index) => `
        <li class="result-item result-item--${escapeHtml(finding.status)}" data-index="${index}">
          <button type="button" aria-label="Details zu ${escapeHtml(finding.title)} öffnen">
            <span class="result-item__icon" aria-hidden="true">${finding.status === "passed" ? "✓" : finding.status === "warning" ? "?" : "!"}</span>
            <span class="result-item__copy"><small>${escapeHtml(finding.area)}</small><strong>${escapeHtml(finding.title)}</strong></span>
            <time>${formatDuration(finding.durationMs)}</time>
          </button>
        </li>`,
    )
    .join("");
  const todoItems = visibleActionItems
    .map(
      (finding) => `
        <button class="todo-card todo-card--${escapeHtml(finding.actionPriority)}" type="button" data-finding-id="${escapeHtml(finding.id)}">
          <span class="todo-card__priority">${escapeHtml(finding.actionLabel)}</span>
          <strong>${escapeHtml(finding.title)}</strong>
          <span class="todo-card__action">${escapeHtml(finding.action)}</span>
          <span class="todo-card__deadline">Zeitfenster: ${escapeHtml(finding.deadline)}</span>
        </button>`,
    )
    .join("");
  const completionSummary =
    report.statistics.failed > 0
      ? `${report.statistics.failed} Fehler müssen bearbeitet werden; ${report.statistics.warnings} weitere Hinweise sind einzuplanen.`
      : report.statistics.warnings > 0
        ? `Kein akuter Ausfall. ${report.statistics.warnings} Hinweise sollten geplant bearbeitet werden.`
        : "Keine Maßnahme erforderlich. Der nächste automatische Lauf kontrolliert den Zustand erneut.";

  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Qualitätsagent – ${report.overallStatus === "passed" ? "Erfolgreich" : report.overallStatus === "warning" ? "Hinweise" : "Findings"}</title>
  <style>
    :root { color-scheme:dark; --petrol:#073b4c; --night:#061a22; --teal:#00a6a6; --amber:#ffb000; --red:#c8102e; --mint:#7be0c3; --ink:#08232d; --paper:#f5fbfa; }
    * { box-sizing:border-box; }
    html,body { width:100%; height:100%; overflow:hidden; }
    body { margin:0; min-width:320px; color:#eefafa; background:radial-gradient(circle at 12% 0,#176879 0,transparent 28rem),linear-gradient(145deg,#052933,var(--night) 72%); font:16px/1.38 Inter,ui-sans-serif,system-ui,-apple-system,sans-serif; }
    main { width:min(1500px,100%); height:100dvh; margin:auto; padding:10px; }
    .panel { border:1px solid rgba(255,255,255,.13); border-radius:26px; background:rgba(7,59,76,.78); box-shadow:0 22px 70px rgba(0,0,0,.28); backdrop-filter:blur(18px); }
    .showcase { height:100%; padding:clamp(14px,1.8vw,24px); display:grid; grid-template-rows:auto auto minmax(0,1fr) auto; gap:clamp(8px,1.1vh,14px); overflow:hidden; position:relative; }
    .showcase::after { content:""; position:absolute; width:240px; height:240px; right:-110px; top:-120px; border:42px solid rgba(0,166,166,.13); border-radius:50%; pointer-events:none; }
    .showcase__header { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:24px; align-items:start; position:relative; z-index:1; }
    .eyebrow { margin:0 0 4px; color:var(--mint); font-size:.78rem; font-weight:900; letter-spacing:.13em; text-transform:uppercase; }
    h1 { margin:0; font-size:clamp(1.85rem,3.5vw,3.4rem); line-height:.98; letter-spacing:-.035em; }
    .lead { max-width:700px; margin:8px 0 0; color:#bed6da; font-size:clamp(.92rem,1.5vw,1.06rem); }
    .score { min-width:190px; display:grid; grid-template-columns:66px 1fr; gap:12px; align-items:center; padding:10px 14px; border:1px solid rgba(255,255,255,.12); border-radius:20px; background:rgba(3,29,37,.58); }
    .ring { --score:${Math.round(((report.statistics.passed + (report.statistics.warnings ?? 0)) / Math.max(1, report.statistics.total)) * 100)}%; width:66px; aspect-ratio:1; display:grid; place-items:center; border-radius:50%; background:conic-gradient(${report.overallStatus === "passed" ? "var(--teal)" : report.overallStatus === "warning" ? "var(--amber)" : "var(--red)"} var(--score),rgba(255,255,255,.12) 0); position:relative; }
    .ring::before { content:""; position:absolute; inset:7px; border-radius:inherit; background:var(--petrol); }
    .ring strong { position:relative; font-size:1.1rem; }
    .score span,.score strong { display:block; }
    .score span { color:#a9c8cd; font-size:.8rem; }
    .meta { display:flex; flex-wrap:wrap; gap:8px; }
    .pill { padding:6px 11px; border-radius:999px; color:#cce2e5; background:rgba(255,255,255,.075); font-size:.78rem; }
    .workspace { min-height:0; display:grid; grid-template-columns:minmax(0,1fr) minmax(300px,26%); gap:clamp(10px,1.2vw,16px); }
    .audit-stage { min-height:0; display:grid; grid-template-rows:auto minmax(112px,.72fr) minmax(122px,1fr); border:1px solid rgba(255,255,255,.11); border-radius:22px; background:linear-gradient(180deg,rgba(2,28,36,.68),rgba(4,42,51,.5)); overflow:hidden; position:relative; }
    .audit-stage__top { padding:12px 18px 0; display:flex; align-items:center; justify-content:space-between; gap:16px; }
    .audit-stage__top h2 { margin:0; font-size:1rem; }
    .agent-message { margin:0; color:var(--amber); font-size:.82rem; font-weight:800; text-align:right; }
    .track { margin:0 20px; position:relative; }
    .track::before { content:""; position:absolute; left:2.2%; right:2.2%; top:74px; height:5px; border-radius:999px; background:rgba(255,255,255,.12); }
    .track__progress { position:absolute; left:2.2%; top:74px; width:0; height:5px; border-radius:999px; background:linear-gradient(90deg,var(--teal),var(--amber)); box-shadow:0 0 22px rgba(0,166,166,.4); transition:width .8s ease; }
    .stations { position:absolute; inset:57px 0 auto; display:grid; grid-template-columns:repeat(${Math.max(1, report.findings.length)},1fr); align-items:start; }
    .station { appearance:none; min-width:0; padding:0; border:0; color:#89aeb5; background:transparent; cursor:pointer; position:relative; z-index:3; }
    .station__dot { width:36px; height:36px; margin:auto; display:grid; place-items:center; border:4px solid #123e49; border-radius:50%; background:#0a2831; font-size:.78rem; font-weight:950; transition:.28s ease; }
    .station__number { display:block; margin-top:3px; font-size:.68rem; font-weight:800; }
    .station.is-complete[data-status="passed"] .station__dot { color:var(--mint); }
    .station.is-complete[data-status="warning"] .station__dot { color:var(--ink); background:var(--amber); }
    .station.is-complete[data-status="failed"] .station__dot { color:white; background:var(--red); }
    .station.is-active .station__dot { color:var(--ink); border-color:#ffe09a; background:var(--amber); transform:scale(1.16); box-shadow:0 0 0 7px rgba(255,176,0,.14); }
    .inspector { width:62px; height:76px; position:absolute; left:4.55%; top:-8px; transform:translateX(-50%) scale(.86); transform-origin:center bottom; z-index:5; transition:left .8s cubic-bezier(.2,.9,.24,1); filter:drop-shadow(0 8px 9px rgba(0,0,0,.32)); }
    .inspector__hat { width:34px; height:11px; position:absolute; left:14px; top:0; border-radius:12px 12px 3px 3px; background:var(--amber); }
    .inspector__hat::after { content:""; width:44px; height:5px; position:absolute; left:-5px; bottom:-3px; border-radius:6px; background:#f29f00; }
    .inspector__head { width:28px; height:28px; position:absolute; left:17px; top:9px; border:3px solid #08232d; border-radius:50%; background:#ffd3a3; }
    .inspector__head::before { content:"••"; position:absolute; inset:4px 0 auto; color:#08232d; font-size:12px; letter-spacing:5px; text-align:center; }
    .inspector__body { width:32px; height:31px; position:absolute; left:15px; top:34px; border-radius:9px 9px 5px 5px; background:var(--teal); }
    .inspector__body::after { content:"✓"; position:absolute; right:3px; top:5px; color:white; font-size:15px; font-weight:950; }
    .inspector__clipboard { width:18px; height:23px; position:absolute; left:5px; top:37px; border:2px solid #6a3f16; border-radius:3px; background:#f2c078; transform:rotate(-8deg); }
    .inspector__clipboard::after { content:"≡"; color:#5e3a18; font-weight:900; position:absolute; inset:0; text-align:center; }
    .inspector__glass { width:17px; height:17px; position:absolute; right:3px; top:35px; border:4px solid #dff9f3; border-radius:50%; }
    .inspector__glass::after { content:""; width:13px; height:4px; position:absolute; right:-10px; bottom:-6px; border-radius:4px; background:#dff9f3; transform:rotate(48deg); }
    .inspector__leg { width:7px; height:16px; position:absolute; top:62px; border-radius:5px; background:#d8f7ef; transform-origin:top; }
    .inspector__leg--left { left:20px; }
    .inspector__leg--right { right:20px; }
    .inspector.is-walking .inspector__leg--left { animation:walk-left .28s infinite alternate; }
    .inspector.is-walking .inspector__leg--right { animation:walk-right .28s infinite alternate; }
    @keyframes walk-left { to { transform:rotate(28deg); } }
    @keyframes walk-right { to { transform:rotate(-28deg); } }
    .spotlight { min-height:0; margin:0 16px 16px; padding:clamp(11px,1.5vw,17px); display:grid; grid-template-columns:54px minmax(0,1fr) auto; gap:14px; align-items:center; border-radius:18px; color:var(--ink); background:linear-gradient(135deg,#f8fffe,#d8f7ef); transition:background .25s ease,color .25s ease; }
    .spotlight.is-failed { color:white; background:linear-gradient(135deg,#8d0b22,var(--red)); }
    .spotlight.is-warning { color:var(--ink); background:linear-gradient(135deg,#fff9e8,#ffd777); }
    .spotlight__icon { display:grid; place-items:center; width:50px; height:50px; border-radius:15px; color:white; background:var(--teal); font-size:1.7rem; font-weight:950; box-shadow:0 10px 24px rgba(0,0,0,.15); animation:stamp .36s ease; }
    .spotlight.is-failed .spotlight__icon { background:#4c0714; }
    @keyframes stamp { 0% { transform:scale(1.5) rotate(-12deg); opacity:.2; } 100% { transform:none; opacity:1; } }
    .spotlight small { font-weight:900; letter-spacing:.08em; text-transform:uppercase; opacity:.72; }
    .spotlight h3 { margin:1px 0 3px; font-size:clamp(1.15rem,2.2vw,1.75rem); line-height:1.08; }
    .spotlight p { margin:0; max-width:900px; font-size:.94rem; }
    .spotlight time { font-weight:850; white-space:nowrap; }
    .spotlight__actions { display:flex; flex-direction:column; align-items:flex-end; gap:7px; }
    .detail-button { appearance:none; padding:7px 11px; border:1px solid currentColor; border-radius:999px; color:inherit; background:transparent; font:inherit; font-size:.76rem; font-weight:850; cursor:pointer; }
    .detail-button:hover,.detail-button:focus-visible { color:white; background:var(--petrol); outline:2px solid var(--amber); outline-offset:2px; }
    .completion-screen { position:absolute; inset:0; z-index:8; padding:clamp(16px,2vw,28px); display:grid; grid-template-rows:auto minmax(0,1fr) auto; gap:clamp(10px,1.5vh,18px); color:#eefafa; background:linear-gradient(145deg,#05313d,#031b23); }
    .completion-screen[hidden] { display:none; }
    .completion-screen__eyebrow { margin:0 0 4px; color:var(--mint); font-size:.75rem; font-weight:900; letter-spacing:.11em; text-transform:uppercase; }
    .completion-screen h2 { margin:0; font-size:clamp(1.55rem,3vw,2.75rem); line-height:1; }
    .completion-screen__summary { margin:7px 0 0; color:#bed6da; font-size:clamp(.84rem,1.3vw,1rem); }
    .todo-grid { min-height:0; display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); grid-auto-rows:minmax(0,1fr); gap:10px; }
    .todo-card { min-height:0; padding:clamp(10px,1.3vw,16px); display:flex; flex-direction:column; align-items:flex-start; justify-content:center; gap:5px; border:1px solid rgba(255,255,255,.14); border-left:5px solid var(--amber); border-radius:15px; color:#edfafa; background:rgba(255,255,255,.07); font:inherit; text-align:left; cursor:pointer; }
    .todo-card:hover,.todo-card:focus-visible { border-color:var(--amber); background:rgba(255,255,255,.12); outline:2px solid var(--amber); outline-offset:2px; }
    .todo-card--urgent { border-left-color:var(--red); }
    .todo-card__priority { color:var(--amber); font-size:.68rem; font-weight:950; letter-spacing:.08em; text-transform:uppercase; }
    .todo-card--urgent .todo-card__priority { color:#ff8ba0; }
    .todo-card strong { font-size:clamp(.9rem,1.4vw,1.08rem); line-height:1.08; }
    .todo-card__action { color:#c8dfe2; font-size:clamp(.72rem,1vw,.86rem); line-height:1.24; }
    .todo-card__deadline { margin-top:auto; padding:4px 8px; border-radius:999px; color:var(--ink); background:var(--amber); font-size:.68rem; font-weight:900; }
    .todo-card--urgent .todo-card__deadline { color:white; background:var(--red); }
    .no-action { min-height:0; display:grid; place-content:center; padding:22px; border:1px solid rgba(123,224,195,.35); border-radius:18px; color:var(--ink); background:linear-gradient(135deg,#f8fffe,#d8f7ef); text-align:center; }
    .no-action strong { font-size:clamp(1.15rem,2vw,1.7rem); }
    .no-action span { margin-top:5px; }
    .completion-screen__footer { display:flex; align-items:center; justify-content:space-between; gap:14px; }
    .completion-screen__note { margin:0; max-width:780px; color:#91b5bb; font-size:.72rem; }
    .replay-button { flex:0 0 auto; padding:10px 16px; border:0; border-radius:999px; color:var(--ink); background:var(--mint); font:inherit; font-size:.78rem; font-weight:950; cursor:pointer; }
    .replay-button:hover,.replay-button:focus-visible { background:white; outline:2px solid var(--amber); outline-offset:2px; }
    .showcase__footer { display:flex; justify-content:space-between; align-items:center; gap:14px; color:#9bbdc3; font-size:.77rem; }
    .showcase__footer strong { color:var(--mint); }
    .results-rail { min-height:0; padding:12px; display:grid; grid-template-rows:auto minmax(0,1fr); border:1px solid rgba(255,255,255,.11); border-radius:22px; background:rgba(3,29,37,.64); overflow:hidden; }
    .results-rail__header { display:flex; align-items:end; justify-content:space-between; gap:10px; padding:1px 3px 9px; }
    .results-rail__header p { margin:0; color:var(--mint); font-size:.72rem; font-weight:900; letter-spacing:.1em; text-transform:uppercase; }
    .results-rail__header h2 { margin:1px 0 0; font-size:1rem; }
    .results-counter { color:#9fc1c7; font-size:.72rem; white-space:nowrap; }
    .results-list { min-height:0; list-style:none; padding:0; margin:0; display:grid; grid-template-rows:repeat(${Math.max(1, report.findings.length)},minmax(0,1fr)); gap:3px; }
    .result-item { min-height:0; opacity:0; transform:translateX(16px); transition:opacity .32s ease,transform .32s ease; pointer-events:none; }
    .result-item.is-revealed { opacity:1; transform:none; pointer-events:auto; }
    .result-item button { width:100%; height:100%; min-height:0; padding:2px 5px; display:grid; grid-template-columns:24px minmax(0,1fr) auto; gap:7px; align-items:center; border:1px solid rgba(255,255,255,.12); border-radius:8px; color:#effcf9; background:rgba(255,255,255,.085); font:inherit; text-align:left; cursor:pointer; }
    .result-item button:hover,.result-item button:focus-visible { border-color:var(--amber); background:rgba(255,255,255,.11); outline:none; }
    .result-item__icon { width:21px; height:21px; display:grid; place-items:center; border-radius:50%; color:var(--ink); background:var(--mint); font-size:.7rem; font-weight:950; }
    .result-item--warning .result-item__icon { background:var(--amber); }
    .result-item--failed .result-item__icon { color:white; background:var(--red); }
    .result-item__copy { min-width:0; display:block; }
    .result-item__copy small,.result-item__copy strong { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .result-item__copy small { color:#a9ccd1; font-size:clamp(.48rem,.6vw,.62rem); line-height:1; text-transform:uppercase; }
    .result-item__copy strong { margin-top:1px; font-size:clamp(.62rem,.72vw,.76rem); line-height:1.08; }
    .result-item time { color:#86aeb5; font-size:.6rem; white-space:nowrap; }
    dialog { width:min(720px,calc(100% - 28px)); padding:0; border:1px solid rgba(123,224,195,.45); border-radius:24px; color:#eefafa; background:linear-gradient(145deg,#073b4c,#061a22); box-shadow:0 28px 100px rgba(0,0,0,.58); }
    dialog::backdrop { background:rgba(1,15,20,.76); backdrop-filter:blur(5px); }
    .dialog__body { padding:clamp(22px,4vw,36px); }
    .dialog__top { display:flex; justify-content:space-between; gap:18px; align-items:start; }
    .dialog__status { margin:0 0 5px; color:var(--amber); font-size:.78rem; font-weight:900; letter-spacing:.1em; text-transform:uppercase; }
    .dialog__title { margin:0; font-size:clamp(1.45rem,3vw,2.15rem); line-height:1.08; }
    .dialog__close { width:40px; height:40px; flex:0 0 auto; border:1px solid rgba(255,255,255,.25); border-radius:50%; color:white; background:rgba(255,255,255,.08); font-size:1.3rem; cursor:pointer; }
    .dialog__finding { margin:18px 0; padding:15px 17px; border-left:5px solid var(--amber); border-radius:10px; color:var(--ink); background:#fff4d1; }
    .dialog__section { margin-top:17px; }
    .dialog__section strong { display:block; margin-bottom:4px; color:var(--mint); }
    .dialog__section p { margin:0; color:#cee2e5; }
    .dialog__link { display:inline-block; margin-top:22px; padding:10px 15px; border-radius:999px; color:var(--ink); background:var(--mint); font-weight:900; text-decoration:none; }
    @media (max-height:760px) { .showcase { padding:12px; } .lead { display:none; } .score { grid-template-columns:48px 1fr; min-width:170px; } .ring { width:48px; } .audit-stage { grid-template-rows:auto minmax(96px,.62fr) minmax(108px,1fr); } .spotlight__icon { width:42px; height:42px; } .spotlight h3 { font-size:1.08rem; } .spotlight p { font-size:.78rem; } .showcase__footer { font-size:.67rem; } .completion-screen { padding:12px; gap:8px; } .todo-card { padding:8px 10px; gap:3px; } .todo-card__action { font-size:.7rem; } .completion-screen__note { font-size:.62rem; } }
    @media (max-width:980px) { .showcase__header { grid-template-columns:minmax(0,1fr) 180px; } .workspace { grid-template-columns:minmax(0,1fr) 270px; } .inspector { display:none; } .station__dot { width:30px; height:30px; border-width:3px; } .track::before,.track__progress { top:71px; } .stations { top:58px; } .spotlight { grid-template-columns:44px minmax(0,1fr); } .spotlight__actions { grid-column:2; flex-direction:row; align-items:center; } .result-item time { display:none; } }
    @media (max-width:700px) { main { padding:5px; } .showcase { padding:9px; border-radius:16px; } .showcase__header { grid-template-columns:1fr auto; gap:8px; } .eyebrow,.lead,.score span,.meta .pill:last-child,.showcase__footer span:last-child { display:none; } h1 { font-size:1.45rem; } .score { min-width:0; padding:6px; grid-template-columns:40px; } .ring { width:40px; } .score > div:last-child { display:none; } .workspace { grid-template-columns:minmax(0,1fr) minmax(190px,42%); gap:6px; } .audit-stage__top { padding-inline:10px; } .agent-message { display:none; } .track { margin-inline:5px; } .station__number { display:none; } .spotlight { margin:0 7px 7px; padding:8px; } .spotlight p { display:none; } .results-rail { padding:6px; } .results-rail__header { padding-bottom:5px; } .results-rail__header p,.results-counter { display:none; } .result-item button { grid-template-columns:20px minmax(0,1fr); gap:4px; } .result-item__icon { width:18px; height:18px; } .todo-grid { grid-template-columns:1fr; } .todo-card:nth-child(n+3) { display:none; } .completion-screen__note { display:none; } }
    @media (prefers-reduced-motion:reduce) { *,*::before,*::after { scroll-behavior:auto!important; transition:none!important; animation:none!important; } }
  </style>
</head>
<body>
  <main>
    <section class="panel showcase" aria-labelledby="report-title">
      <header class="showcase__header">
        <div>
          <p class="eyebrow">Regio IT · autonomer Qualitätslauf</p>
          <h1 id="report-title">Der Prüfer ist unterwegs.</h1>
          <p class="lead">Alle Stationen, der laufende Check und das jeweilige Finding spielen automatisch auf dieser Bühne ab.</p>
        </div>
        <aside class="score" aria-label="Gesamtergebnis">
          <div class="ring"><strong>${report.statistics.passed}/${report.statistics.total}</strong></div>
          <div><strong>${report.overallStatus === "passed" ? "Alles im grünen Bereich" : report.overallStatus === "warning" ? `${report.statistics.warnings} Hinweise` : `${report.statistics.failed} Findings`}</strong><span>${formatDuration(report.statistics.durationMs)} Prüfzeit</span></div>
        </aside>
      </header>

      <div class="meta"><span class="pill">Prüflauf ${escapeHtml(formatTimestamp(report.generatedAt))}</span><span class="pill">Workflow-Quelle ${escapeHtml(report.workflowBranch)}</span><span class="pill">Produktion ${escapeHtml(report.productionBranch)}</span><span class="pill">Geprüfte Revision ${escapeHtml(report.revision)}</span><span class="pill">${escapeHtml(report.target)}</span></div>

      <div class="workspace">
        <section class="audit-stage" aria-labelledby="stage-title">
          <div class="audit-stage__top"><h2 id="stage-title">Live-Prüfbühne</h2><p class="agent-message">Klemmbrett bereit – los geht’s.</p></div>
          <div class="track" aria-label="Prüfstationen">
            <div class="track__progress" aria-hidden="true"></div>
            <div class="inspector" aria-hidden="true"><span class="inspector__hat"></span><span class="inspector__head"></span><span class="inspector__body"></span><span class="inspector__clipboard"></span><span class="inspector__glass"></span><span class="inspector__leg inspector__leg--left"></span><span class="inspector__leg inspector__leg--right"></span></div>
            <div class="stations">${stations}</div>
          </div>
          <article class="spotlight" aria-live="polite">
            <span class="spotlight__icon">⌕</span>
            <div><small>Prüfung</small><h3>Bericht wird vorbereitet</h3><p>Die Findings erscheinen automatisch.</p></div>
            <div class="spotlight__actions"><time>0 ms</time><button class="detail-button" type="button" hidden>Details &amp; Lösung</button></div>
          </article>
          <section class="completion-screen" aria-labelledby="completion-title" hidden>
            <div><p class="completion-screen__eyebrow">Prüflauf abgeschlossen · Ergebnis bleibt stehen</p><h2 id="completion-title">Was ist jetzt zu tun?</h2><p class="completion-screen__summary">${escapeHtml(completionSummary)}</p></div>
            ${todoItems ? `<div class="todo-grid">${todoItems}${actionItems.length > visibleActionItems.length ? `<div class="todo-card"><span class="todo-card__priority">Weitere Maßnahmen</span><strong>Zusätzlich ${actionItems.length - visibleActionItems.length} Findings prüfen</strong><span class="todo-card__action">Die vollständige Liste bleibt rechts sichtbar; jeder Eintrag öffnet Nachweis und Lösung.</span><span class="todo-card__deadline">Nach Priorität rechts bearbeiten</span></div>` : ""}</div>` : '<div class="no-action"><strong>✓ Keine Änderung erforderlich</strong><span>Alle Prüfungen waren erfolgreich. Beim nächsten planmäßigen Lauf wird erneut kontrolliert.</span></div>'}
            <div class="completion-screen__footer"><p class="completion-screen__note">Die Zeitfenster sind risikobasierte Reaktionsempfehlungen für diesen Pilot, keine vertraglichen SLA. Sicherheitsbefunde und Ausfälle haben Vorrang vor regulären Updates.</p><button class="replay-button" type="button">Prüflauf erneut ansehen</button></div>
          </section>
        </section>

        <aside class="results-rail" aria-labelledby="results-title">
          <div class="results-rail__header"><div><p>Ergebnisprotokoll</p><h2 id="results-title">Findings im Rundgang</h2></div><span class="results-counter">0/${report.statistics.total}</span></div>
          <ol class="results-list">${resultItems || "<li>Keine Prüfdaten vorhanden.</li>"}</ol>
        </aside>
      </div>

      <div class="showcase__footer"><span><strong>Einmaliger Ablauf:</strong> Der Abschluss bleibt stehen · Neustart nur über „Prüflauf erneut ansehen“</span><span>Read-only · Keine automatische Veröffentlichung</span></div>
    </section>

  </main>
  <dialog class="finding-dialog" aria-labelledby="dialog-title">
    <div class="dialog__body">
      <div class="dialog__top"><div><p class="dialog__status">Prüfdetail</p><h2 class="dialog__title" id="dialog-title">Prüfschritt</h2></div><button class="dialog__close" type="button" aria-label="Details schließen">×</button></div>
      <p class="dialog__finding"></p>
      <div class="dialog__section"><strong>Was wurde wirklich geprüft?</strong><p class="dialog__details"></p></div>
      <div class="dialog__section"><strong>Wie lässt sich der Befund korrigieren?</strong><p class="dialog__recommendation"></p></div>
      <div class="dialog__section"><strong>Empfohlenes Zeitfenster</strong><p class="dialog__deadline"></p></div>
      <a class="dialog__link" target="_blank" rel="noreferrer">Belegquelle öffnen</a>
    </div>
  </dialog>
  <script>
    const report = ${safeData};
    const stations = [...document.querySelectorAll('.station')];
    const spotlight = document.querySelector('.spotlight');
    const progress = document.querySelector('.track__progress');
    const track = document.querySelector('.track');
    const inspector = document.querySelector('.inspector');
    const message = document.querySelector('.agent-message');
    const detailButton = document.querySelector('.detail-button');
    const findingDialog = document.querySelector('.finding-dialog');
    const resultItems = [...document.querySelectorAll('.result-item')];
    const resultsCounter = document.querySelector('.results-counter');
    const completionScreen = document.querySelector('.completion-screen');
    const replayButton = document.querySelector('.replay-button');
    const todoCards = [...document.querySelectorAll('.todo-card[data-finding-id]')];
    const remarks = ['Ausweis geprüft.', 'Lupe an.', 'Termin sitzt.', 'Kein Datenstau.', 'Karte gefunden.', 'Formular im Blick.', 'Mobil passt.', 'Haken dran.'];
    let active = 0;
    let walkingTimer;
    let completionTimer;
    let advanceTimer;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    function resetWalkthrough() {
      clearTimeout(completionTimer);
      clearTimeout(advanceTimer);
      completionScreen.hidden = true;
      document.querySelector('#report-title').textContent = 'Der Prüfer ist unterwegs.';
      document.querySelector('.lead').textContent = 'Alle Stationen, der laufende Check und das jeweilige Finding spielen automatisch auf dieser Bühne ab.';
      stations.forEach((station) => { station.classList.remove('is-active', 'is-complete'); station.querySelector('.station__dot').textContent = ''; });
      resultItems.forEach((item) => item.classList.remove('is-revealed'));
      resultsCounter.textContent = '0/' + report.findings.length;
      progress.style.width = '0';
    }
    function showCompletion() {
      clearTimeout(completionTimer);
      clearTimeout(advanceTimer);
      stations.forEach((station) => station.classList.remove('is-active'));
      inspector.classList.remove('is-walking');
      message.textContent = report.statistics.failed > 0 ? 'Rundgang beendet – Handlungsbedarf erkannt.' : report.statistics.warnings > 0 ? 'Rundgang beendet – Hinweise einplanen.' : 'Rundgang beendet – alles sauber!';
      document.querySelector('#report-title').textContent = 'Prüflauf abgeschlossen.';
      document.querySelector('.lead').textContent = 'Der Rundgang ist beendet. Findings, Maßnahmen und empfohlene Reaktionszeiten bleiben sichtbar.';
      completionScreen.hidden = false;
    }
    function scheduleAdvance(index) {
      clearTimeout(advanceTimer);
      const waitUntilReady = () => {
        if (findingDialog.open) {
          advanceTimer = setTimeout(waitUntilReady, 500);
          return;
        }
        if (index < report.findings.length - 1) show(index + 1);
        else showCompletion();
      };
      advanceTimer = setTimeout(waitUntilReady, index < report.findings.length - 1 ? 1800 : 1100);
    }
    function complete(index) {
      const finding = report.findings[index];
      const station = stations[index];
      station.classList.add('is-complete');
      station.querySelector('.station__dot').textContent = station.querySelector('.station__dot').dataset.result;
      resultItems[index].classList.add('is-revealed');
      resultsCounter.textContent = stations.filter((item) => item.classList.contains('is-complete')).length + '/' + report.findings.length;
      spotlight.classList.toggle('is-failed', finding.status === 'failed');
      spotlight.classList.toggle('is-warning', finding.status === 'warning');
      const icon = spotlight.querySelector('.spotlight__icon');
      icon.textContent = finding.status === 'passed' ? '✓' : finding.status === 'warning' ? '?' : '!';
      icon.style.animation = 'none';
      requestAnimationFrame(() => { icon.style.animation = ''; });
      spotlight.querySelector('p').textContent = finding.finding;
      detailButton.hidden = false;
      progress.style.width = ((index + 1) / report.findings.length * 95.6) + '%';
      message.textContent = index === report.findings.length - 1 && report.overallStatus === 'passed' ? 'Rundgang beendet – alles sauber!' : remarks[index % remarks.length];
      if (!reducedMotion) scheduleAdvance(index);
    }
    function show(index) {
      if (!report.findings.length) return;
      clearTimeout(completionTimer);
      completionScreen.hidden = true;
      active = index;
      const finding = report.findings[index];
      stations.forEach((station, current) => station.classList.toggle('is-active', current === index));
      const selected = stations[index];
      if (track.scrollWidth > track.clientWidth) {
        track.scrollTo({ left: selected.offsetLeft - track.clientWidth / 2 + selected.offsetWidth / 2, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      }
      inspector.style.left = ((index + .5) / report.findings.length * 100) + '%';
      inspector.classList.add('is-walking');
      clearTimeout(walkingTimer);
      walkingTimer = setTimeout(() => inspector.classList.remove('is-walking'), 820);
      message.textContent = 'Prüfung läuft …';
      spotlight.classList.remove('is-failed', 'is-warning');
      const icon = spotlight.querySelector('.spotlight__icon');
      icon.textContent = '⌕';
      spotlight.querySelector('small').textContent = finding.area;
      spotlight.querySelector('h3').textContent = finding.title;
      spotlight.querySelector('p').textContent = 'Der Prüfer kontrolliert diesen Schritt gerade.';
      detailButton.hidden = true;
      spotlight.querySelector('time').textContent = new Intl.NumberFormat('de-DE').format(finding.durationMs) + ' ms';
      completionTimer = setTimeout(() => complete(index), reducedMotion ? 0 : 1400);
    }
    function openDetails(index) {
      const finding = report.findings[index];
      findingDialog.querySelector('.dialog__status').textContent = finding.status === 'passed' ? 'Bestanden' : finding.status === 'warning' ? 'Hinweis – Prüfung erforderlich' : 'Fehler – Handlung erforderlich';
      findingDialog.querySelector('.dialog__title').textContent = finding.title;
      findingDialog.querySelector('.dialog__finding').textContent = finding.finding;
      findingDialog.querySelector('.dialog__details').textContent = finding.details;
      findingDialog.querySelector('.dialog__recommendation').textContent = finding.recommendation;
      findingDialog.querySelector('.dialog__deadline').textContent = finding.deadline + ' · risikobasierte Pilotempfehlung, kein SLA';
      const link = findingDialog.querySelector('.dialog__link');
      link.hidden = !finding.evidenceUrl;
      if (finding.evidenceUrl) link.href = finding.evidenceUrl;
      findingDialog.showModal();
    }
    stations.forEach((station) => station.addEventListener('click', () => {
      const index = Number(station.dataset.index);
      if (station.classList.contains('is-complete')) openDetails(index);
      else show(index);
    }));
    detailButton.addEventListener('click', () => {
      openDetails(active);
    });
    resultItems.forEach((item) => item.querySelector('button').addEventListener('click', () => {
      openDetails(Number(item.dataset.index));
    }));
    todoCards.forEach((card) => card.addEventListener('click', () => openDetails(report.findings.findIndex((finding) => finding.id === card.dataset.findingId))));
    replayButton.addEventListener('click', () => { resetWalkthrough(); active = 0; show(active); });
    findingDialog.querySelector('.dialog__close').addEventListener('click', () => findingDialog.close());
    findingDialog.addEventListener('click', (event) => { if (event.target === findingDialog) findingDialog.close(); });
    if (!report.findings.length) {
      message.textContent = 'Keine Prüfdaten vorhanden.';
    } else if (reducedMotion) {
      report.findings.forEach((_, index) => complete(index));
      showCompletion();
    } else {
      show(active);
    }
  </script>
</body>
</html>`;
}

const findingGuidance = {
  "monitor-configuration": [
    "Der Agent prüft vor dem Rundgang, ob alle für einen belastbaren Produktionsvergleich erforderlichen Metadaten vorliegen.",
    "Workflow-Quelle und Übergabe der erwarteten Produktionsrevision prüfen; anschließend den Qualitätslauf wiederholen. Die Anwendung selbst ist durch diesen Hinweis nicht als fehlerhaft nachgewiesen.",
  ],
  login: [
    "Browser-Anmeldung, Sitzungscookie und Weiterleitung wurden gegen die veröffentlichte Demo ausgeführt.",
    "Bei einem Fehler zuerst Demo-Passwort, Vercel-Variablen und Login-Logs prüfen.",
  ],
  maintenance: [
    "Der geschützte Wartungsendpunkt wurde mit seinem Monitoring-Token ausgeführt; Fachhistorien bleiben unverändert.",
    "Bei Blockierung Retention, Löschlimit und Railway-Logs prüfen; niemals Fachhistorien manuell löschen.",
  ],
  statistics: [
    "Die geschützte Monitoring-API lieferte aggregierte Termin-, Vorgangs- und Zustellzahlen.",
    "Bei Abweichungen API- und Datenbankzustand prüfen und die betroffene Kennzahl gegen die Quelldaten plausibilisieren.",
  ],
  readiness: [
    "Die Webanwendung erreichte den Railway-Readiness-Endpunkt über ihre produktive Weiterleitung.",
    "Bei Ausfall zuerst Railway-Deployment, Healthcheck und die API-Zielvariable in Vercel prüfen.",
  ],
  dates: [
    "Gelieferte Abholtermine wurden gegen den aktuellen Kalendertag in Europe/Berlin geprüft.",
    "Vergangene Termine in der API-Datenquelle korrigieren und anschließend den Qualitätslauf wiederholen.",
  ],
  address: [
    "Die veröffentlichte Adresssuche wurde bedient und musste auswählbare Demo-Adressen liefern.",
    "Tenant-Daten, API-Antwort und Weiterleitung kontrollieren, falls keine Treffer erscheinen.",
  ],
  "waste-guide": [
    "Die reale Abfall-ABC-Suche musste den Testbegriff Akku dem erwarteten Entsorgungsweg zuordnen.",
    "Suchbegriffe und Zuordnungsdaten des Mandanten prüfen und einen fachlich bestätigten Synonymeintrag ergänzen.",
  ],
  sorting: [
    "Ein synthetisches Testfoto wurde durch den veröffentlichten SortierKompass eingeordnet.",
    "Bei Fehlklassifikation Modellantwort, Fallback-Regeln und transparente Nutzerhinweise prüfen.",
  ],
  sites: [
    "Standortliste und Kartenbereich wurden im veröffentlichten Browser geladen.",
    "Standortdaten und Karten-Fallback kontrollieren; die Anwendung darf nicht von einem einzelnen Kartendienst abhängig sein.",
  ],
  forms: [
    "Mängel- und Sperrmüllformular wurden bis vor das Absenden bedient; für diese Vorgangsarten erzeugt der Qualitätsagent bewusst keine Fachdaten. Der 24/7-Weg besitzt einen eigenen vollständigen Prüfschritt.",
    "Bei einem Fehler Formularvalidierung und API-Vertrag prüfen. Mängel- oder Sperrmüllvorgänge nur kontrolliert in einer isolierten Testumgebung absenden.",
  ],
  "recycling-access-e2e": [
    "Der Qualitätsagent buchte den 24/7-Zugang über das echte Browserformular, durchlief alle vier Schrankenstationen und rief danach die streng markierte Selbstbereinigung auf. Dadurch werden auch Browser-CORS, Vercel-Proxy und Railway-API geprüft.",
    "Bei einem Fehler zuerst WASTE_WEB_ORIGIN in Railway, den Vercel-API-Zielwert und die Railway-Logs prüfen. Falls nur die Bereinigung scheitert, den markierten DEMO-QA-Vorgang anhand der Referenz kontrolliert nacharbeiten.",
  ],
  mobile: [
    "Die Seite wurde mit 320 Pixel Breite auf horizontalen Überlauf kontrolliert.",
    "Überbreite Komponente mit responsiven CSS-Regeln korrigieren und den mobilen Browserlauf wiederholen.",
  ],
  "web-deployment": [
    "Vercels veröffentlichter Commit und Branch wurden mit der erwarteten GitHub-Revision verglichen. Bei abweichender Commit-ID gilt ausschließlich ein im Repository nachgewiesener identischer Git-Tree als gleichwertig.",
    "Nur bei einer nicht inhaltsgleichen Abweichung Vercel-Production-Branch und Deployment prüfen, Redeploy auslösen und erst danach erneut testen.",
  ],
  "api-deployment": [
    "Railways veröffentlichter Commit und Branch wurden mit der erwarteten GitHub-Revision verglichen. Bei abweichender Commit-ID gilt ausschließlich ein im Repository nachgewiesener identischer Git-Tree als gleichwertig.",
    "Nur bei einer nicht inhaltsgleichen Abweichung Railway-Quellbranch und Deployment-Logs prüfen, anschließend neu deployen.",
  ],
  "web-runtime": [
    "Die von Vercel gemeldeten Node.js-, Next.js- und App-Versionen wurden mit der freigegebenen Baseline verglichen.",
    "Abhängigkeit oder Laufzeit kontrolliert aktualisieren, Tests ausführen und die Baseline erst nach Freigabe anpassen.",
  ],
  "api-runtime": [
    "Die laufende API meldete Java-, Spring-Boot-, Kotlin- und App-Version; sie wurden mit der Baseline verglichen.",
    "Gradle-Abhängigkeiten oder Railway-Laufzeit aktualisieren, Regressionstests ausführen und danach erneut deployen.",
  ],
  "declared-baseline": [
    "Die deklarierten Versionen in package.json und Gradle wurden mit der freigegebenen technischen Baseline verglichen.",
    "Versionsabweichung fachlich bewerten; entweder Implementierung zurückführen oder Baseline mit dokumentierter Freigabe aktualisieren.",
  ],
  "dependency-audit": [
    "pnpm audit prüfte den Lockfile-Stand gegen bekannte JavaScript-Advisories ab Schweregrad high.",
    "Betroffene Abhängigkeit gezielt aktualisieren, Lockfile prüfen und vollständige Tests ausführen; keine pauschale Major-Aktualisierung.",
  ],
  "security-alerts": [
    "Offene Dependabot-Sicherheitswarnungen mit Schweregrad high oder critical wurden über die GitHub-API abgefragt.",
    "Zuerst GitHub-API-Zugriff und Security-Einstellungen prüfen. Bei echten Warnungen die betroffene Abhängigkeit aktualisieren oder eine begründete Ausnahme dokumentieren.",
  ],
  "security-workflow": [
    "Status und Alter des letzten abgeschlossenen Security-Workflows auf main wurden über die GitHub-API kontrolliert.",
    "Fehlgeschlagenen Workflow und CodeQL-Befunde öffnen, Ursache korrigieren und den Security-Lauf erneut starten.",
  ],
  "dependency-updates": [
    "Offene Pull Requests des GitHub-Benutzers dependabot[bot] wurden gezählt und in den Bericht übernommen.",
    "Jeden PR einzeln öffnen, Changelog und grüne Checks prüfen und nur kompatible Updates nach Review mergen.",
  ],
};

function enrichFinding(finding) {
  const guidance = findingGuidance[finding.id] ?? [
    "Der benannte Prüfschritt wurde automatisiert gegen die veröffentlichte Anwendung ausgeführt.",
    finding.status === "passed"
      ? "Keine Korrektur erforderlich; der Nachweis wird beim nächsten Lauf erneut erhoben."
      : "Befund anhand der Ausgabedaten analysieren, gezielt korrigieren und den Qualitätslauf wiederholen.",
  ];
  const recommendation = finding.recommendation ?? guidance[1];
  const action = classifyAction(finding, recommendation);
  return {
    ...finding,
    details: finding.details ?? guidance[0],
    recommendation,
    evidenceUrl: finding.evidenceUrl ?? "",
    action: action.action,
    deadline: action.deadline,
    actionLabel: action.label,
    actionPriority: action.priority,
  };
}

function classifyAction(finding, recommendation) {
  if (finding.status === "passed") {
    return {
      action: "Keine Änderung erforderlich; der nächste Qualitätslauf prüft erneut.",
      deadline: "Nächster planmäßiger Lauf",
      label: "Keine Maßnahme",
      priority: "none",
    };
  }
  if (finding.status === "failed") {
    const securityCritical = ["dependency-audit", "security-alerts"].includes(finding.id);
    return {
      action: recommendation,
      deadline: securityCritical ? "Innerhalb 24 Stunden" : "Sofort – heute",
      label: securityCritical ? "Sicherheitsmaßnahme" : "Akuter Handlungsbedarf",
      priority: "urgent",
    };
  }
  if (
    ["dependency-audit", "security-alerts", "security-workflow", "monitor-configuration"].includes(
      finding.id,
    )
  ) {
    return {
      action:
        finding.id === "security-alerts" && finding.finding?.startsWith("Prüfung nicht verfügbar")
          ? "GitHub-API-Zugriff und Repository-Security-Einstellungen prüfen; anschließend den Qualitätslauf wiederholen."
          : recommendation,
      deadline: "Innerhalb 1 Arbeitstags",
      label: "Prüfnachweis nachholen",
      priority: "soon",
    };
  }
  if (finding.id === "dependency-updates") {
    return {
      action: recommendation,
      deadline: "Innerhalb 14 Kalendertagen",
      label: "Update einplanen",
      priority: "planned",
    };
  }
  return {
    action: recommendation,
    deadline: "Innerhalb 5 Arbeitstagen",
    label: "Zeitnah prüfen",
    priority: "soon",
  };
}

function actionRank(priority) {
  return { urgent: 0, soon: 1, planned: 2, none: 3 }[priority] ?? 4;
}

function formatTimestamp(value) {
  try {
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
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

function statusIcon(status) {
  if (status === "passed") return "✅";
  if (status === "warning") return "⚠️";
  return "❌";
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
