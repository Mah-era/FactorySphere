import {
  groupRates,
  profileData,
  costSensitivity,
  comparableEffect,
  interval,
  sum,
  governanceGates,
} from "./intelligence.js";
import { deriveEffectiveness, deriveCost } from "./analysis-core.js";

const number = (value) =>
  value == null
    ? "Unavailable"
    : Number(value).toLocaleString("en-US", { maximumFractionDigits: 1 });
const finite = (value) => typeof value === "number" && Number.isFinite(value);

// Direct standardization over explicitly shared strata. This describes a
// common observed mix; it neither estimates a causal effect nor a p-value.
export function mixComparison(db, rows, dimension) {
  const controls =
    dimension === "factory"
      ? ["sku", "stage"]
      : dimension === "fabric"
        ? ["sku", "stage", "factory", "line"]
        : ["sku", "stage", "factory"];
  const groups = groupRates(db, rows, dimension).filter(
    (g) => !["Not supplied", "Unspecified"].includes(g.label),
  );
  if (groups.length < 2)
    return {
      dimension,
      controls,
      available: false,
      reason: "At least two identified groups are required.",
    };
  const high = groups[0],
    low = groups.at(-1),
    batches = new Map(db.batches.map((b) => [b.id, b])),
    strata = new Map();
  for (const i of rows) {
    const batch = batches.get(i.batch) || {},
      label = i[dimension] || batch[dimension];
    if (label !== high.label && label !== low.label) continue;
    const values = controls.map((key) => i[key] || batch[key]);
    if (values.some((v) => !v || ["Unspecified", "Not supplied"].includes(v)))
      continue;
    const key = JSON.stringify(values),
      s = strata.get(key) || {
        key,
        values,
        high: { sample: 0, defects: 0, records: [] },
        low: { sample: 0, defects: 0, records: [] },
      },
      side = label === high.label ? s.high : s.low;
    side.sample += i.sample;
    side.defects += i.defects;
    side.records.push(i.id);
    strata.set(key, s);
  }
  const shared = [...strata.values()].filter(
      (s) => s.high.sample > 0 && s.low.sample > 0,
    ),
    total = shared.reduce((n, s) => n + s.high.sample + s.low.sample, 0);
  const adjustedHigh = total
    ? shared.reduce(
        (n, s) =>
          n +
          ((((s.high.sample + s.low.sample) / total) * s.high.defects) /
            s.high.sample) *
            100,
        0,
      )
    : null;
  const adjustedLow = total
    ? shared.reduce(
        (n, s) =>
          n +
          ((((s.high.sample + s.low.sample) / total) * s.low.defects) /
            s.low.sample) *
            100,
        0,
      )
    : null;
  const adjustedGap = adjustedHigh === null ? null : adjustedHigh - adjustedLow,
    rawGap = high.rate - low.rate;
  return {
    dimension,
    controls,
    available: true,
    high,
    low,
    rawGap,
    adjustedHigh,
    adjustedLow,
    adjustedGap,
    sharedStrata: shared.length,
    highCoverage:
      (shared.reduce((n, s) => n + s.high.sample, 0) / high.sample) * 100,
    lowCoverage:
      (shared.reduce((n, s) => n + s.low.sample, 0) / low.sample) * 100,
    reversal: adjustedGap !== null && rawGap > 1e-10 && adjustedGap < -1e-10,
    sparse: [high, low].some((g) => g.defects < 5 || g.sample - g.defects < 5),
    records: [
      ...new Set(shared.flatMap((s) => [...s.high.records, ...s.low.records])),
    ],
    strata: shared,
  };
}

export function recoveryFrontier(plans) {
  const axes = [
    ["cost", 1],
    ["totalDays", 1],
    ["untestedRelated", 1],
    ["expectedMissed", 1],
    ["expectedFalseHold", 1],
    ["handlingUnits", 1],
  ];
  const cutoffKnown =
    plans.length > 0 && plans.every((p) => finite(p.unitsBeforeCutoff));
  if (cutoffKnown) axes.push(["unitsBeforeCutoff", -1]);
  const eligible = plans.filter(
    (p) => p.feasible && axes.every(([key]) => finite(p[key])),
  );
  return {
    criteria: axes.map(([field, direction]) => ({
      field,
      direction: direction === 1 ? "minimize" : "maximize",
    })),
    cutoffKnown,
    plans: plans.map((p) => {
      const assessed = eligible.includes(p),
        dominators = assessed
          ? eligible
              .filter(
                (q) =>
                  q !== p &&
                  axes.every(([k, d]) => q[k] * d <= p[k] * d + 1e-9) &&
                  axes.some(([k, d]) => q[k] * d < p[k] * d - 1e-9),
              )
              .map((q) => q.name)
          : [];
      return {
        name: p.name,
        assessed,
        dominatedBy: dominators,
        efficient: assessed && !dominators.length,
        cost: p.cost,
        totalDays: p.totalDays,
        untestedRelated: p.untestedRelated,
        unitsBeforeCutoff: p.unitsBeforeCutoff,
      };
    }),
  };
}

export function preventionStress(db, a) {
  const sensitivity = costSensitivity(db, a),
    values = Object.fromEntries(a.costRows),
    investment = values.Prevention;
  const ready = sensitivity.failure !== null && investment !== null,
    recurrence = db.costInputs.recurrence,
    reduction = db.costInputs.reduction;
  return {
    ready,
    investment,
    failureCost: sensitivity.failure,
    recurrence,
    reduction,
    breakEvenRecurrence: sensitivity.breakEven,
    breakEvenReduction:
      ready && sensitivity.failure > 0 && recurrence > 0
        ? (investment / ((sensitivity.failure * recurrence) / 100)) * 100
        : null,
    currentNet:
      ready && recurrence !== null && reduction !== null
        ? (((sensitivity.failure * recurrence) / 100) * reduction) / 100 -
          investment
        : null,
    points: ready
      ? [0, 25, 50, 75, 100].flatMap((probability) =>
          [0, 25, 50, 75, 100].map((effectiveness) => ({
            probability,
            effectiveness,
            net:
              (((sensitivity.failure * probability) / 100) * effectiveness) /
                100 -
              investment,
          })),
        )
      : [],
  };
}

export function criticalReview(db, a, plans) {
  const findings = [],
    profile = profileData(db),
    sample = sum(a.focusRows, "sample"),
    defects = sum(a.focusRows, "defects"),
    ci = interval(defects, sample),
    cost = deriveCost(db, a);
  const add = (
    id,
    priority,
    title,
    observation,
    implication,
    next,
    evidence,
    view,
  ) =>
    findings.push({
      id,
      priority,
      title,
      observation,
      implication,
      next,
      evidence,
      view,
    });
  const screening = a.focusRows.filter(
    (i) => i.dispositionInferred && i.thresholdAssumed,
  );
  if (screening.length)
    add(
      "screening",
      "Review required",
      "Screening results are not verified failures",
      `${screening.length} selected-defect inspections use an assumed threshold and inferred disposition.`,
      "These records cannot alone justify confirmed containment or shipment release.",
      "Have a reviewer record the applicable acceptance criterion, disposition and evidence.",
      screening.map((i) => i.id),
      "quality",
    );
  const missing = a.exposure.filter(
    (b) =>
      ["Confirmed", "Precautionary"].includes(b.scope) && b.inventory === null,
  );
  if (missing.length)
    add(
      "inventory",
      "Review required",
      "The physical exposure is incomplete",
      `${missing.length} related batches have no known inventory quantity.`,
      "Recovery load, holding cost and capacity requirements may be understated.",
      "Reconcile stock with the factory or warehouse before comparing complete recovery plans.",
      missing.map((b) => b.id),
      "data",
    );
  if (profile.duplicates.length)
    add(
      "duplicates",
      "Review required",
      "Repeated observations may inflate apparent evidence",
      `${profile.duplicates.length} inspection records have a duplicate batch/date/stage/defect/quantity signature.`,
      "Counts may include repeated measurements; observations do not establish unique affected garments.",
      "Review record IDs and measurement provenance before treating samples as independent.",
      profile.duplicates,
      "data",
    );
  const passingRelated = a.focusRows.filter(
    (i) =>
      a.precautionary.some((b) => b.id === i.batch) &&
      i.disposition === "Pass" &&
      !i.dispositionInferred,
  );
  if (passingRelated.length)
    add(
      "passing-control",
      "Competing evidence",
      "Related production also contains passing evidence",
      `${passingRelated.length} supplied Pass records occur in precautionary batches.`,
      "A shared lot or process link does not imply every connected batch failed.",
      "Compare passing and failing process conditions; preserve the passing batches as investigation controls.",
      passingRelated.map((i) => i.id),
      "investigate",
    );
  const mixes = ["factory", "line", "machine", "fabric"].map((d) =>
    mixComparison(db, a.focusRows, d),
  );
  for (const m of mixes.filter(
    (m) => m.available && (m.reversal || !m.sharedStrata),
  )) {
    add(
      "mix-" + m.dimension,
      "Comparison warning",
      m.reversal
        ? "The ranking reverses after adjusting the observed mix"
        : "The " +
            m.dimension +
            " comparison lacks a shared production context",
      m.reversal
        ? `${m.high.label} vs ${m.low.label}: raw gap ${number(m.rawGap)} percentage points; common-mix gap ${number(m.adjustedGap)} points.`
        : `${m.high.label} and ${m.low.label} share no fully identified ${m.controls.join(" / ")} stratum.`,
      "An aggregate difference can reflect product, inspection-stage or factory composition rather than the factor being compared.",
      "Collect comparable control production and check timing, complexity, training and settings before attributing a cause.",
      [...m.high.records, ...m.low.records],
      "investigate",
    );
  }
  if (sample && defects === 0)
    add(
      "zero-failures",
      "Uncertainty",
      "Zero observed defects does not prove zero risk",
      `No defective observations in n=${number(sample)}. The Wilson 95% upper bound is ${number(ci.high)}%.`,
      "The sample does not establish that future production is defect-free.",
      "Continue a documented acceptance and recurrence-monitoring plan.",
      a.focusRows.map((i) => i.id),
      "quality",
    );
  else if (sample && (defects < 5 || sample - defects < 5))
    add(
      "sparse",
      "Uncertainty",
      "A small event count limits the inference",
      `${number(defects)}/${number(sample)} defective observations; Wilson 95% interval ${number(ci.low)}%–${number(ci.high)}%.`,
      "Small event counts make rate rankings sensitive to a few garments; repeated inspections may also violate independence.",
      "Increase comparable inspection evidence before making causal or recurrence claims.",
      a.focusRows.map((i) => i.id),
      "quality",
    );
  if (cost.failureCost === null)
    add(
      "cost-coverage",
      "Review required",
      "A complete failure-cost basis is unavailable",
      "Internal and external failure costs are not both supplied.",
      "Expected failure loss, prevention value and break-even conclusions cannot be established.",
      "Supply both cost categories or a reconciled attributed cost ledger.",
      [],
      "cost",
    );
  const frontier = recoveryFrontier(plans),
    stress = preventionStress(db, a);
  if (plans.length && !frontier.cutoffKnown)
    add(
      "cutoff",
      "Review required",
      "Delivery feasibility has no shipment deadline",
      "At least one plan has no calculated units-before-cut-off value.",
      "A recovery completion date is available, but on-time delivery cannot be established.",
      "Record the applicable shipment cut-off and check the logistics calendar.",
      [],
      "recovery",
    );
  if (stress.currentNet !== null && stress.currentNet <= 0)
    add(
      "prevention",
      "Commercial challenge",
      "The stated prevention case does not create positive expected value",
      `At ${number(stress.recurrence)}% recurrence and ${number(stress.reduction)}% reduction, net expected benefit is USD ${number(stress.currentNet)}.`,
      "Under these assumptions, expected avoided failure cost does not exceed the investment. Other required safety or quality obligations remain separate.",
      "Review the investment, recurrence exposure, achievable reduction and non-monetized consequences.",
      [],
      "cost",
    );
  const effect = deriveEffectiveness(db, a),
    matched = comparableEffect(db, a, effect);
  if (effect.implementedAt && !matched.comparable)
    add(
      "effect-cohort",
      "Review required",
      "Post-action effectiveness lacks a comparable cohort",
      "The file cannot form both before and after samples with matching SKU, factory, line and overlapping stages.",
      "A lower overall rate may be a change in product or sampling mix. It does not verify the intervention.",
      "Collect the comparable follow-up cohort and retain the 30/60/90-day evidence.",
      [],
      "learning",
    );
  if (!db.incident.causeConfirmed)
    add(
      "cause",
      "Review required",
      "The root cause remains an investigation hypothesis",
      "No evidence-backed confirmed cause is recorded for the incident.",
      "Machine, material and operator associations are candidate explanations, not established mechanisms.",
      "Use a controlled check, retain the evidence and name the responsible reviewer.",
      [],
      "investigate",
    );
  const missingGovernance = governanceGates(db)
    .filter(([, complete]) => !complete)
    .map(([label]) => label);
  if (missingGovernance.length)
    add(
      "governance",
      "Review required",
      "The incident is not fully supported by governance evidence",
      missingGovernance.join("; ") + ".",
      "An analytical improvement does not establish action completion, approval or independent verification.",
      "Complete named ownership, approval records and independent verification before requesting closure.",
      db.actions.filter((action) => action.required).map((action) => action.id),
      "capa",
    );
  return {
    scope:
      "Entire active dataset and selected defect; independent of studio quality-lens filters.",
    findings,
    mixComparisons: mixes,
    recovery: frontier,
    prevention: stress,
    observed: {
      sample,
      defects,
      rate: sample ? (defects / sample) * 100 : null,
      interval: ci,
    },
    method:
      "Descriptive evidence review, direct standardization and deterministic multi-criteria dominance. No automatic root-cause or release decision.",
  };
}
