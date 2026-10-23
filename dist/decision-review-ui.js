import { e } from "./presentation.js";
import { criticalReview } from "./decision-review.js";

const n = (v) =>
  v == null
    ? "—"
    : Number(v).toLocaleString("en-US", { maximumFractionDigits: 1 });
const usd = (v) =>
  v == null
    ? "—"
    : (v < 0 ? "−" : "") +
      "$" +
      Math.round(Math.abs(v)).toLocaleString("en-US");
const percent = (v) => (v == null ? "—" : n(v) + "%");
const gap = (v) =>
  v == null ? "Unavailable" : (v > 0 ? "+" : "") + n(v) + " pp";
const panel = (title, note, body) =>
  `<section class="panel"><div class="panel-title"><div><h2>${e(title)}</h2><p>${e(note)}</p></div></div>${body}</section>`;
const dimNames = {
  factory: "Factory",
  line: "Sewing line",
  machine: "Machine group",
  fabric: "Fabric lot",
};

function comparisonCard(c) {
  if (!c.available)
    return `<article class="mix-card"><span class="eyebrow">${dimNames[c.dimension]}</span><h3>More comparable groups needed</h3><p>${e(c.reason)}</p></article>`;
  const max = Math.max(
      1,
      c.high.rate,
      c.low.rate,
      c.adjustedHigh || 0,
      c.adjustedLow || 0,
    ),
    bar = (label, high, low) =>
      `<div class="mix-bars"><span>${label}</span><div><i style="width:${(high / max) * 100}%"></i><b>${percent(high)}</b></div><div><i class="comparison" style="width:${(low / max) * 100}%"></i><b>${percent(low)}</b></div></div>`;
  return `<article class="mix-card ${c.reversal ? "mix-warning" : ""}"><span class="eyebrow">${dimNames[c.dimension]}</span><h3>${e(c.high.label)} <span>vs</span> ${e(c.low.label)}</h3><div class="mix-key"><span><i></i>${e(c.high.label)}</span><span><i class="comparison"></i>${e(c.low.label)}</span></div>${bar("Raw observed rates", c.high.rate, c.low.rate)}${c.sharedStrata ? bar("Same observed mix", c.adjustedHigh, c.adjustedLow) : '<div class="mix-unavailable">No shared, fully identified comparison strata.</div>'}<div class="mix-conclusion"><strong>${c.reversal ? "Ranking reversal" : !c.sharedStrata ? "Comparison is confounded" : "Descriptive comparison"}</strong><span>Raw gap ${gap(c.rawGap)} / adjusted ${gap(c.adjustedGap)}</span></div><p>Controls: ${e(c.controls.join(" + "))}. ${c.sharedStrata} shared strata; matched sample coverage ${percent(c.highCoverage)} / ${percent(c.lowCoverage)}.${c.sparse ? " One or both groups have fewer than five events or non-events." : ""}</p><details><summary>Method & evidence</summary><p>Both group rates use the same pooled sample weights across shared strata. Groups were selected as the raw highest and lowest, so this is exploratory and subject to selection bias. No causal effect or statistical significance is inferred. Missing identifiers and unshared strata are excluded.</p><p>${e(c.records.length ? c.records.join(", ") : "No shared-stratum record IDs.")}</p></details></article>`;
}
function stressMatrix(stress) {
  if (!stress.ready)
    return '<div class="studio-empty">Supply prevention investment and both failure-cost categories to evaluate the investment.</div>';
  const values = [0, 25, 50, 75, 100],
    max = Math.max(1, ...stress.points.map((p) => Math.abs(p.net)));
  return `<div class="stress-scroll"><div class="stress-matrix"><span>Reduction ↓<br>Recurrence →</span>${values.map((v) => `<b>${v}%</b>`).join("")}${values
    .map(
      (reduction) =>
        `<b>${reduction}%</b>${values
          .map((probability) => {
            const point = stress.points.find(
                (p) =>
                  p.probability === probability &&
                  p.effectiveness === reduction,
              ),
              alpha = 0.08 + (0.88 * Math.abs(point.net)) / max;
            return `<span tabindex="0" class="${alpha > 0.6 ? "deep" : ""}" style="background:rgba(${point.net < 0 ? "153,80,67" : "43,45,65"},${alpha})" title="${probability}% recurrence × ${reduction}% reduction: ${usd(point.net)} net expected benefit">${usd(point.net)}</span>`;
          })
          .join("")}`,
    )
    .join(
      "",
    )}</div></div><div class="stress-key"><span><i></i>Net cost</span><span><i></i>Net benefit</span><small>Stress scenarios, not probability forecasts</small></div><div class="stress-thresholds"><div><span>Stated-assumption net benefit</span><strong>${usd(stress.currentNet)}</strong><small>${percent(stress.recurrence)} recurrence / ${percent(stress.reduction)} reduction</small></div><div><span>Break-even recurrence</span><strong>${percent(stress.breakEvenRecurrence)}</strong><small>At the stated reduction</small></div><div><span>Break-even reduction</span><strong>${percent(stress.breakEvenReduction)}</strong><small>At the stated recurrence</small></div></div><p class="chart-note">Net = failure cost × recurrence × achieved reduction − prevention investment, for one comparable future incident. Thresholds above 100% are outside the possible probability/reduction range; — means the supplied assumptions cannot produce a finite threshold. This model excludes non-monetized consequences and additional future incidents.</p>`;
}
export function criticalReviewView(db, a, plans) {
  const review = criticalReview(db, a, plans),
    selectedPlan = db.incident?.selectedScenario || plans[0]?.name,
    required = review.findings.filter(
      (f) => f.priority === "Review required",
    ).length,
    comparisons = review.mixComparisons.filter((c) => c.available),
    warnings = comparisons.filter((c) => c.reversal || !c.sharedStrata).length;
  let html = `<div class="review-intro"><div><div class="eyebrow">THE DECISION, CHALLENGED</div><h2>What can the evidence<br>actually support?</h2><p>Separate a useful signal from a defensible conclusion. Every challenge below is derived from the active data and has a verification step.</p></div><div class="review-facts"><span><strong>${required}</strong>Evidence gaps to review</span><span><strong>${warnings}</strong>Confounded or reversed comparisons</span><span><strong>${review.recovery.plans.filter((p) => p.efficient).length}</strong>Undominated modeled alternatives</span></div></div><p class="chart-note">${e(review.scope)} These are decision-support checks, not new automatic approval or closure rules.</p>`;
  html += panel(
    "The questions that matter before acting",
    review.findings.length +
      " evidence-linked findings · no invented confidence score",
    `<div class="review-findings">${review.findings.map((f, i) => `<article class="review-finding"><div><span class="finding-index">${String(i + 1).padStart(2, "0")}</span><span class="review-priority">${e(f.priority)}</span></div><h3>${e(f.title)}</h3><p>${e(f.observation)}</p><div class="review-implication"><span>WHY IT MATTERS</span><p>${e(f.implication)}</p></div><div class="review-next"><span>VERIFY NEXT</span><p>${e(f.next)}</p></div>${f.evidence.length ? `<details><summary>${f.evidence.length} supporting records</summary><p>${e(f.evidence.join(", "))}</p></details>` : ""}<button class="text-button" data-view="${f.view}">Open ${f.view === "investigate" ? "investigation" : f.view === "learning" ? "effectiveness" : f.view} →</button></article>`).join("") || '<div class="studio-empty">No listed challenge was triggered. This is not a certification of data accuracy or release readiness.</div>'}</div>`,
  );
  html += panel(
    "Would the ranking survive a fairer comparison?",
    "Raw highest-vs-lowest groups compared at a common observed product and inspection mix.",
    `<div class="mix-grid">${review.mixComparisons.map(comparisonCard).join("")}</div><p class="chart-note">A reversal is a warning about composition. A persistent difference is still an association. Time, operator skill, environment and measurement consistency may remain uncontrolled. Coverage percentages show how much evidence was retained.</p>`,
  );
  html += panel(
    "Which recovery options survive the trade-off test?",
    `A plan is dominated only when another is no worse on all ${review.recovery.criteria.length} included criteria and better on at least one. Select a strategy to update the saved recovery plan.`,
    review.recovery.plans.length
      ? `<div class="table-wrap"><table><thead><tr><th>Strategy</th><th>Assessment</th><th>Cost</th><th>Workdays</th><th>Uninspected related stock</th><th>Units before cut-off</th></tr></thead><tbody>${review.recovery.plans.map((p) => `<tr><td><button class="text-button" data-plan="${e(p.name)}" aria-pressed="${p.name === selectedPlan}">${e(p.name)}</button>${p.name === selectedPlan ? '<small class="cell-detail">Selected recovery plan</small>' : ""}</td><td><span class="badge ${p.efficient ? "neutral" : "warning"}">${!p.assessed ? "Not assessable" : p.efficient ? "Undominated" : "Dominated"}</span><small class="cell-detail">${p.dominatedBy.length ? "No better than: " + e(p.dominatedBy.join("; ")) : "Review non-modeled constraints before deciding."}</small></td><td>${usd(p.cost)}</td><td>${n(p.totalDays)}</td><td>${n(p.untestedRelated)}</td><td>${n(p.unitsBeforeCutoff)}</td></tr>`).join("")}</tbody></table></div><p class="chart-note">Minimized: cost, lead time, untested related units, expected missed defects, expected false holds and handling damage. ${review.recovery.cutoffKnown ? "Units before cut-off are maximized." : "Cut-off is unknown; delivery adherence is excluded."} Risk categories can overlap. Dominance is conditional on the supplied estimates and does not replace approvals, worker safety, material compatibility or customer commitments.</p>`
      : '<div class="studio-empty">Recovery comparisons require confirmed stock and valid planning inputs.</div>',
  );
  html += panel(
    "Does prevention remain worthwhile when assumptions change?",
    "Two-dimensional stress test: recurrence probability × achieved defect reduction.",
    stressMatrix(review.prevention),
  );
  return (
    html +
    `<div class="review-export"><div><h3>Keep the reasoning with the decision.</h3><p>Decision HTML and analytical JSON include findings, comparison strata, recovery dominance and all stress-test values.</p></div><button class="btn primary" data-action="report-html">Download decision report</button></div>`
  );
}
