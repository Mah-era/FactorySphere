import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  normalizeDataset,
  deriveAnalysis,
  recoveryOptions,
} from "../dist/analysis-core.js";
import { scheduleRecovery } from "../dist/intelligence.js";
import { explorerModel } from "../dist/advanced-analytics.js";
import { stockLayout, studioView } from "../dist/analytics-studio.js";
import {
  mixComparison,
  recoveryFrontier,
  preventionStress,
  criticalReview,
} from "../dist/decision-review.js";
import { criticalReviewView } from "../dist/decision-review-ui.js";
import { visualSpecs, standaloneSvg } from "../dist/visualizations.js";
import {
  appShell,
  commandResults,
  overviewExperience,
} from "../dist/experience.js";

const db = normalizeDataset(
  {
    batches: [
      {
        id: "A",
        factory: "F1",
        line: "L1",
        sku: "S",
        inventory: 80,
        shipped: 20,
      },
      {
        id: "B",
        factory: "F2",
        line: "L2",
        sku: "S",
        inventory: 40,
        shipped: 60,
      },
    ],
    inspections: [
      {
        id: "I1",
        batch: "A",
        type: "Seam",
        date: "2026-10-01",
        stage: "Final",
        sample: 100,
        defects: 2,
      },
      {
        id: "I2",
        batch: "A",
        type: "Seam",
        date: "2026-10-02",
        stage: "Final",
        sample: 100,
        defects: 6,
      },
      {
        id: "I3",
        batch: "B",
        type: "Seam",
        date: "2026-10-03",
        stage: "Inline",
        sample: 50,
        defects: 1,
      },
    ],
    costInputs: {
      prevention: 100,
      appraisal: 50,
      internal: 200,
      external: 300,
      recurrence: 50,
      reduction: 50,
    },
  },
  "Independent explorer oracle",
);
const a = deriveAnalysis(db),
  m = explorerModel(db, a);
assert.equal(m.sample, 250);
assert.equal(m.defects, 9);
assert(Math.abs(m.rate - 3.6) < 1e-10);
assert.equal(m.batchCount, 2);
const reversalDb = normalizeDataset({
  batches: [
    { id: "AE", factory: "A", sku: "Easy" },
    { id: "AH", factory: "A", sku: "Hard" },
    { id: "BE", factory: "B", sku: "Easy" },
    { id: "BH", factory: "B", sku: "Hard" },
  ],
  inspections: [
    ["AE", 100, 1],
    ["AH", 900, 81],
    ["BE", 900, 18],
    ["BH", 100, 10],
  ].map(([batch, sample, defects], i) => ({
    id: "M" + i,
    batch,
    sample,
    defects,
    type: "Seam",
    stage: "Final",
  })),
});
const mix = mixComparison(
  reversalDb,
  deriveAnalysis(reversalDb).focusRows,
  "factory",
);
assert(Math.abs(mix.rawGap - 5.4) < 1e-10);
assert(Math.abs(mix.adjustedGap + 1) < 1e-10);
assert.equal(mix.reversal, true);
assert.equal(mix.sharedStrata, 2);
assert.equal(mix.highCoverage, 100);
assert.equal(mix.lowCoverage, 100);
const noControl = structuredClone(reversalDb);
noControl.batches.forEach((b) => (b.sku = ""));
assert.equal(
  mixComparison(noControl, deriveAnalysis(noControl).focusRows, "factory")
    .adjustedGap,
  null,
);
const basePlan = {
  feasible: true,
  untestedRelated: 100,
  expectedMissed: 2,
  expectedFalseHold: 1,
  handlingUnits: 1,
  unitsBeforeCutoff: 0,
};
const frontier = recoveryFrontier([
  { ...basePlan, name: "A", cost: 100, totalDays: 5 },
  { ...basePlan, name: "B", cost: 120, totalDays: 7 },
  {
    ...basePlan,
    name: "C",
    cost: 80,
    totalDays: 4,
    untestedRelated: 200,
    expectedMissed: 3,
  },
  { ...basePlan, name: "Equal A", cost: 100, totalDays: 5 },
]);
assert.deepEqual(frontier.plans.find((p) => p.name === "B").dominatedBy, [
  "A",
  "Equal A",
]);
assert.equal(frontier.plans.find((p) => p.name === "C").efficient, true);
assert.equal(frontier.plans.find((p) => p.name === "A").efficient, true);
assert.equal(frontier.criteria.length, 7);
assert.equal(
  recoveryFrontier([
    {
      ...basePlan,
      name: "Unknown cutoff",
      cost: 100,
      totalDays: 5,
      unitsBeforeCutoff: null,
    },
  ]).criteria.length,
  6,
);
const stress = preventionStress(db, a);
assert.equal(
  stress.points.find((p) => p.probability === 25 && p.effectiveness === 25).net,
  -68.75,
);
assert.equal(stress.currentNet, 25);
assert.equal(stress.breakEvenReduction, 40);
const zero = structuredClone(db);
zero.inspections.forEach((i) => (i.defects = 0));
assert(
  criticalReview(zero, deriveAnalysis(zero), []).findings.some(
    (f) => f.id === "zero-failures",
  ),
);
assert.equal(m.groups.find((g) => g.label === "F1").rate, 4);
assert.equal(m.groups.find((g) => g.label === "F2").rate, 2);
assert.equal(explorerModel(db, a, { group: "F2" }).sample, 50);
assert.equal(explorerModel(db, a, { minimum: 100 }).sample, 200);
assert.equal(
  explorerModel(db, a, { from: "2026-10-02", to: "2026-10-02" }).rate,
  6,
);
assert.equal(
  explorerModel(db, a, { factory: "F2", stage: "Final" }).rate,
  null,
);
assert.equal(explorerModel(db, a, { minimum: 10000 }).rows.length, 0);
assert.equal(
  explorerModel(db, a, { group: "stale group from previous file" }).sample,
  250,
);
const specs = visualSpecs(db, a, []),
  matrix = specs.find((s) => s.id === "line-defect-matrix");
assert.equal(matrix.rows.find((r) => r.row === "L1").sample, 200);
assert.equal(matrix.rows.find((r) => r.row === "L1").value, 4);
const curve = specs.find((s) => s.id === "prevention-sensitivity");
assert.equal(curve.rows[0].y, -100);
assert.equal(curve.rows.at(-1).y, 150);
assert(!/NaN|Infinity|undefined/.test(standaloneSvg(curve)));
const layout = stockLayout(db.batches, 0, 0, 100, 60);
assert(
  Math.abs(layout.reduce((total, r) => total + r.w * r.h, 0) - 6000) < 1e-8,
);
for (const r of layout) {
  assert(Math.abs((r.w * r.h) / 6000 - r.inventory / 120) < 1e-8);
  assert(
    r.x >= 0 && r.y >= 0 && r.x + r.w <= 100.00001 && r.y + r.h <= 60.00001,
  );
}
const hostile = structuredClone(db);
hostile.sourceName = "<script>alert(1)</script>";
hostile.batches[0].id = "<img src=x onerror=alert(1)>";
assert(!appShell(hostile, "studio", "safe", "Seam").includes("<script>"));
assert(!commandResults(hostile, "img").includes("<img"));
assert(commandResults(db, "F2").includes('data-batch="B"'));
assert(commandResults(db, "studio").includes('data-view="studio"'));
const cases = JSON.parse(
  readFileSync(new URL("../dist/test-files/index.json", import.meta.url)),
);
for (const item of [...cases, { file: "enterprise-demonstration.json" }]) {
  const data = normalizeDataset(
      JSON.parse(
        readFileSync(
          new URL("../dist/test-files/" + item.file, import.meta.url),
        ),
      ),
    ),
    analysis = deriveAnalysis(data),
    plans = scheduleRecovery(data, analysis, recoveryOptions(data, analysis));
  const state = {
    focusDefect: "Auto",
    referenceBatch: "Auto",
    factoryFilter: "All",
    scopeFilter: "All",
    selectedRecovery: plans[0]?.name,
  };
  for (const html of [
    studioView(data, analysis, plans, {}, plans[0]?.name),
    criticalReviewView(data, analysis, plans),
    overviewExperience(data, analysis, plans, state),
  ])
    assert(!/NaN|Infinity|undefined/.test(html), item.file);
  assert.equal(visualSpecs(data, analysis, plans).length, 50);
}
console.log(
  "Passed explorer arithmetic, filter intersections, 12 new charts, Simpson ranking reversal, non-comparable groups, seven-criterion recovery dominance, prevention stress oracles, zero-event uncertainty, area conservation, safe search and full redesigned rendering across 21 datasets.",
);
