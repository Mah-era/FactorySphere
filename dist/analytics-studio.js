import { e } from "./presentation.js";
import { sum, costSensitivity, governanceGates, day } from "./intelligence.js";
import { explorerModel } from "./advanced-analytics.js";
import { visualSpecs, chart } from "./visualizations.js";
import { criticalReviewView } from "./decision-review-ui.js";

const n = (v) =>
  v == null
    ? "—"
    : Number(v).toLocaleString("en-US", { maximumFractionDigits: 1 });
const usd = (v) =>
  v == null ? "—" : "$" + Math.round(v).toLocaleString("en-US");
const pct = (v) => (v == null ? "—" : n(v) + "%");
const empty = (message) => `<div class="studio-empty">${e(message)}</div>`;
const option = (value, label, current) =>
  `<option value="${e(value)}" ${value === current ? "selected" : ""}>${e(label)}</option>`;
const section = (index, title, subtitle) =>
  `<div class="section-heading studio-section"><span>${index} / ANALYTICAL LENS</span><h2>${e(title)}</h2><p>${e(subtitle)}</p></div>`;
const panel = (title, note, body, extra = "") =>
  `<section class="panel"><div class="panel-title"><div><h2>${e(title)}</h2><p>${e(note)}</p></div>${extra}</div>${body}</section>`;

// Binary area partition: every rectangle's area is proportional to known stock.
export function stockLayout(rows, x = 0, y = 0, w = 100, h = 100) {
  if (!rows.length) return [];
  if (rows.length === 1) return [{ ...rows[0], x, y, w, h }];
  const total = sum(rows, "inventory");
  let index = 1,
    left = rows[0].inventory;
  while (index < rows.length - 1 && left + rows[index].inventory <= total / 2) {
    left += rows[index++].inventory;
  }
  const ratio = left / total;
  return w >= h
    ? [
        ...stockLayout(rows.slice(0, index), x, y, w * ratio, h),
        ...stockLayout(rows.slice(index), x + w * ratio, y, w * (1 - ratio), h),
      ]
    : [
        ...stockLayout(rows.slice(0, index), x, y, w, h * ratio),
        ...stockLayout(rows.slice(index), x, y + h * ratio, w, h * (1 - ratio)),
      ];
}
export function exposureMap(a) {
  const rows = a.exposure
      .filter((b) => b.inventory > 0)
      .sort((x, y) => y.inventory - x.inventory),
    unknown = a.exposure.filter((b) => b.inventory === null).length;
  const blocks = stockLayout(rows, 0, 0, 100, 60);
  return `<div class="exposure-map" aria-label="Known inventory by batch; area represents units">${blocks.map((b) => `<button class="exposure-tile ${b.scope === "Confirmed" ? "confirmed" : b.scope === "Precautionary" ? "precautionary" : "other"}" data-batch="${e(b.id)}" data-view="trace" style="left:${b.x}%;top:${(b.y / 60) * 100}%;width:${b.w}%;height:${(b.h / 60) * 100}%" aria-label="${e(b.id + " · " + b.scope + " · " + b.inventory + " stock units")}" title="${e(b.id + " · " + b.scope + " · " + b.inventory + " units")}">${b.w > 6 && b.h > 4 ? `<strong>${e(b.id)}</strong><span>${n(b.inventory)}</span>` : ""}</button>`).join("") || empty("Known positive inventory is required to draw an area map.")}</div><div class="map-key"><span><i class="confirmed"></i>Confirmed</span><span><i class="precautionary"></i>Precautionary</span><span><i class="other"></i>Other classifications</span><b>${n(sum(rows, "inventory"))} known stock units</b></div><p class="chart-note">Area = supplied inventory. Select a tile to trace its batch. ${unknown} batches with unknown inventory and ${a.exposure.filter((b) => b.inventory === 0).length} with zero stock are excluded. Related does not mean defective.</p>`;
}
function groupChart(m, settings) {
  const metric = settings.metric === "defects" ? "defects" : "rate",
    max = Math.max(
      1,
      ...m.groups.map((g) => (metric === "rate" ? g.ci.high : g.defects)),
    );
  return `<div class="explorer-ranking">${m.groups.map((g, i) => `<button data-explorer-group="${e(g.label)}" class="explorer-group ${m.group === g.label ? "selected" : ""}" aria-pressed="${m.group === g.label}"><span class="explorer-label"><small>${String(i + 1).padStart(2, "0")}</small><strong>${e(g.label)}</strong></span><span class="explorer-track"><i style="width:${(g[metric] / max) * 100}%"></i>${metric === "rate" ? `<b style="left:${(g.ci.low / max) * 100}%;width:${((g.ci.high - g.ci.low) / max) * 100}%"></b>` : ""}</span><span class="explorer-value">${metric === "rate" ? pct(g.rate) : n(g.defects)}<small>n = ${n(g.sample)}</small></span></button>`).join("") || empty("No groups meet these filters. Reduce the minimum sample or clear the date range.")}</div><div class="explorer-axis"><span>0</span><span>${metric === "rate" ? pct(max) : n(max) + " defective observations"}</span></div><p class="chart-note">Select a group to filter the linked activity and records below. ${metric === "rate" ? "Whiskers show Wilson 95% intervals." : ""} Comparison is descriptive; product mix and sampling may differ.</p>`;
}
function activityGrid(db, m) {
  const dates = m.dates.slice(-21),
    groups = m.group
      ? m.groups.filter((g) => g.label === m.group)
      : m.groups.slice(0, 10),
    batches = new Map(db.batches.map((b) => [b.id, b]));
  if (!dates.length)
    return empty(
      "Dated inspections are required. A date filter excludes undated records.",
    );
  const cells = new Map();
  for (const i of m.rows) {
    const key = JSON.stringify([
        i[m.dimension] || batches.get(i.batch)?.[m.dimension] || "Not supplied",
        i.date,
      ]),
      c = cells.get(key) || { sample: 0, defects: 0 };
    c.sample += i.sample;
    c.defects += i.defects;
    cells.set(key, c);
  }
  const max = Math.max(
    1,
    ...[...cells.values()].map((c) => (c.defects / c.sample) * 100),
  );
  return `<div class="activity-scroll"><div class="activity-grid" style="grid-template-columns:110px repeat(${dates.length},minmax(28px,1fr))"><span></span>${dates.map((date) => `<span class="activity-date">${e(date.slice(5))}</span>`).join("")}${groups
    .map(
      (g) =>
        `<button class="activity-name" data-explorer-group="${e(g.label)}">${e(g.label)}</button>${dates
          .map((date) => {
            const c = cells.get(JSON.stringify([g.label, date])),
              value = c ? (c.defects / c.sample) * 100 : null;
            return `<span class="activity-cell ${value !== null && value / max > 0.5 ? "dark" : ""}" tabindex="0" style="background:${value === null ? "#f0ece6" : `rgba(153,80,67,${0.08 + (0.9 * value) / max})`}" title="${e(g.label + " · " + date + " · " + (c ? c.defects + "/" + c.sample + " · " + pct(value) : "No sample"))}">${value === null ? "—" : n(value)}</span>`;
          })
          .join("")}`,
    )
    .join(
      "",
    )}</div></div><p class="chart-note">Defective observations (%) · ${dates.length} most recent observed dates · ${groups.length} displayed groups. — = no sample. Darker cells indicate higher observed rates; sample sizes are in tooltips and linked records.</p>`;
}
export function recoveryPlot(plans, selected) {
  if (!plans.length)
    return empty(
      "Confirm affected stock and complete capacity inputs to compare feasible recovery alternatives.",
    );
  const maxX = Math.max(1, ...plans.map((p) => p.totalDays)) * 1.1,
    maxY = Math.max(1, ...plans.map((p) => p.cost)) * 1.1,
    x = (v) => 70 + (v / maxX) * 530,
    y = (v) => 280 - (v / maxY) * 230;
  let svg = "";
  for (let i = 0; i <= 4; i++) {
    const val = (maxY * i) / 4;
    svg += `<line x1="70" y1="${y(val)}" x2="600" y2="${y(val)}" stroke="#e5ded7"/><text x="59" y="${y(val) + 4}" text-anchor="end">${usd(val)}</text><text x="${x((maxX * i) / 4)}" y="303" text-anchor="middle">${n((maxX * i) / 4)}</text>`;
  }
  svg += `<text x="70" y="20">Incremental recovery cost (USD)</text><text x="340" y="334" text-anchor="middle">Recovery lead time (working days) →</text>`;
  svg += plans
    .map(
      (p, i) =>
        `<a href="#studio" data-plan="${e(p.name)}" aria-label="Select ${e(p.name)}: ${usd(p.cost)}, ${n(p.totalDays)} working days"><circle class="recovery-point ${p.name === selected ? "selected" : ""}" cx="${x(p.totalDays)}" cy="${y(p.cost)}" r="${p.name === selected ? 11 : 7}"><title>${e(p.name)} · ${usd(p.cost)} · ${n(p.totalDays)} workdays · ${p.delay == null ? "cut-off unavailable" : p.delay + " days delay"}</title></circle><text x="${x(p.totalDays) + 13}" y="${y(p.cost) - 10}">${i + 1}</text></a>`,
    )
    .join("");
  return `<div class="studio-plot"><svg viewBox="0 0 650 355" role="img" aria-label="Interactive recovery cost and lead-time comparison">${svg}</svg></div><div class="recovery-key">${plans.map((p, i) => `<button data-plan="${e(p.name)}" aria-pressed="${selected === p.name}" class="${selected === p.name ? "selected" : ""}"><b>${i + 1}</b>${e(p.name)}</button>`).join("")}</div><p class="chart-note">Select a point or strategy to update the active recovery plan. Lower and left means less time and cost; review containment coverage, missed detections and delivery risk before choosing.</p>`;
}
export function studioView(db, a, plans, settings, selectedPlan) {
  const m = explorerModel(db, a, settings),
    high = m.groups[0],
    specs = visualSpecs(db, a, plans, selectedPlan),
    chosen = plans.find((p) => p.name === selectedPlan) || plans[0],
    sensitivity = costSensitivity(db, a);
  const selected = chosen?.name || "",
    dimensions = {
      factory: "Factory",
      line: "Sewing line",
      sku: "Product / style",
      stage: "Inspection stage",
      machine: "Machine group",
      fabric: "Fabric lot",
      shift: "Shift",
    };
  const spec = (id) => specs.find((s) => s.id === id),
    plot = (id) =>
      `<div class="visual-plot">${chart(spec(id))}</div><div class="visual-tools"><button class="btn" data-chart-svg="${id}">Download SVG</button><button class="btn" data-chart-csv="${id}">Chart data CSV</button></div>`;
  let html = `<div class="page-head studio-heading"><div><div class="eyebrow"><span class="eyebrow-line"></span>ANALYSIS STUDIO</div><h1>Look closer.<br><span>Decide with clarity.</span></h1><p>A connected analytical canvas for quality, inventory, economics and execution.</p></div><div class="studio-edition"><strong>50</strong><span>exportable visualizations<br>one connected evidence base</span></div></div>`;
  const reviewing = settings.mode === "review";
  html += `<nav class="studio-modes" aria-label="Analysis studio mode"><button data-studio-mode="explore" aria-pressed="${!reviewing}">Analytical canvas</button><button data-studio-mode="review" aria-pressed="${reviewing}">Critical decision review <span>Challenge the evidence ↗</span></button></nav>`;
  if (reviewing) return html + criticalReviewView(db, a, plans);
  html += section(
    "01",
    "Explore the quality signal",
    "These filters apply to this quality lens and its linked records. Portfolio, recovery and assurance lenses retain their labeled scopes.",
  );
  html += `<section class="studio-filter-panel"><label>Defect<select id="focus-defect">${a.defects.map((d) => option(d.type, d.type, a.focus)).join("")}</select></label><label>Compare by<select data-studio-setting="dimension">${Object.entries(
    dimensions,
  )
    .map(([v, l]) => option(v, l, m.dimension))
    .join(
      "",
    )}</select></label><label>Factory<select data-studio-setting="factory">${["All", ...new Set(db.batches.map((b) => b.factory))].map((v) => option(v, v, settings.factory || "All")).join("")}</select></label><label>Inspection stage<select data-studio-setting="stage">${["All", ...new Set(db.inspections.map((i) => i.stage))].map((v) => option(v, v, settings.stage || "All")).join("")}</select></label><label>From date<input type="date" data-studio-setting="from" value="${e(settings.from || "")}"></label><label>To date<input type="date" data-studio-setting="to" value="${e(settings.to || "")}"></label><label>Minimum group sample<input type="number" min="0" step="1" data-studio-setting="minimum" value="${e(settings.minimum || 0)}"></label><label>Compare measure<select data-studio-setting="metric">${option("rate", "Defective rate (%)", settings.metric || "rate")}${option("defects", "Defective observations", settings.metric)}</select></label><button class="text-button" data-studio-reset>Reset explorer</button></section>`;
  html += `<div class="studio-summary"><span><strong>${n(m.sample)}</strong>Inspected observations</span><span><strong>${n(m.defects)}</strong>Defective observations</span><span><strong>${pct(m.rate)}</strong>Volume-weighted rate</span><span><strong>${m.batchCount}</strong>Linked batches</span><div>${m.group ? `<button class="selection-chip" data-explorer-group="${e(m.group)}">${e(m.group)} <span>×</span></button>` : "All eligible groups"}<small>${m.rows.length} records in this selection</small></div></div>`;
  html += `<div class="analytics-grid studio-explore">${panel(dimensions[m.dimension] + " comparison", "Selected defect · sample-adjusted uncertainty · click to explore", groupChart(m, settings))}<aside class="studio-insight"><span class="eyebrow">READ THE PATTERN</span><h2>${high ? e(high.label) : "Evidence comes first."}</h2><strong>${high ? pct(high.rate) : "—"}</strong><p>${high ? "Highest observed rate among eligible groups, with " + n(high.defects) + " defective observations from " + n(high.sample) + " inspected." : "No inspection groups meet this selection."}</p>${high ? `<div class="insight-interval"><span>95% confidence interval</span><b>${pct(high.ci.low)} — ${pct(high.ci.high)}</b></div>` : ""}<small>This is a descriptive ranking. Validate product complexity, inspection consistency and sample comparability before attributing a cause.</small><button class="btn light" data-view="investigate">Open investigation →</button></aside></div>`;
  html += panel(
    "How does the pattern move over time?",
    "Linked inspection activity · selected groups and date range",
    activityGrid(db, m),
  );
  html += `<details class="linked-records"><summary><span><b>${m.rows.length}</b> supporting inspection records</span><span>Expand evidence ↓</span></summary><div class="linked-records-body"><div class="row"><p class="note">Export contains only the current explorer selection. Other reports use the full active dataset and selected defect.</p><button class="btn" data-action="studio-csv">Export this selection</button></div><div class="table-wrap"><table><thead><tr><th>Inspection</th><th>Batch</th><th>Date</th><th>Stage</th><th>Inspected</th><th>Defective</th><th>Rate</th><th>Decision</th></tr></thead><tbody>${m.rows.map((i) => `<tr><td>${e(i.id)}</td><td><button class="text-button" data-batch="${e(i.batch)}" data-view="trace">${e(i.batch)} ↗</button></td><td>${e(i.date || "Undated")}</td><td>${e(i.stage)}</td><td>${n(i.sample)}</td><td>${n(i.defects)}</td><td>${pct((i.defects / i.sample) * 100)}</td><td>${e(i.disposition)}</td></tr>`).join("")}</tbody></table></div></div></details>`;
  html += section(
    "02",
    "Map the operational exposure",
    "Entire selected-defect analysis · portfolio quantities are independent of the explorer filters.",
  );
  html += `<div class="analytics-grid equal-split">${panel("An inventory landscape", "Area is proportional to known stock; classification carries the evidence strength.", exposureMap(a))}${panel("Find the defect signature", "All defect types · compare patterns across sewing lines", plot("line-defect-matrix"))}</div>`;
  html += section(
    "03",
    "Balance recovery and economics",
    "Modeled alternatives under the active capacity, calendar and cost assumptions.",
  );
  html += `<div class="analytics-grid studio-decision">${panel("Choose the recovery trade-off", "Interactive cost-versus-time map · seven operational alternatives", recoveryPlot(plans, selected))}<section class="panel selected-strategy"><div class="eyebrow">SELECTED STRATEGY</div><h2>${e(selected || "Recovery requires confirmed inventory")}</h2><div class="strategy-metrics"><span><strong>${usd(chosen?.cost)}</strong>Incremental cost</span><span><strong>${n(chosen?.totalDays)}</strong>Working days</span><span><strong>${n(chosen?.unitsBeforeCutoff)}</strong>Units before cut-off</span><span><strong>${n(chosen?.delay)}</strong>Calendar days late</span></div><p class="note">${e(chosen?.assumptions || "Supply known inventory and valid recovery capacity.")}</p><button class="btn primary" data-view="recovery">Review schedule & constraints →</button></section></div>`;
  html += `<div class="analytics-grid equal-split">${panel("The sequence behind the promise", "Selected recovery · sequential resource allocation", plot("recovery-stage-timeline"))}${panel("The commercial case for prevention", sensitivity.breakEven == null ? "Complete failure cost, prevention investment and reduction assumptions." : "Break-even recurrence probability: " + pct(sensitivity.breakEven) + (sensitivity.breakEven > 100 ? " · exceeds the modeled probability range." : "."), plot("prevention-sensitivity"))}</div>`;
  html += section(
    "04",
    "Make execution visible",
    "Incident-wide action evidence, due dates and governance. A complete-looking chart does not authorize closure.",
  );
  const gates = governanceGates(db),
    pass = gates.filter(([, value]) => value).length;
  html += `<div class="assurance-strip"><div class="assurance-score"><strong>${pass}<span> / ${gates.length}</span></strong><small>Governance gates satisfied</small></div><div class="assurance-checks">${gates.map(([label, value]) => `<span class="${value ? "passed" : "pending"}"><i>${value ? "✓" : "○"}</i>${e(label)}</span>`).join("")}</div><button class="text-button" data-view="capa">Review closure gates →</button></div><div class="analytics-grid equal-split">${panel("Evidence without the blind spots", "Required actions × assurance inputs", plot("action-assurance-matrix"))}${panel("What needs attention first?", "Open actions · negative days mean overdue", plot("action-due-distance"))}</div>`;
  return (
    html +
    `<div class="source-footer"><span>${e(db.sourceName)} · ${day()} · USD</span><button class="text-button" data-view="visuals">Explore all ${specs.length} visualizations →</button></div>`
  );
}
