# FactorySphere 2.0 — implementation and assurance record

Date: 16 October 2026. This document supersedes the older project report wherever the implementation described here differs. The original business specification remains the product direction.

## Product and delivery model

FactorySphere connects inspection evidence, customer complaints, production genealogy, containment, recovery, cost and corrective action in an operational browser workspace. The redesign uses navy, slate and teal, with red and amber reserved for exceptions. Desktop is the target surface.

The application runs entirely on the user's machine, either from a loopback Python static server or as static files delivered by GitHub Pages. Files are parsed in the browser. There is no API that receives production records. Localhost and GitHub Pages are separate browser origins with separate storage. A JSON workspace snapshot transfers the active data, decisions and evidence between them.

The interface is intended for professional decision support. It is not a claim of certified enterprise deployment: authenticated access, server-enforced segregation of duties, immutable audit retention, multi-user concurrency, ERP integrations and central backups require a server and organizational controls. Local reviewer names are acknowledgements, not digital signatures.

## What changed

- Replaced the application shell with a coherent navigation hierarchy, persistent data context, global import/report controls, and a compact executive decision overview.
- Added eleven workspaces: Overview, Traceability, Quality signals, Investigation, Customer feedback, Containment, Recovery planner, Cost intelligence, CAPA command, Effectiveness and Data workspace.
- Added sample-adjusted p-chart limits, Wilson intervals, exploratory group comparisons, severity-weighted process concentration, factory/style comparisons, descriptive recent change, first-seen categories and an evidence-linked signal register.
- Added a connected genealogy view, a dedicated complaint classification queue and containment commitment register.
- Added structured hypotheses, test plans, fishbone categories and editable Five Whys. Associations remain separate from reviewed root causes.
- Replaced displayed recovery estimates with seven capacity-based scenarios. They include approval, material lead time, production, inspection/sorting, rework, reinspection, packing/release, working calendars, alternate-line transfer and rejection/remake.
- Added inspection error/handling assumptions, expected missed detections, false holds, uninspected related units and units released before shipment cut-off.
- Added cost-category visuals, explicit COPQ vs total quality cost definitions, recurrence sensitivity, break-even probability, frequency-based payback and attributable order/defect/factory/supplier cost ledgers.
- Added RACI assignments, dependency cycle detection, dependency completion checks, named approval records, independent effectiveness review and stronger closure gates.
- Added comparable before/after cohorts, uncertainty intervals, 30/60/90-day verification horizons and data completeness profiling.
- Added local image/PDF evidence attachments, portable workspace snapshots and richer HTML, CSV and analytical JSON exports.
- Added a 54-batch, 58-inspection, four-factory synthetic demonstration alongside the original 20 known-answer cases.

## Requirements coverage

Each row identifies the actual behavior and its boundary. “Supported” means implemented in this browser application, not connected to a factory system.

| Original area | Implemented behavior | Boundary / evidence needed |
| --- | --- | --- |
| Product and style master | Product/SKU lookup, style comparisons, product-linked exposure | Numeric complexity adjustment is not estimated from unobserved information |
| Orders and customer destination | Order/customer/market links, order due dates, shipment destinations | Live order-system synchronization is an integration task |
| Production genealogy | Batch, factory, line, machine group, team/operator, shift, production dates, cutting, sewing, finishing and packing identifiers | Links are supplied/inferred associations; missing nodes are explicitly shown |
| Material genealogy | Fabric/thread/trim lots, material suppliers, fabric rolls and recorded dye-lot details | No supplier feed or automatic material certification |
| Operation/process evidence | Operation, machine, tension/speed/process records and production comparisons | Environmental variables are displayed when supplied; no unsupported environmental causal model |
| Complaint-led tracing | Batch/shipment links, description, classification, reviewer and evidence | Unlinked complaints require source traceability; the app does not guess a batch |
| Inspection stages | Incoming, in-line, end-line, finishing, final random, pre-shipment and warehouse records | Inspection history can contain repeat observations of the same garments |
| Inspection details | Defect, location, severity, quantities, inspector, operation, evidence, threshold and disposition | The schema counts defective units; multiple defects per garment need a distinct event-count schema |
| Inspection acceptance | Supplied Pass/Fail or explicitly supplied percentage threshold | AQL is not a direct percentage acceptance cutoff; an AQL field alone does not confirm a failure |
| Reinspection | Subsequent inspection records and an explicit recovery reinspection stage | Sampling plans need business-approved acceptance numbers and lot-size rules |
| Early warning | Sample-adjusted statistical exceptions, repeated machine-linked patterns, pending complaints, descriptive change and first-seen categories | Exploratory alerts are not calibrated probability estimates or autonomous escalation decisions |
| Volume and uncertainty | Pooled rates, subgroup-specific limits, sample denominators and 95% Wilson intervals | Independence, representative sampling and comparability remain assumptions |
| Severity weighting | Transparent Minor/unknown=1, Major/High=3, Critical=9 prioritization | Severity points are not a failure probability or calibrated financial risk score |
| Confirmed vs precautionary exposure | Explicit classes, reasons, inspection IDs, inventory and shipped units | Sharing a lot/machine never independently confirms defects |
| Separate incidents | Same defect outside product/factory context appears as a separate signal | Simultaneous multi-case portfolio management requires multiple workspaces/back-end case records |
| Root cause | Comparisons, exploratory difference intervals, hypothesis register, fishbone categories, Five Whys, reviewed conclusion | Statistical association does not prove cause; no machine-selected root cause |
| Historical learning | Lesson register and imported historical records retained in snapshots | Similarity retrieval across a central case repository is not implemented |
| Immediate containment | Record stop-production, WIP/stock hold, shipment block, inspection, lot separation, warehouse review, notification and reserved-capacity commitments | These are recorded commitments; no email or ERP shipment hold is executed |
| Containment economics | Units, inspector hours, completion, holding cost, delay, assumed false detections and handling exposure | Risk rates are editable planning assumptions, not measured classifier performance |
| Recovery alternatives | Inspect all, full rework, sample related, replace, split shipment, approved alternate line, reject/remake | Revising a shipment date is a commercial agreement outside the scheduler; update the source order/cutoff after agreement |
| Resource constraints | Inspector/station limits, line rate, skill/machine availability, material lead time, approval lead time, reinspection/packing and 5/6/7-day calendar | Sequential feasible scenario estimates, not an optimized dispatch system or live capacity reservation |
| Delivery outputs | Full completion, priority release, calendar delay, units before cut-off and working-day stage timeline | Priority-lot duration is a disclosed proportional approximation; no flight/vessel booking integration |
| Prevention/appraisal/internal/external costs | Four categories; explicit aggregates or attributable ledger totals; rework/claim fallback | Aggregate inputs override ledger totals to prevent double counting |
| Cost of quality vs COPQ | Total quality cost includes all four; strict COPQ is internal + external failures | Existing reports distinguish these labels explicitly |
| Cost per acceptable garment | Total quality cost divided by accepted units only when complete | Accepted units must be supplied; sample size is not production volume |
| Order/defect/factory/supplier economics | Attributable ledger comparisons | No invented allocation of unattributed aggregate costs |
| Expected loss and prevention ROI | Failure cost × recurrence; avoided loss × reduction; ROI net of prevention cost | One comparable future incident unless frequency is explicitly entered |
| Sensitivity and payback | Recurrence curve, break-even probability and payback months from entered annual incident frequency | No assumed annual recurrence; future loss remains uncertain |
| Corrective action alternatives | Cost, days, reduction, confidence, delivery, resources, worker/safety, sustainability and standardization | Estimates are entered by people; the app does not certify worker safety or environmental impact |
| CAPA registration and ownership | Incident leader, severity, action type, owner, due date and status | Role fields organize responsibility but do not authenticate users |
| RACI | One accountable person field per action, responsible owner, consulted/informed and verifier | Organizational enforcement requires authenticated identities |
| Dependencies | Existing-ID checks, cycle rejection and completion-before-dependent-completion rule | A local user with source/storage access can bypass client logic |
| Approvals and evidence | Approver, approval date/reference, independently named verifier, per-action evidence and closure gates | Local evidence/history is mutable and not a regulated e-signature system |
| Escalation | Overdue/blocked commitments surfaced with accountable owners | Automated messages are not sent |
| Effectiveness | Dated pre/post evidence, matched SKU/factory/line and overlapping stages, 95% intervals, adverse-effect field | Cohort matching is a complexity proxy; no causal experiment or statistical complexity regression |
| 30/60/90 checks | Separate due dates, check dates, evidence and maturity checks | A tick box without eligible dates/evidence cannot qualify |
| Standardize or reopen | Closed cases reopen on changed evidence/decisions; failed checks block closure | Work-standard execution remains an assigned factory action |
| Customer NLP support | Transparent keyword suggestions, editable category and reviewer/evidence | Rule-based suggestions, not a trained NLP model; human decisions control exposure |
| Knowledge retention | Lessons, failed-assumption notes, hypotheses, Five Whys, evidence, actions and audit entries preserved | Cross-organization learning requires a central repository |
| Evidence files | PNG/JPEG/WebP/PDF attachments linked to known records, 2 MB/file, 20 MB total | Stored in browser snapshots, not an immutable document vault; no malware-scanning service |
| Data interoperability | JSON (50 MB), CSV, TSV, XLSX/XLS (20 MB combined), multi-sheet/file joins, aliases and validation | Similar schemas are supported; arbitrary unstructured documents need transformation |
| Test data | 20 original scenarios plus multi-factory demonstration and independent CSV/XLSX examples | Synthetic results do not establish real-world alert precision or financial forecast accuracy |
| Validation | Known-answer exposure checks, independent math oracles, scenario consistency, browser workflow checks | Real-world shipment forecast error, recurrence impact and alert calibration need observed outcomes |

## KPI definitions and denominator discipline

1. Observed defective rate = sum of defective units / sum of inspected units × 100 for the selected defect. It is an inspection-observation rate. Different stages may inspect the same garment more than once, so summing samples does not count unique garments.
2. Defect category contribution = recorded defective-unit counts in a category / counts across categories. The Pareto is a prioritization view, not an estimate of unique defective garments.
3. First-pass yield uses supplied batch yield weighted by supplied production units. It is not derived as one minus a mixed-stage defect rate.
4. Confirmed stock exposure = inventory recorded on confirmed-scope batches. This is potentially exposed stock, not a claim that every unit is defective. Unknown stock stays unknown; partial quantities are disclosed.
5. Precautionary scope uses meaningful production/material links or unreviewed/screening signals. Separate product/factory signals remain separate.
6. Total cost of quality = prevention + appraisal + internal failure + external failure. A partial known sum is labeled with category coverage.
7. Strict COPQ = internal + external failure. Both are required to display a complete strict COPQ.
8. Total quality cost per acceptable garment requires complete cost categories and accepted units for every batch. No denominator is inferred from inspected samples.
9. Expected future loss = complete failure cost × recurrence probability / 100. Expected avoided loss = expected future loss × reduction / 100.
10. ROI = (expected avoided loss − prevention investment) / prevention investment × 100. Zero/unknown investment yields no ROI percentage.
11. Break-even recurrence probability = investment / (failure cost × reduction fraction) × 100. A value above 100% is explicitly outside the feasible probability range.
12. Expected avoided loss per year = expected avoided loss per comparable incident × entered annual incident count. Payback months = investment / annual avoided loss × 12. No positive annual avoided loss means payback is unavailable.
13. CAPA completion and evidence completion are different measures. A “Done” state without required evidence/date does not satisfy closure.
14. Recurrence-free time is an observed span through the last follow-up inspection, not a guarantee for unobserved calendar days.

## Statistical methods

The p-chart uses pooled p = Σ defective / Σ inspected and subgroup limits max(0, p − 3√(p(1−p)/n)) and min(1, p + 3√(p(1−p)/n)). Display values are percentages. The reference cohort uses the selected batch's SKU, factory and line, and the most represented inspection stage. The stage/cohort is visible. Fewer than 20 observations are labeled provisional. Low expected binomial counts are flagged. Limits are estimated from the displayed history; they do not replace process-owner approval of a stable baseline.

Wilson intervals use z=1.96. Group difference intervals use the independent-binomial normal approximation and are withheld from confident interpretation when either sample has fewer than five defective or nondefective observations. Selecting extreme groups and making multiple comparisons is exploratory; the UI states that there is no multiple-comparison correction or causal inference.

Before/after comparison matches SKU, factory, line and overlapping stages. Non-overlapping Wilson intervals strengthen the observed-reduction indication. Product matching is a proxy for product complexity. Inspection policy changes, time-varying confounders and repeated garments can still bias comparison. A reviewer must record comparison evidence and decide whether effectiveness is accepted.

Method reference: [NIST p-control chart reference](https://www.itl.nist.gov/div898/software/dataplot/refman1/ch2/pcontrol.pdf).

## Recovery calculation contract

Each option builds a sequential dependency chain. Inspection capacity = min(inspectors, stations) × inspection units/person-hour × hours/shift. Rework capacity = lines × units/line-day × skill availability × machine availability. Alternate-line repair uses its separately entered daily rate. Replacement uses its production rate and availability factors. Reinspection reserves inspectors/stations after rework. Packing uses its daily throughput. Material and approval lead times are explicit stages.

Current confirmed-scope sampled defect rate estimates targeted repair quantity. Related stock is not declared defective or automatically released. Full-inspection options inspect all related stock; sampled options expose their uninspected remainder. Full-batch repair/replacement may leave precautionary stock outside their scope, which is displayed.

Completion counts whole working-day offsets from the planning date using a 5-, 6- or 7-day calendar. Five-day calendars exclude Saturday/Sunday; six-day calendars exclude Sunday. This is an explicit planning convention, not a factory's verified holiday calendar. Delays and holding duration use calendar days. Material lead time is measured in working days. No shared resource is scheduled in simultaneous stages within one scenario.

Cost = inspection labor + rework + replacement + reinspection labor + delay + holding + split handling + transfer + scrap, as applicable. Delay cost is omitted when no cutoff is known and the UI says the cutoff is unknown. Split handling remains a disclosed $250 assumption. Inspection false negatives/positives and handling rates are sensitivity inputs. Expected counts are rounded upward for conservative planning and must not be presented as observed events.

The model does not solve a mixed-integer program, reserve actual factory resources, account for holiday exceptions, or guarantee a shipment. These are production-integration requirements, not hidden capabilities.

## State, imports, persistence and reload

- `analysis-core.js` normalizes supported source records and computes exposure, foundational cost metrics and effectiveness gates.
- `file-ingest.js` handles JSON, delimited text and bundled SheetJS workbooks. Input validation occurs before replacing active data. An unsuccessful import keeps the prior data and states that it is still shown.
- `intelligence.js` contains pure statistical, scheduling, profiling, comparison and governance helpers.
- `presentation.js` renders the redesigned shell, overview and analytical workspaces. Every displayed value is derived from the active normalized dataset.
- `workspace-actions.js` validates persistent investigation, RACI, containment, governance, cost and customer-review changes and produces the analytical appendix/JSON export.
- `local-app.js` coordinates event handling, import races, revisions, render state and exports. Navigation and analysis filters persist for the same loaded source in session storage.
- `local-store.js` stores the active workspace in IndexedDB with local-storage fallback. The old storage identity is intentionally retained to preserve existing user records after the FactorySphere rename.
- GitHub Pages deployment versions every local JS/CSS reference with the release commit to prevent mixed cached modules. The local server sends no-store headers.
- Saves immediately update the small-data local-storage copy and serialize IndexedDB writes. A visible save indicator and pending-write unload guard make unfinished persistence explicit.
- `workspace` holds planning, economic assumptions, hypotheses, Five Whys, containment, governance, attributable costs and evidence attachments. Normalization preserves this extension and validates its collection shapes and planning bounds.
- BroadcastChannel updates other tabs on the same origin. Last saved revision wins. This is not a multi-user conflict-resolution service.
- Evidence uploads check that the active dataset has not changed while the file is read. Attachments use escaped labels and restricted PNG/JPEG/WebP/PDF base64 data URLs.

## Reports

HTML reports are printable and include exposure, inspection evidence, cost categories, recovery choices, verification, CAPA and audit history. The intelligence appendix adds signals, planning assumptions, recurrence sensitivity, containment, hypotheses, Five Whys and RACI/governance checks. Screening results are labeled as screening.

CSV remains a flat section/ID/field/value export. New nested intelligence sections are JSON-encoded in a cell. Spreadsheet formula prefixes are escaped. Analytical JSON provides machine-readable calculations and assumptions. Workspace JSON preserves normalized records and edits, including local evidence attachments, for re-import. Exported artifacts reflect the selected defect/reference analysis. Aggregate costs and case-level actions remain explicitly dataset/incident-wide.

## Test strategy

Run:

```sh
node scripts/validate-data.mjs
node scripts/validate-scenarios.mjs
node scripts/validate-local.mjs
node scripts/validate-intelligence.mjs
```

The intelligence suite uses independent expected Wilson bounds, control limits, work-calendar completion and itemized costs. It checks input validation, malformed workspace collections, truthy-string flags, AQL handling, resource slowdown, seven recovery alternatives, nonoverlapping stage sequences, dependency cycle prevention, evidence completion, snapshot round trips and report escaping. It also renders analytical panels against all original scenarios and the extended demonstration to detect unavailable/NaN regressions.

Browser verification covers the desktop layout, actual imports, source-specific recalculation, navigation, editable forms, persisted reload state, export downloads and blocked closure. Synthetic regression does not establish universal correctness for all future source schemas. Operational validation requires permission-cleared factory data and comparison with actual recoveries, costs, release decisions and recurrence outcomes.

### Release verification results — 16 October 2026

All four validation scripts pass. Independent CSV upload produced 3 batches, 300 inspected units and 17 defective observations (5.7%); the Excel upload replaced this with 2 batches, 200 inspected units and 11 defective observations (5.5%). Exposure filters and imported data survived reload. The extended synthetic demonstration, all eleven workspaces, investigation edits, economic assumptions, evidence attachment persistence, blocked closure, analytical JSON and downloaded HTML were exercised in the browser. Downloaded reports retained the edited Five Whys and all seven recovery plans. A temporary deployment build verified versioned asset references and resolved module imports. Regression checks also cover ledger-only prevention payback, missing matched-cohort identifiers and required action accountability.

## Production deployment work that remains

For a centrally managed enterprise deployment, introduce authenticated identities, server-side roles, durable relational storage, immutable evidence and audit retention, concurrency/conflict handling, backups, signed approvals, organizational calendars, actual capacity reservations, ERP/WMS/TMS links, monitored services and tested recovery procedures. Obtain factory-approved sampling plans and cost dictionaries. Calibrate alerts and delivery forecasts against actual outcomes before using them as automated gates.

The static GitHub Pages delivery and foreground local server remain supported. No macOS LaunchAgent is installed or needed.
