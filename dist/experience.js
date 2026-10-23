import { e, controlChart, NAV } from "./presentation.js";
import { day, sum, signalRegister, profileData } from "./intelligence.js";
import { deriveCost } from "./analysis-core.js";
import { exposureMap } from "./analytics-studio.js";

const number = (v) =>
  v == null
    ? "—"
    : Number(v).toLocaleString("en-US", { maximumFractionDigits: 1 });
const money = (v) =>
  v == null
    ? "—"
    : "$" + Number(v).toLocaleString("en-US", { maximumFractionDigits: 0 });
const percent = (v) => (v == null ? "—" : number(v) + "%");
const paths = {
  studio: "M3 5h18M3 12h18M3 19h18M7 3v4M16 10v4M10 17v4",
  overview: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  visuals: "M4 20V10m8 10V4m8 16v-7",
  trace: "M5 3h14v5H5z M3 16h6v5H3z M15 16h6v5h-6z M12 8v4M6 16v-4h12v4",
  quality: "M3 17l5-6 4 3 5-10 4 4",
  investigate: "M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14M15 15l6 6",
  customers: "M4 4h16v13H9l-5 4z M8 8h8M8 12h5",
  containment: "M12 3l8 3v6c0 5-8 9-8 9s-8-4-8-9V6zM9 12l2 2 4-4",
  recovery: "M4 4v16h17M8 7h10M8 12h7M8 17h12",
  cost: "M12 2v20M17 6H9a3 3 0 0 0 0 6h6a3 3 0 0 1 0 6H6",
  capa: "M5 4h14v17H5zM9 2h6v4H9zM8 11l2 2 5-5M8 17h8",
  learning: "M4 12a8 8 0 1 1 2 6M4 18v-6h6M12 8v5l3 2",
  data: "M3 6c0-4 18-4 18 0s-18 4-18 0v12c0 4 18 4 18 0V6M3 12c0 4 18 4 18 0",
  arrow: "M5 12h14M13 6l6 6-6 6",
  upload: "M12 16V3M7 8l5-5 5 5M4 16v5h16v-5",
  download: "M12 3v13M7 11l5 5 5-5M4 17v4h16v-4",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "M5 5l14 14M19 5L5 19",
  chevron: "M9 5l7 7-7 7",
  check: "M4 12l5 5L20 6",
  search: "M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14M15 15l6 6",
};
export const glyph = (id) =>
  `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[id] || paths.overview}"/></svg>`;
const brand = `<svg viewBox="0 0 36 36" width="32" height="32" aria-hidden="true"><path d="M5 7h26v6H11v6h17v6H11v6H5z" fill="currentColor"/><path d="M15 29h16v-6h-6v-6H15z" fill="currentColor" opacity=".45"/></svg>`;
const groups = [
  ["Workspace", ["overview", "studio", "visuals"]],
  ["Quality intelligence", ["trace", "quality", "investigate", "customers"]],
  ["Decisions & delivery", ["containment", "recovery", "cost"]],
  ["Execution", ["capa", "learning"]],
  ["Resources", ["data"]],
];
export const titles = Object.fromEntries(NAV.map(([id, label]) => [id, label]));
export function appShell(db, view, page, focus) {
  const open = db.actions.filter((a) => a.status !== "Done").length;
  return `<a class="skip-link" href="#workspace-content">Skip to workspace</a><div class="app-layout"><button class="nav-scrim" data-ui="close-nav" aria-label="Close navigation" tabindex="-1"></button><aside class="app-sidebar" id="sidebar" aria-label="Workspace navigation"><a class="wordmark" href="#overview"><span class="brand-mark">${brand}</span><span>FactorySphere<span class="brand-caption">QUALITY INTELLIGENCE</span></span></a><button class="icon-button nav-close" data-ui="close-nav" aria-label="Close navigation">${glyph("close")}</button><div class="workspace-switch"><span class="workspace-avatar">FS</span><span><strong>Operations workspace</strong><small>Local decision intelligence</small></span><span class="workspace-dot"></span></div><nav aria-label="Primary">${groups.map(([name, ids]) => `<div class="nav-group">${name}</div>${ids.map((id) => `<button class="nav-item ${view === id ? "active" : ""}" data-view="${id}" ${view === id ? 'aria-current="page"' : ""}>${glyph(id)}<span>${titles[id]}</span>${id === "capa" && open ? `<b>${open}</b>` : ""}${view === id ? '<i class="nav-current"></i>' : ""}</button>`).join("")}`).join("")}</nav><div class="sidebar-bottom"><span class="sidebar-monogram">${brand}</span><p>One connected view.<br><strong>Every quality decision.</strong></p><button data-view="data" class="sidebar-source"><span class="source-dot"></span><span>Data stays on this device</span>${glyph("chevron")}</button></div></aside><div class="app-main"><header class="app-topbar"><div class="breadcrumb"><button class="icon-button mobile-nav" data-ui="open-nav" aria-label="Open navigation" aria-expanded="false" aria-controls="sidebar">${glyph("menu")}</button><span class="breadcrumb-root">Workspace</span><span class="breadcrumb-divider">/</span><strong>${e(titles[view] || view)}</strong></div><div class="top-actions"><button class="global-search" data-ui="open-search" aria-label="Search workspaces and records">${glyph("search")}<span>Find anything</span><kbd>⌘ K</kbd></button><span class="top-divider"></span><button class="btn primary global-import" data-action="upload" aria-label="Import data">${glyph("upload")}<span>Import data</span></button><details class="export-menu"><summary class="btn" aria-label="Export reports and data">${glyph("download")}<span>Export</span></summary><div class="export-options"><span>DOWNLOAD FROM ACTIVE DATA</span><button data-action="report-html">Decision report <small>HTML · complete analysis</small></button><button data-action="visual-report">Visual report <small>HTML · 50 visualizations</small></button><button data-action="report-csv">Analysis data <small>CSV · structured results</small></button><button data-action="report-json">Analytical JSON <small>Calculations and evidence</small></button><button data-action="snapshot">Workspace backup <small>JSON · data and saved decisions</small></button></div></details></div></header><div class="workspace-context"><button data-view="data" class="context-source">${glyph("data")}<span>${e(db.sourceName)}</span><span class="context-tag">${db.inspections.length} records</span></button><div class="context-status"><i></i><span id="save-indicator" role="status">Saved locally</span><span class="context-divider">/</span><span>${e(db.incident.id)}</span></div></div><main id="workspace-content" class="app-content" tabindex="-1" data-page="${e(view)}">${page}</main><footer class="app-footer"><span>FactorySphere <b>03</b><i></i>Quality. Cost. Delivery.</span><span>${e(focus)}<i></i>Reporting currency: USD</span><a href="#data">Source & methodology ${glyph("arrow")}</a></footer></div></div><dialog class="command-dialog" aria-labelledby="command-title"><div class="command-heading"><div><span class="eyebrow">QUICK FIND</span><h2 id="command-title">Where would you like to go?</h2></div><button class="icon-button" data-ui="close-search" aria-label="Close search">${glyph("close")}</button></div><label class="command-input">${glyph("search")}<input id="command-query" type="search" placeholder="Search workspaces, batches, inspections…" autocomplete="off" aria-label="Search workspaces and records"></label><div id="command-results">${commandResults(db, "")}</div><div class="command-footer"><span>Search the active dataset</span><span><kbd>esc</kbd> to close</span></div></dialog>`;
}
export function commandResults(db, query) {
  const q = query.trim().toLowerCase(),
    matches = (x) => x.toLowerCase().includes(q);
  const pages = NAV.filter(([, label]) => matches(label)).map(
    ([id, label]) =>
      `<button data-view="${id}">${glyph(id)}<span><strong>${e(label)}</strong><small>Workspace</small></span>${glyph("arrow")}</button>`,
  );
  const records = q
    ? [
        ...db.batches
          .filter((b) => matches([b.id, b.sku, b.factory, b.line].join(" ")))
          .map((b) => ({
            view: "trace",
            batch: b.id,
            title: b.id,
            note: [b.sku, b.factory, b.line].filter(Boolean).join(" · "),
          })),
        ...db.inspections
          .filter((i) => matches([i.id, i.type, i.batch].join(" ")))
          .map((i) => ({
            view: "trace",
            batch: i.batch,
            title: i.id,
            note: i.type + " · " + i.batch,
          })),
        ...db.actions
          .filter((a) => matches([a.id, a.title, a.owner].join(" ")))
          .map((a) => ({ view: "capa", title: a.id, note: a.title })),
      ]
        .slice(0, 30)
        .map(
          (r) =>
            `<button data-view="${r.view}" ${r.batch ? `data-batch="${e(r.batch)}"` : ""}>${glyph(r.view)}<span><strong>${e(r.title)}</strong><small>${e(r.note)}</small></span>${glyph("arrow")}</button>`,
        )
    : [];
  return `<div class="command-result-list">${pages.join("")}${records.join("")}${!pages.length && !records.length ? '<div class="command-empty">No matching workspaces or records.<small>Try a batch ID, defect, factory or owner.</small></div>' : ""}</div>`;
}
const section = (title, description, body, link = "", view = "") =>
  `<section class="panel"><div class="panel-title"><div><h2>${title}</h2><p>${e(description)}</p></div>${link ? `<button class="text-button" data-view="${view}">${link} ${glyph("arrow")}</button>` : ""}</div>${body}</section>`;
const stat = (index, label, value, caption, icon, tone = "") =>
  `<article class="stat ${tone}"><div class="stat-top"><span>${e(label)}</span>${glyph(icon)}</div><strong>${e(value)}</strong><div class="stat-base"><small>${e(caption)}</small><span>${index}</span></div></article>`;
const scopeTone = (s) =>
  s === "Confirmed" ? "danger" : s === "Precautionary" ? "warning" : "neutral";
function distribution(a) {
  const groups = [
    "Confirmed",
    "Precautionary",
    "Separate signal",
    "Reference",
    "Unrelated",
  ]
    .map((scope) => ({
      scope,
      rows: a.exposure.filter((b) => b.scope === scope),
    }))
    .filter((g) => g.rows.length);
  const colors = {
    Confirmed: "#995043",
    Precautionary: "#d2b290",
    "Separate signal": "#656d84",
    Reference: "#b8bcc8",
    Unrelated: "#8f99ad",
  };
  let start = 0;
  const ring = groups
    .map((g) => {
      const length = (g.rows.length / a.exposure.length) * 314.16,
        mark = `<circle r="50" cx="70" cy="70" fill="none" stroke="${colors[g.scope]}" stroke-width="17" stroke-dasharray="${Math.max(0, length - 3)} ${314.16 - length + 3}" stroke-dashoffset="${-start}" transform="rotate(-90 70 70)"><title>${g.scope}: ${g.rows.length} batches</title></circle>`;
      start += length;
      return mark;
    })
    .join("");
  return `<div class="distribution"><div class="distribution-ring"><svg viewBox="0 0 140 140" role="img" aria-label="Batch exposure classification">${ring}</svg><div><strong>${a.exposure.length}</strong><span>BATCHES</span></div></div><div class="distribution-legend">${groups.map((g) => `<div><i style="background:${colors[g.scope]}"></i><span>${g.scope}<small>${number(sum(g.rows, "inventory"))} known stock${g.rows.some((b) => b.inventory === null) ? " + unknown" : ""}</small></span><strong>${g.rows.length}</strong></div>`).join("")}</div></div><p class="chart-note">Shared inputs indicate exposure. Related batches still require verification.</p>`;
}
export function overviewExperience(db, a, plans, state) {
  const signals = signalRegister(db, a),
    profile = profileData(db),
    cost = deriveCost(db, a),
    plan = plans.find((p) => p.name === state.selectedRecovery) || plans[0];
  const visible = a.exposure.filter(
      (b) =>
        (state.factoryFilter === "All" || b.factory === state.factoryFilter) &&
        (state.scopeFilter === "All" || b.scope === state.scopeFilter),
    ),
    ids = new Set(visible.map((b) => b.id));
  const rows = a.focusRows.filter((i) => ids.has(i.batch)),
    sample = sum(rows, "sample"),
    defects = sum(rows, "defects"),
    confirmed = visible.filter((b) => b.scope === "Confirmed");
  const stock = confirmed.every((b) => b.inventory !== null)
      ? sum(confirmed, "inventory")
      : null,
    overdue = db.actions.filter(
      (x) => x.status !== "Done" && x.due && x.due < day(),
    );
  const choices = (values, current, autoLabel) =>
    values
      .map(
        (v) =>
          `<option value="${e(v)}" ${v === current ? "selected" : ""}>${e(v === "Auto" ? autoLabel : v)}</option>`,
      )
      .join("");
  const steps = [
    ["Detect", true, "quality"],
    ["Trace", true, "trace"],
    ["Contain", db.incident.hold || db.incident.shipmentBlock, "containment"],
    [
      "Recover",
      db.actions.some((x) => x.type === "Corrective" && x.status === "Done"),
      "recovery",
    ],
    ["Verify", db.incident.closed, "learning"],
  ];
  let html = `<div class="executive-heading"><div><div class="eyebrow"><span class="eyebrow-line"></span>YOUR OPERATIONS, CONNECTED${db.groundTruth || db.sourceName === "enterprise-demonstration.json" ? '<span class="synthetic-label">Synthetic data</span>' : ""}</div><h1>Quality, in focus<span>.</span></h1><p>From the first signal to a verified resolution. Every decision, connected.</p></div><div class="date-context"><strong>${e(new Date(day() + "T12:00:00Z").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }))}</strong><span>${db.factories.length} factories <i>·</i> ${db.batches.length} batches</span></div></div>`;
  html += `<div class="analysis-toolbar"><span class="toolbar-label">ANALYSIS SCOPE</span><label>Defect<select id="focus-defect">${choices(["Auto", ...a.defects.map((d) => d.type)], state.focusDefect, a.focus + " (auto)")}</select></label><label>Reference<select id="focus-batch">${choices(["Auto", ...db.batches.map((b) => b.id)], state.referenceBatch, a.reference.id + " (auto)")}</select></label><label>Factory<select id="factory-filter">${choices(["All", ...new Set(db.batches.map((b) => b.factory))], state.factoryFilter)}</select></label><label>Exposure<select id="scope-filter">${choices(["All", "Confirmed", "Precautionary", "Separate signal", "Reference", "Unrelated"], state.scopeFilter)}</select></label><button class="text-button" data-action="clear-filters">Reset</button></div>`;
  html += `<section class="operations-hero"><div class="hero-main"><div class="hero-kicker"><span class="live-pulse"></span>${e(db.incident.id)}<span>/</span>${e(a.focus)}</div><h2>${a.confirmed.length ? `<strong>${number(a.confirmedStock)}</strong> units.<br>A clear path to recovery.` : `<strong>${a.precautionary.length}</strong> related batch${a.precautionary.length === 1 ? "" : "es"}.<br>Start with the evidence.`}</h2><p>${a.confirmed.length} confirmed · ${a.precautionary.length} precautionary · ${number(a.confirmedShipped ?? (a.confirmed.length ? null : 0))} confirmed shipped units.</p><div class="case-journey">${steps.map(([name, done, v], i) => `<button data-view="${v}" class="${done ? "complete" : ""}"><span>${done ? glyph("check") : String(i + 1).padStart(2, "0")}</span>${name}</button>`).join("")}</div></div><aside class="hero-next"><div class="eyebrow">YOUR NEXT DECISION</div><span class="hero-next-icon">${glyph(a.confirmed.length ? "recovery" : "quality")}</span><h3>${a.confirmed.length ? "Make the recovery plan." : "Verify the signal."}</h3><p>${a.confirmed.length ? (plan ? `${number(plan.totalDays)} working days under the selected strategy. Compare capacity, cost and release risk.` : "Complete inventory records to compare recovery strategies.") : "Review inspection evidence and acceptance criteria before confirming the affected scope."}</p><button class="btn light" data-view="${a.confirmed.length ? "recovery" : "quality"}">${a.confirmed.length ? "Explore recovery options" : "Review quality evidence"} ${glyph("arrow")}</button></aside></section>`;
  html += `<div class="stat-grid overview-stats">${stat("01", "Observed defective rate", percent(sample ? (defects / sample) * 100 : null), `${number(defects)} / ${number(sample)} inspected observations`, "quality")}${stat("02", "Confirmed stock", number(stock), `${confirmed.length} batches in displayed scope`, "containment")}${stat("03", "Recorded quality cost", money(cost.known), `${a.costCoverage}/4 cost categories · dataset total`, "cost")}${stat("04", "Overdue commitments", number(overdue.length), `${db.actions.filter((x) => x.status !== "Done").length} open actions · incident total`, "capa", overdue.length ? "danger" : "")}</div>`;
  html += `<div class="studio-entry"><span>↗</span><div><h2>Go beyond the headline.</h2><p>Explore linked comparisons, exposure maps and recovery economics in the Analysis studio.</p></div><div class="studio-entry-actions"><button class="text-button" data-view="studio">Open analysis studio →</button><button class="text-button" data-studio-mode="review">Challenge the evidence →</button></div></div>`;
  html += `<div class="section-heading"><span>01 / MONITOR</span><h2>The signals behind the decisions</h2></div><div class="analytics-grid main-split">${section("Process stability", signals.cohort + " · statistical cohort, independent of display filters", controlChart(signals.control), "Explore signals", "quality")}${section("Exposure, understood", "Selected defect · classification by batch", distribution(a), "Trace batches", "trace")}</div>`;
  const sorted = [...a.defects].sort((x, y) => y.defects - x.defects),
    total = sum(sorted, "defects");
  let cumulative = 0;
  const pareto = `<div class="ranked-defects">${sorted
    .map((d, i) => {
      cumulative += d.defects;
      return `<button data-focus-type="${e(d.type)}" class="ranked-defect ${d.type === a.focus ? "selected" : ""}"><span class="rank">${String(i + 1).padStart(2, "0")}</span><span class="rank-body"><strong>${e(d.type)}</strong><span class="rank-track"><i style="width:${total ? (d.defects / total) * 100 : 0}%"></i></span></span><span class="rank-value">${number(d.defects)}<small>${percent(total ? (cumulative / total) * 100 : 0)} cumulative</small></span></button>`;
    })
    .join("")}</div>`;
  html += `<div class="analytics-grid equal-split">${section("Where to focus improvement", "Recorded defective observations · select a defect to refocus", pareto)}${section(
    "The decision queue",
    "Prioritized actions from the active dataset",
    `<div class="decision-list">${[
      [
        signals.signals.length + " signals to investigate",
        "Check process changes and evidence quality.",
        "quality",
      ],
      [
        plan
          ? money(plan.cost) + " estimated recovery cost"
          : "Recovery awaits confirmed stock",
        plan
          ? "Full completion: " + plan.complete
          : "Resolve missing stock and disposition records.",
        "recovery",
      ],
      [
        overdue.length + " overdue commitments",
        "Keep owners, evidence and verification on track.",
        "capa",
      ],
    ]
      .map(
        ([title, desc, v], i) =>
          `<button data-view="${v}"><span class="decision-icon">${glyph(v)}</span><span><small>0${i + 1} / ${titles[v]}</small><strong>${e(title)}</strong><small>${e(desc)}</small></span>${glyph("arrow")}</button>`,
      )
      .join("")}</div>`,
  )}</div>`;
  html += section(
    "The inventory landscape",
    "Entire selected-defect scope · known stock by batch",
    exposureMap(a),
    "Open analysis studio",
    "studio",
  );
  html += `<div class="section-heading"><span>02 / FOLLOW THROUGH</span><h2>Every batch has a story</h2><span>${visible.length} matching batches</span></div>`;
  html += section(
    "Exposure register",
    "Follow a batch from material inputs to customer evidence",
    `<div class="table-wrap"><table><thead><tr><th>Batch / style</th><th>Factory / line</th><th>Classification</th><th>Inventory</th><th>Shipped</th><th>Evidence / rationale</th></tr></thead><tbody>${visible.map((b) => `<tr><td><button class="text-button batch-link" data-view="trace" data-batch="${e(b.id)}">${e(b.id)} ${glyph("arrow")}</button><small class="cell-detail">${e(b.sku || "Style unknown")}</small></td><td>${e(b.factory)}<small class="cell-detail">${e(b.line || "Line not supplied")}</small></td><td><span class="badge ${scopeTone(b.scope)}">${e(b.scope)}</span></td><td class="numeric">${number(b.inventory)}</td><td class="numeric">${number(b.shipped)}</td><td>${e(b.reason)}</td></tr>`).join("")}</tbody></table></div>${visible.length ? "" : '<div class="empty">No batches match this scope. Reset the filters to see all records.</div>'}`,
  );
  return (
    html +
    `<div class="source-footer"><span>Coverage: ${e(profile.dates[0] || "Undated")} — ${e(profile.dates[1] || "Undated")}</span><button class="text-button" data-view="data">${profile.unreviewed} screening records · Review data quality ${glyph("arrow")}</button></div>`
  );
}

export function workspaceSections(view, page, charts, current = "workspace") {
  if (!charts) return page;
  return `<div class="workspace-tabs" role="tablist" aria-label="Workspace sections"><button role="tab" id="tab-workspace" aria-controls="panel-workspace" aria-selected="${current === "workspace"}" data-workspace-tab="workspace">Workspace</button><button role="tab" id="tab-charts" aria-controls="panel-charts" aria-selected="${current === "charts"}" data-workspace-tab="charts">Visual analysis<span>${(charts.match(/data-visual-id=/g) || []).length}</span></button><label class="section-jump">Jump to<select id="section-jump" aria-label="Jump to section"><option value="">A section on this page</option></select></label></div><div role="tabpanel" id="panel-workspace" aria-labelledby="tab-workspace" ${current === "workspace" ? "" : "hidden"}>${page}</div><div role="tabpanel" id="panel-charts" aria-labelledby="tab-charts" ${current === "charts" ? "" : "hidden"}>${charts}</div>`;
}
