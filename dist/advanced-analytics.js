import { groupRates, costSensitivity, day, sum } from "./intelligence.js";
import { deriveEffectiveness } from "./analysis-core.js";

// All values are observation-weighted. Distinct garments are never inferred
// from inspection rows, and missing business quantities remain unavailable.
export function advancedSpecs(db, a, plans, selectedPlan) {
  const specs = [],
    batches = new Map(db.batches.map((b) => [b.id, b]));
  const add = (id, view, title, note, kind, rows, unit, extra = {}) =>
    specs.push({ id, view, title, note, kind, rows, unit, ...extra });
  const daily = groupRates(
    db,
    a.focusRows.filter((i) => i.date),
    "date",
  ).sort((x, y) => x.label.localeCompare(y.label));
  add(
    "daily-defective-rate",
    "quality",
    "Daily observed defective rate",
    `Selected defect: ${a.focus}. Volume-weighted daily observations across the supplied product mix; this descriptive trend is not a control chart.`,
    "line",
    daily.map((g) => ({
      label: g.label,
      value: g.rate,
      sample: g.sample,
      defects: g.defects,
    })),
    "%",
  );
  add(
    "batch-volume-rate",
    "quality",
    "Sample volume versus observed batch rate",
    "Selected defect. Each point is a batch; small samples require wider uncertainty. A high observed rate is not proof of a cause.",
    "scatter",
    groupRates(db, a.focusRows, "batch").map((g) => ({
      label: g.label,
      x: g.sample,
      y: g.rate,
    })),
    "%",
    {
      xLabel: "Inspected observations per batch",
      yLabel: "Defective observations (%)",
    },
  );
  const cells = new Map();
  for (const i of db.inspections) {
    const row = batches.get(i.batch)?.line || "Not supplied",
      column = i.type,
      key = JSON.stringify([row, column]),
      cell = cells.get(key) || {
        label: row + " / " + column,
        row,
        column,
        sample: 0,
        defects: 0,
      };
    cell.sample += i.sample;
    cell.defects += i.defects;
    cells.set(key, cell);
  }
  add(
    "line-defect-matrix",
    "quality",
    "Defect signatures across production lines",
    "All defect types. Each cell uses its own inspected-observation denominator. Blank cells have no sample; rates across different products are descriptive.",
    "heat",
    [...cells.values()].map((c) => ({
      ...c,
      value: (c.defects / c.sample) * 100,
    })),
    "%",
  );
  const fabricCells = new Map();
  for (const i of a.focusRows) {
    const b = batches.get(i.batch),
      row = b?.fabric || "Not supplied",
      column = b?.factory || "Not supplied",
      key = JSON.stringify([row, column]),
      cell = fabricCells.get(key) || {
        label: row + " / " + column,
        row,
        column,
        sample: 0,
        defects: 0,
      };
    cell.sample += i.sample;
    cell.defects += i.defects;
    fabricCells.set(key, cell);
  }
  add(
    "material-factory-matrix",
    "investigate",
    "Material lots across factories",
    "Selected defect. Compare shared fabric lots across factories; material and process effects remain confounded without a controlled investigation.",
    "heat",
    [...fabricCells.values()].map((c) => ({
      ...c,
      value: (c.defects / c.sample) * 100,
    })),
    "%",
  );
  add(
    "batch-stock-shipped",
    "trace",
    "Related batch stock and shipment footprint",
    "Confirmed and precautionary batches only. Known stock and shipped quantities; a missing component is explicitly marked in chart data.",
    "stack",
    a.exposure
      .filter((b) => ["Confirmed", "Precautionary"].includes(b.scope))
      .map((b) => ({
        label: b.id,
        inventory: b.inventory,
        shipped: b.shipped,
        classification: b.scope,
      })),
    "units",
    { parts: ["inventory", "shipped"] },
  );
  const scopeGroups = new Map();
  for (const b of a.exposure.filter(
    (b) =>
      ["Confirmed", "Precautionary"].includes(b.scope) && b.inventory !== null,
  )) {
    const row = scopeGroups.get(b.factory) || {
      label: b.factory,
      confirmedStock: 0,
      precautionaryStock: 0,
    };
    row[b.scope === "Confirmed" ? "confirmedStock" : "precautionaryStock"] +=
      b.inventory;
    scopeGroups.set(b.factory, row);
  }
  add(
    "factory-containment",
    "containment",
    "Containment inventory by factory",
    "Known stock only. Confirmed failure evidence and precautionary exposure remain separate; this chart is not a physical quarantine confirmation.",
    "stack",
    [...scopeGroups.values()],
    "stock units",
    { parts: ["confirmedStock", "precautionaryStock"] },
  );
  const stages = new Map();
  for (const i of a.focusRows) {
    const r = stages.get(i.stage) || {
      label: i.stage,
      pass: 0,
      fail: 0,
      unknown: 0,
    };
    r[
      i.disposition === "Pass"
        ? "pass"
        : i.disposition === "Fail"
          ? "fail"
          : "unknown"
    ]++;
    stages.set(i.stage, r);
  }
  add(
    "stage-disposition",
    "quality",
    "Inspection decisions across stages",
    "Selected defect. Counts of inspection records, including inferred screening decisions. A Fail record is not automatically a confirmed batch.",
    "stack",
    [...stages.values()],
    "records",
    { parts: ["pass", "fail", "unknown"] },
  );
  const sensitivity = costSensitivity(db, a);
  add(
    "prevention-sensitivity",
    "cost",
    "When does prevention pay back?",
    "One comparable future incident. Net expected benefit = failure cost × recurrence probability × expected reduction − prevention investment. Negative values represent a net cost.",
    "curve",
    sensitivity.points.map((p) => ({
      label: p.probability + "% recurrence",
      x: p.probability,
      y: p.net,
      value: p.net,
    })),
    "USD",
    {
      xLabel: "Recurrence probability (%)",
      yLabel: "Net expected benefit (USD)",
    },
  );
  const chosen = plans.find((p) => p.name === selectedPlan) || plans[0];
  add(
    "recovery-stage-timeline",
    "recovery",
    "The selected recovery critical path",
    chosen
      ? chosen.name +
          " · Sequential working-day estimates. Duration reflects supplied capacity and planning assumptions, not a live resource reservation."
      : "Confirmed stock and valid capacity are required.",
    "timeline",
    chosen
      ? chosen.stages.map((s) => ({
          label: s.name,
          start: s.start,
          end: s.end,
          value: s.duration,
          resource: s.resource,
        }))
      : [],
    "working days",
  );
  add(
    "action-due-distance",
    "capa",
    "How far are actions from their deadline?",
    `Open actions with supplied deadlines, relative to ${day()} in Asia/Dhaka. Negative days mean overdue. No workload or effort is inferred.`,
    "diverging",
    db.actions
      .filter((x) => x.status !== "Done" && x.due)
      .map((x) => ({
        label: x.id,
        value: Math.round(
          (Date.parse(x.due + "T00:00:00Z") -
            Date.parse(day() + "T00:00:00Z")) /
            86400000,
        ),
        owner: x.owner,
        title: x.title,
      })),
    "days until due",
  );
  const checks = [
    ["Owner", (x) => !!x.owner],
    ["Accountable", (x) => !!x.accountable],
    ["Verifier", (x) => !!x.verifier],
    ["Evidence", (x) => !!x.evidence],
    [
      "Completed & dated",
      (x) => x.status === "Done" && !!x.completedAt && x.completedAt <= day(),
    ],
  ];
  add(
    "action-assurance-matrix",
    "capa",
    "Action-by-action assurance matrix",
    "Required actions only. A supplied field is not an approval. Dependency and independent-review closure gates are evaluated separately.",
    "heat",
    db.actions
      .filter((x) => x.required)
      .flatMap((x) =>
        checks.map(([column, check]) => ({
          label: x.id + " / " + column,
          row: x.id,
          column,
          value: check(x) ? 1 : 0,
        })),
      ),
    "supplied (1) / missing (0)",
    { binary: true },
  );
  const effect = deriveEffectiveness(db, a);
  // Use the same explicit identity cohort as the effectiveness engine; retain
  // stage denominators so a changed stage mix cannot masquerade as improvement.
  const ref = a.reference,
    cohort = new Set(
      db.batches
        .filter(
          (b) =>
            ref.sku &&
            ref.line &&
            ref.factory !== "Unspecified" &&
            b.sku === ref.sku &&
            b.factory === ref.factory &&
            b.line === ref.line,
        )
        .map((b) => b.id),
    );
  const periods = [
    ["Before", effect.baseline],
    ["After", effect.post],
  ];
  add(
    "effect-stage-matrix",
    "learning",
    "Before-and-after stage mix",
    "Matched SKU, factory and line. Stage-specific defective rates expose changes in inspection mix. Non-overlapping stages do not establish comparable effectiveness.",
    "heat",
    periods.flatMap(([column, rows]) =>
      groupRates(
        db,
        rows.filter((i) => cohort.has(i.batch)),
        "stage",
      ).map((g) => ({
        label: g.label + " / " + column,
        row: g.label,
        column,
        value: g.rate,
        sample: g.sample,
        defects: g.defects,
      })),
    ),
    "%",
  );
  return specs;
}

export function explorerModel(db, a, settings = {}) {
  const dimension = [
    "factory",
    "line",
    "sku",
    "stage",
    "machine",
    "fabric",
    "shift",
  ].includes(settings.dimension)
    ? settings.dimension
    : "factory";
  const batches = new Map(db.batches.map((b) => [b.id, b]));
  const minimum = Math.max(0, Number(settings.minimum) || 0);
  const eligible = a.focusRows.filter(
    (i) =>
      (!settings.factory ||
        settings.factory === "All" ||
        batches.get(i.batch)?.factory === settings.factory) &&
      (!settings.stage ||
        settings.stage === "All" ||
        i.stage === settings.stage) &&
      (!settings.from || (i.date && i.date >= settings.from)) &&
      (!settings.to || (i.date && i.date <= settings.to)),
  );
  const groups = groupRates(db, eligible, dimension).filter(
    (g) => g.sample >= minimum,
  );
  const group =
    settings.group && groups.some((g) => g.label === settings.group)
      ? settings.group
      : "";
  const ids = new Set(
    (group ? groups.filter((g) => g.label === group) : groups).flatMap(
      (g) => g.records,
    ),
  );
  const rows = eligible.filter((i) => ids.has(i.id)),
    sample = sum(rows, "sample"),
    defects = sum(rows, "defects");
  const dates = [...new Set(rows.map((i) => i.date).filter(Boolean))].sort();
  return {
    dimension,
    groups,
    group,
    rows,
    sample,
    defects,
    rate: sample ? (defects / sample) * 100 : null,
    batchCount: new Set(rows.map((i) => i.batch)).size,
    dates,
    excluded: eligible.length - rows.length,
  };
}
