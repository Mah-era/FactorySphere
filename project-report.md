# FactorySphere — Garment Quality Traceability, Recovery & Corrective Action Intelligence Platform

> **23 October 2026 — Version 3 update:** The current application has 13 responsive workspaces and 50 exportable visualizations. [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) documents the complete product redesign, linked Analysis studio, new chart calculations, responsive interactions and verification evidence. [TRANSFORMATION.md](TRANSFORMATION.md) retains the implementation and assurance record, formulas and requirements coverage matrix. These addenda supersede older descriptions in this report. Central authentication, immutable audit retention and live factory integrations remain production deployment work.

> **Release verification — 23 October 2026:** Commit `3caeef5` is deployed to GitHub Pages. The live site was tested with the supplemental product-mix file: dashboard values changed to 110 defective observations / 2,000 inspected observations, the source persisted after reload, and the decision report preserved the raw 8.2% vs 2.8% comparison plus the standardized 5% vs 6% reversal. All six automated suites passed; no browser console errors or warnings were observed.

## Comprehensive Project Report

**Project type:** Local-first apparel quality management and decision-support web application  
**Application name:** FactorySphere  
**Report updated:** 23 October 2026<br>
**Primary deployment mode:** Local browser application served at `http://127.0.0.1:8765/`  
**Data policy:** Uploaded files remain on the user's computer and are processed in the browser  
**Current build reference:** versioned `local-app.js` and `styles.css` references in `dist/index.html`

---

## 1. Executive summary

Garment Quality Intelligence is an end-to-end apparel quality management prototype that turns disconnected inspection failures, customer complaints, production records, material lots, shipments, cost data, and corrective actions into one traceable incident workflow. The project addresses a practical management problem: recording a defect percentage does not tell a production manager what is affected, what should be held, how much recovery capacity is required, whether the shipment will be late, what the failure will cost, or whether a corrective action actually prevented recurrence.

The completed application supports the lifecycle from detection to verified closure. A user can upload an independent JSON, CSV, TSV, XLSX, or XLS dataset; normalize the records; identify the dominant defect signal; trace a reference batch through product, factory, line, machine, team, shift, material, packing, inventory, and shipment relationships; distinguish confirmed exposure from precautionary containment; compare root-cause evidence; calculate quality and commercial impact; generate five capacity-aware recovery alternatives; manage CAPA evidence and ownership; and verify effectiveness using post-action inspection data and dated 30/60/90-day checks.

The application is deliberately local. It does not require a cloud host, private hosting platform, online account, package installation, database, or internet connection. The Excel parsing library is bundled with the application. Browser storage retains the active dataset across reloads, and local tabs synchronize changes. A version check reloads stale open tabs after a locally deployed application update. Both the server and browser logic include cache controls to address the stale-number problem discovered during development.

Twenty synthetic scenario files provide controlled test cases with planted relationships and known outcomes. Additional unseen CSV and Excel examples demonstrate that the application is not limited to the prepared cases. Automated validation covers the seed data, all 20 cases, file normalization, independent JSON, flat CSV, multiple related tables, date and number parsing, complaint review transitions, shipment derivation, recovery behavior, and effectiveness decisions. Manual browser verification covered uploads, navigation, calculations, cross-tab updates, report downloads, and the absence of console errors in the tested flows.

This is a decision-support prototype, not a certified production quality system. It uses transparent business rules and capacity assumptions rather than machine learning that independently declares root cause. It is suitable for portfolio demonstration, controlled pilots, analytical exploration, and requirements validation. A production rollout would require server-side persistence, identity and role management, durable evidence storage, integration with ERP and inspection systems, formal audit controls, stronger optimization, and enterprise validation.

---

## 2. Project positioning

The project demonstrates that garment quality is connected to cost, delivery, customer experience, supplier and factory performance, workforce execution, and management decision-making. Its positioning is broader than an inspection dashboard. It is a local quality operating system that connects five management questions:

1. **What happened?** Inspection and complaint evidence identify the defect signal.
2. **What may be affected?** Genealogy and contextual links identify confirmed and precautionary exposure.
3. **What should be done now?** Containment and recovery alternatives translate risk into action.
4. **What will it cost and how will delivery change?** COPQ and capacity models quantify consequences.
5. **Did the organization learn and prevent recurrence?** CAPA and effectiveness gates control closure.

The platform's central design principle is that analytical output must be connected to a decision. A defect rate is therefore presented with the supporting inspection records, affected production, confidence level, capacity consequence, cost coverage, corrective-action status, and evidence limitations.

---

## 3. Business problem

In many apparel operations, quality data is fragmented across inspection sheets, spreadsheets, factory reports, complaint messages, shipment records, and corrective-action trackers. This fragmentation causes several recurring management failures:

- A failed batch is treated as an isolated event even when the same machine, line, material lot, packing lot, or supplier was used elsewhere.
- Every related batch is held without separating verified failures from precautionary links, creating unnecessary inspection and delivery cost.
- Root cause is recorded as an opinion without cited evidence, a reviewer, or comparison against control batches.
- Recovery plans ignore inspector availability, inspection stations, rework capacity, replacement lead time, and shipment cut-offs.
- Appraisal and prevention costs are evaluated separately from internal and external failure costs.
- CAPA tasks are marked complete even when evidence, approval, or effectiveness verification is missing.
- A reduced defect rate is assumed to prove success without checking sample volume, elapsed time, recurrence, side effects, or comparable follow-up evidence.
- Lessons are lost when the incident is closed.

The application addresses these failures through one data model and one governed workflow.

---

## 4. Project objectives

The implemented project has the following objectives:

- Accept synthetic test cases and independently prepared files with similar business data.
- Recalculate all relevant dashboard outputs from the active uploaded file.
- Remove dependence on stale demo values after upload or reload.
- Trace garment batches to production and material context.
- Separate confirmed exposure, precautionary containment, separate signals, unrelated batches, and an unconfirmed reference batch.
- Connect quality decisions to inventory, shipped units, customer complaints, order due dates, and shipment cut-offs.
- provide evidence-oriented investigation views without allowing the software to autonomously declare root cause.
- Generate feasible high-level recovery scenarios from available inspection and rework capacity.
- Calculate COPQ and prevention economics only from supplied or explicitly derived data.
- Block incident closure until containment, evidence, approval, action, and effectiveness gates pass.
- Persist the active local dataset and synchronize it across local browser tabs.
- Export an HTML decision report and a structured CSV report from the active analysis.
- Validate behavior through controlled, difficult, and independent scenarios.
- Run entirely on the user's machine without external hosting.

---

## 5. Stakeholders and user roles

The product is designed around cross-functional incident management.

| User or stakeholder | Primary need in the platform |
|---|---|
| Production manager | Understand exposure, capacity impact, priorities, and recovery dates |
| Factory quality manager | Review inspection evidence, containment, investigation, and CAPA status |
| Quality inspector | Record inspection quantity, defects, stage, threshold, disposition, and evidence reference |
| Sewing or finishing supervisor | Compare line, machine, team, shift, and operation patterns |
| Material supplier | Respond to material-lot or trim-lot evidence and supplier corrective actions |
| Merchandising team | Understand order impact, commercial exposure, and revised shipment timing |
| Customer-quality team | Connect complaint patterns and returns to production evidence |
| Sourcing team | Compare the apparent purchase cost with total quality loss and supplier performance |
| Logistics coordinator | Review held, released, shipped, and replacement quantities against cut-offs |
| Factory management | Approve actions, allocate resources, review COPQ, and control closure |
| CAPA owner | Complete assigned action, provide evidence, and record implementation date |
| Verification owner | Conduct 30/60/90-day checks and assess recurrence and side effects |

The prototype records owners, reviewers, leaders, and local audit actors. It does not authenticate those identities; production use requires role-based access and electronic approval controls.

---

## 6. Demonstration narrative

The baseline demonstration begins with a finished-garment batch that fails because of an open seam. A related customer complaint reports a similar symptom. The user opens the platform and follows this sequence:

1. Load the built-in seam case or upload a source file.
2. Review the dominant defect, reference batch, inspected units, defect rate, confirmed stock, shipped exposure, known quality cost, and current recovery option.
3. Inspect the genealogy of the reference batch: product, order, factory, line, machine group, operator or team, shift, cutting, sewing, finishing, packing, fabric, thread, trim, dates, inspections, complaints, and shipments.
4. Review why each batch is Confirmed, Precautionary, Separate signal, Reference, or Unrelated.
5. Filter the view by defect, factory, exposure scope, inspection stage, or selected batch.
6. Compare defect rates and records by machine, material, line, thread, shift, and team.
7. Record the proposed cause, supporting evidence, reviewer, and confirmation status.
8. Record containment by placing stock on hold and/or blocking shipment.
9. Adjust available inspectors, stations, inspection rate, rework lines, and rework rate.
10. Compare inspection, full-batch rework, sampling, replacement, and split-shipment alternatives.
11. Enter cost categories and recurrence assumptions to evaluate COPQ and prevention return.
12. Create CAPA actions with owners, dates, statuses, evidence, and completion dates.
13. Record management approval.
14. Add follow-up inspection evidence after corrective implementation.
15. Complete separate dated and evidenced 30, 60, and 90-day checks.
16. Close the case only if all gates pass.
17. Download the current outcome as HTML or CSV.

This sequence shows the connection from a quality observation to an operational, financial, and governance outcome.

---

## 7. Functional scope delivered

### 7.1 Overview dashboard

The Overview page is the management entry point. It is recalculated from the current normalized dataset and selected analytical focus. It includes:

- Active source file and load status.
- Scenario title and description where provided.
- Defect focus and reference batch.
- Inspected volume and defect volume.
- Defect rate.
- Confirmed stock and confirmed shipped exposure.
- Known COPQ and data-coverage indicator.
- Recovery completion and delay estimate.
- Current effectiveness decision.
- Alert explanation, supporting records, confidence, affected production, and recommended verification step.
- Filters and navigation into deeper workflows.
- Upload controls, built-in case selector, and report-download actions.

The page does not silently substitute seed numbers for missing uploaded values. Missing figures display as unavailable, and warnings explain partial coverage.

### 7.2 End-to-end product genealogy

The Traceability page connects a selected batch to the available production and commercial context. The normalized batch structure supports:

- Batch ID.
- Order or purchase order.
- Product SKU or style.
- Factory.
- Sewing line.
- Machine or machine group.
- Operator or team.
- Shift.
- Cutting batch.
- Sewing batch.
- Finishing batch.
- Packing lot.
- Fabric lot.
- Thread lot.
- Trim lot.
- Production start and end dates.
- Total units, accepted units, inventory, and shipped units.
- Inventory location and batch status.
- First-pass yield and supplied defect rate.
- Related inspection, complaint, shipment, material, and process records.

The application supports backward reasoning from a complaint or inspection signal to production context and forward reasoning from a production link to potentially related stock.

### 7.3 Inspection and quality-data management

The data model supports incoming, in-line, end-line, finishing, final random, pre-shipment, warehouse, and other supplied inspection stages. Each inspection can carry:

- Inspection ID.
- Batch.
- Stage and date.
- Inspection quantity.
- Defective quantity.
- Defect type and location.
- Severity.
- Acceptance threshold.
- Inspector.
- Production operation.
- Disposition.
- Evidence reference.
- Notes.

The interface allows a local user to add an inspection. It checks that defects do not exceed inspected units, calculates Fail or Pass from the entered threshold, appends an audit event, invalidates synthetic known-answer validation after evidence changes, saves the dataset, and recalculates the interface.

### 7.4 Quality signal and early-warning logic

The current warning engine aggregates inspection records by defect type. Each group contains sample volume, defect count, supporting records, affected batches, failed inspections, and the volume-adjusted rate. Defects are prioritized using failed inspections and defect volume, ensuring that a failed record receives more weight than a small isolated count.

The selected signal reports:

- What changed: the active defect type and observed failure pattern.
- Where it changed: affected batches and their production attributes.
- Supporting records: failed inspection IDs and complaint evidence.
- Potentially affected production: confirmed and precautionary scope.
- Confidence: Low, Limited, or Moderate based on sample and confirmation coverage.
- Recommended next action: verification and containment guidance in context.

The prototype includes defect trends, rates, comparative group analysis, and repeat-signal handling. It does not yet implement a complete statistical process control library, automated natural-language classification model, or novelty-detection model.

### 7.5 Traceability and exposure engine

The exposure engine uses the selected defect and reference batch to classify every batch:

| Classification | Meaning |
|---|---|
| Confirmed | A failed matching inspection or a human-reviewed matching complaint exists in the relevant product/factory context |
| Precautionary | A meaningful production or material relationship exists, but defect evidence is not confirmed |
| Separate signal | The same defect appears in a different product or factory context and requires a separate investigation |
| Reference | The selected reference has no confirmed failure |
| Unrelated | No matching signal or meaningful link was identified |

Context rules are defect-category aware:

- Packing defects use the shared packing lot.
- Shade, dye, fabric, and color defects use the shared fabric lot.
- Trim, label, zip, and button defects use shared trim or thread lots.
- Sewing-related defects use machine, line, fabric, or thread links.

An unreviewed complaint creates precautionary exposure when it matches the reference context. A complaint marked Human reviewed, Reviewed, Approved, or Confirmed can support confirmed exposure. A rejected or dismissed classification is excluded. This prevents unreviewed text from automatically declaring a batch defective.

If an inspection has neither a reviewed disposition nor an acceptance threshold, the application applies a disclosed 2.5% screening rate. An elevated record is precautionary and cannot by itself confirm failure. The user can review Pass/Fail in the Quality signals page with an evidence reference or upload an approved threshold or result before it supports confirmed exposure. Missing inspection dates are kept missing and excluded from trend and effectiveness time comparisons. When batches are inferred from inspection rows, inspection sample size is not substituted for unknown production volume.

The engine calculates confirmed stock and shipped units only when quantities are available. It reports partial exposure when inventory or shipment fields are absent. Shipment records with Shipped, Delivered, or In transit status can supply shipped quantity when the batch table omits it. The active due date is taken from open shipments or orders connected to confirmed and precautionary scope, rather than from an unrelated order.

### 7.6 Root-cause investigation workspace

The Investigation page supports structured evidence review through:

- Defect comparison by machine.
- Material-lot comparison.
- Line comparison.
- Thread-lot comparison.
- Shift comparison.
- Team or operator comparison.
- Inspection record references for each comparison group.
- Cause statement.
- Cause confirmation flag.
- Cause evidence reference.
- Responsible reviewer.

The design supports the reasoning used in Pareto, 5 Whys, fishbone, process comparison, and hypothesis testing. The software presents associations and evidence; a human reviewer must confirm the cause. This safeguards against treating correlation as causation.

### 7.7 Complaint integration

Complaint records support complaint ID, batch, SKU, customer, date, description, category, severity, review decision, and claim or return cost. Complaints are included in the defect signal only when active and are handled according to review status.

The interface allows a reviewer to change a complaint decision. This action updates exposure, writes an audit event, persists the new state, and clears any synthetic ground-truth score that is no longer valid after evidence modification. Human review remains central; complaint text is not permitted to independently trigger final root-cause or closure decisions.

### 7.8 Containment management

The incident state includes stock hold and shipment-block controls. At least one containment state is required for closure. These controls represent immediate action before root cause is fully known.

The wider model supports response concepts including stopping production, holding work in progress, quarantining stock, blocking shipment, increasing inspection, conducting full inspection, selectively inspecting related batches, separating material lots, reserving rework capacity, and notifying teams. The current interface operationalizes stock hold, shipment block, inspection scope, and recovery capacity. Production-stop commands, notifications, and physical warehouse execution are outside the prototype.

### 7.9 Quality Recovery and Delivery Scheduler

The Recovery Planner transforms exposure into five comparable alternatives:

1. **Inspect all related stock + targeted rework.** Inspect all confirmed and precautionary stock, then rework the estimated defective portion of confirmed stock.
2. **Full-batch rework.** Inspect and rework the complete confirmed stock quantity.
3. **Sample related stock + targeted rework.** Inspect all confirmed stock plus 10% of precautionary stock, then rework the estimated defective quantity.
4. **Replacement production.** Inspect 10% of confirmed stock and produce replacement units for confirmed stock.
5. **Split shipment — priority units first.** Use targeted inspection and rework while showing both an earlier priority release and full completion.

The adjustable inputs are:

- Number of inspectors.
- Number of inspection stations.
- Units inspected per inspector-hour.
- Number of rework lines.
- Rework units per line-day.

One inspector is assigned per station through the effective inspector count `min(inspectors, stations)`. The calculations assume eight-hour shifts. The planner does not generate a recovery plan if confirmed inventory is unknown or zero, if any confirmed or precautionary batch lacks stock quantity, or if no matching inspection sample supports the rework rate. This prevents a visually plausible plan from being produced on incomplete quantities.

The selected sequence displays inspection, rework, replacement production, and release/packing/shipment stages. It compares completion date, first release where applicable, expected delay, inspection hours, rework volume, replacement volume, and incremental scenario cost. The dates use the Asia/Dhaka local business date.

### 7.10 Cost of Poor Quality intelligence

The platform uses the four standard quality-cost categories:

| Category | Included examples |
|---|---|
| Prevention | Training, maintenance, supplier development, process improvement, error proofing, tools and fixtures |
| Appraisal | Incoming, in-line, final, laboratory, third-party, and repeat inspection |
| Internal failure | Rework, scrap, sorting, downtime, replacement before shipment, supervision and disruption |
| External failure | Returns, claims, replacement after shipment, recall activity, expedited delivery, margin loss and dissatisfaction exposure |

If an explicit internal-failure value is missing, the application can derive it from rework cost records. If an explicit external-failure value is missing, it can derive it from complaint costs. Unknown cost categories remain unknown; they are not converted to zero. The cost coverage count shows how many of the four categories are known.

The Cost page includes:

- Total known COPQ.
- COPQ per acceptable garment when accepted units are explicitly supplied.
- Cost by category.
- Expected failure loss.
- Expected avoided loss.
- Prevention investment.
- ROI.
- Payback indication.
- Sensitivity to recurrence probability and expected reduction assumptions.

This allows management to see when an apparently inexpensive factory or supplier creates a higher total cost after quality losses.

### 7.11 CAPA command center

The CAPA workflow represents incident registration, containment, investigation, corrective action, approval, implementation, verification, standardization or reopening, and closure. The application maintains:

- Incident ID, title, severity, leader, stage, and opened date.
- Hold and shipment-block status.
- Cause, evidence, reviewer, and confirmation.
- Management approval.
- Action ID, title, type, role, owner, due date, status, evidence, implementation date, and required flag.
- Verification records and outcome.
- Closed or reopened state.
- Audit events.

Users can add actions, update their status and evidence, and record a completion date. A required action passes only when its status is Done and it has an evidence reference. A corrective action counts as implemented only when it is Done, has evidence, has a completion date, and that date is not in the future.

The interface requires an explicit completion date when a user marks an action Done. A material change after closure automatically reopens the case and records the reopening in the local audit history.

### 7.12 Closure governance

Final closure is blocked unless all six gates pass:

1. Containment is recorded through a hold or shipment block.
2. Root cause is confirmed with a cause statement, evidence, and reviewer.
3. Management approval is recorded.
4. At least one required action exists and every required action is Done with evidence.
5. The 30, 60, and 90-day checks are individually dated, eligible, and evidenced.
6. Follow-up inspection evidence supports the decision Effective and ready to standardize.

If any gate is missing, the Close case action reports the specific missing requirements. A closed case can be reopened. This workflow prevents administrative completion from being confused with demonstrated effectiveness.

### 7.13 Effectiveness verification

The effectiveness engine finds the most recent eligible corrective implementation date. It divides inspections for the active defect into:

- Baseline: inspections on or before implementation.
- Post-action: inspections after implementation.

It compares volume-adjusted baseline and post-action defect rates. At least 30 post-action inspected units are required for an evidence-based outcome. Each 30/60/90-day check requires:

- Its own selected checkbox.
- A check date.
- An evidence reference.
- An elapsed interval of at least 30, 60, or 90 days from implementation.
- A check date on or after the applicable due date.
- A check date no later than the current local date.

Possible decisions are:

- Not yet implemented.
- Insufficient evidence.
- Ineffective — reopen investigation.
- Partially effective — continue verification.
- Effective and ready to standardize.
- New negative effect detected.

A supplied post-rate assumption is displayed separately and is not treated as observed inspection evidence. A recorded side effect overrides an otherwise positive rate reduction and produces New negative effect detected.

### 7.14 Learning and adaptability

The learning view retains the investigation, chosen actions, observed results, verification records, negative effects, and later inspection behavior. The normalized model also supports intervention and lesson arrays for initial hypothesis, actual result, failed assumption, revised standards, and future training needs.

Synthetic ground truth is useful only while the original case remains unchanged. Adding an inspection or changing a complaint review clears ground truth and adds a warning. This avoids reporting an invalid precision or recall score after the test evidence has been modified.

### 7.15 Report download

The active analysis can be downloaded in two formats:

- **HTML report:** a printable management report containing outcome summary, exposure rationale, inspection evidence, CAPA actions, cost categories, recovery alternatives, verification checks, audit trail, and data limitations.
- **CSV report:** a structured long-format export containing summary fields, exposure records, inspections, cost categories, CAPA actions, recovery alternatives, verification checks, and audit events.

Reports are generated from the active file, active focus, reference batch, current recovery assumptions, and current CAPA state. They do not retain stale seed batches after an unrelated file is uploaded.

---

## 8. Application information architecture

The interface contains eight functional pages:

| Page | Purpose | Main decisions supported |
|---|---|---|
| Overview | Management summary and data loading | Is there a significant incident, what is exposed, and where should the user go next? |
| Traceability | Genealogy and batch scope | Which batches, inputs, locations, and shipments are connected? |
| Quality signals | Defect and inspection analysis | Which defects dominate, where are failures, and how strong is the signal? |
| Investigation | Comparative evidence and cause review | Which machine, material, line, thread, shift, or team best explains the pattern? |
| Recovery planner | Capacity and delivery alternatives | What can be inspected, reworked, replaced, or released before the cut-off? |
| Cost intelligence | COPQ and prevention economics | What is known, what is missing, and is prevention commercially justified? |
| CAPA command | Ownership, evidence, approvals, closure | Who must do what, what is overdue, and can the incident close? |
| Learning & verification | Pre/post comparison and 30/60/90 checks | Did the corrective action work and remain stable? |

The desktop interface uses a persistent side navigation, page headers, management KPI cards, filters, tables, forms, statuses, and scenario comparison cards. The user specifically excluded mobile completion from the final requirement; desktop local operation is the verified target.

---

## 9. Data architecture

### 9.1 Logical entities

The normalized in-browser model contains the following major entities:

| Entity | Grain | Principal fields |
|---|---|---|
| Product | One record per SKU/style | SKU, name, style |
| Order | One record per order | ID, customer, SKU, units, due date, market |
| Batch | One record per production batch | Order, SKU, factory, line, machine, team, shift, production steps, lots, dates, quantities |
| Material | One record per material or trim lot | ID, type, detail, supplier |
| Fabric roll | One record per roll/batch relation | Roll, lot, batch and supplied properties |
| Process condition | One record per process observation | Supplied process context |
| Inspection | One record per inspection | Batch, stage, date, sample, defects, type, threshold, disposition, evidence |
| Complaint | One record per complaint | Batch/SKU, customer, date, text, category, severity, decision, cost |
| Shipment | One record per shipment event | Batch, units, date, status, destination, cut-off |
| Rework | One record per rework event | Batch, operation, units, hours, cost, status |
| Incident | One active case state | Severity, leader, containment, cause, approval, verification, closure |
| CAPA action | One record per action | Type, owner, role, due, status, evidence, completion date, required flag |
| Intervention | One record per considered intervention | Uploaded option data |
| Lesson | One record per learning item | Uploaded learning data |
| Audit event | One record per local change | Event, timestamp, actor |
| Cost input | One active cost assumption set | Prevention, appraisal, internal, external, recurrence, reduction |
| Recovery input | One active capacity assumption set | Inspectors, stations, inspection rate, lines, rework rate |

### 9.2 Core relationships

The practical relationship path is:

`Complaint or inspection → batch → SKU/order → factory/line/machine/team/shift → cutting/sewing/finishing/packing → fabric/thread/trim lots → inventory/shipment → CAPA/rework/cost/verification`

The application uses identifiers and production attributes directly in the browser rather than a relational or graph database. This is appropriate for a portable prototype and modest file sizes. A production design should persist the same relationships in PostgreSQL with a graph projection or a graph database where multi-hop genealogy performance is critical.

### 9.3 Data lineage and source transparency

Every normalized dataset retains:

- Source name.
- Loaded timestamp.
- Updated timestamp.
- Normalization warnings.
- Scenario metadata where present.
- Audit history.

The interface displays source and warning context so users can distinguish calculated output from incomplete or inferred data. Batches inferred from inspection rows receive a warning. Missing inventory, shipments, and costs also create warnings.

---

## 10. Supported file formats and ingestion

### 10.1 Supported formats

The application accepts:

- JSON.
- CSV.
- TSV.
- XLSX.
- XLS.

The combined upload limit is 20 MB. The Excel parser is included locally in `dist/vendor/xlsx.full.min.js`, with its license stored alongside it.

### 10.2 Upload patterns

Three source patterns are supported:

1. **Single JSON dataset.** Contains inspections and optional batches, shipments, complaints, actions, orders, materials, costs, capacity, incident state, and supporting arrays.
2. **Single flat inspection table.** Contains at least batch, sample, defects, and defect type. Batch attributes on each row are used to infer production batches.
3. **Multiple related files or workbook sheets.** Files or sheets named for entities such as Inspections, Batches, Shipments, Complaints, and Actions are combined into one dataset.

### 10.3 Alias handling

The normalizer removes case and punctuation differences from headers and supports common alternatives. Examples include:

- `batch`, `batch_id`, `batchid`, `lot`, `production_batch`.
- `sample`, `inspected`, `inspection_quantity`, `sample_size`, `sampled_units`.
- `defects`, `defective`, `defective_quantity`, `defect_qty`, `defect_count`.
- `type`, `defect_type`, `defect`, `defect_category`.
- `sku`, `product_sku`, `style`, `style_id`.
- `factory`, `factory_id`, `plant`.
- `machine`, `machine_group`, `machine_id`.
- `inventory`, `stock`, `stock_units`, `on_hand`, `available_units`.
- `accepted`, `acceptable_units`, `accepted_units`, `released_units`.

This makes the application tolerant of typical spreadsheet naming differences without binding analysis to the 20 scenario schemas.

### 10.4 Type and value handling

- Currency signs, percent symbols, spaces, and thousands separators are removed before numeric conversion.
- First-pass yield values at or below 1 are interpreted as decimals and converted to percentages.
- Boolean-like fields accept true, yes, 1, and required.
- A literal `required: false` remains false.
- Dates accept ISO `YYYY-MM-DD` and day-first slash or dash formats.
- Ambiguous dates are interpreted day first.
- The application uses Asia/Dhaka for the current operational date.

### 10.5 Validation rules

The importer rejects:

- A file without inspection records.
- An inspection without a batch ID.
- Missing or nonpositive sample quantity.
- Negative defects or defects greater than the inspected sample.
- Acceptance thresholds outside 0–100%.
- Invalid inspection, shipment, order, action, or implementation dates.
- Duplicate batch IDs.
- Negative production, accepted, inventory, shipped, or shipment quantities.
- Accepted units greater than production units.
- First-pass yield outside 0–100%.
- Recovery capacities at or below zero.
- Fractional inspectors, stations, or rework lines.
- Negative costs.
- Recurrence or reduction assumptions outside 0–100%.

The importer warns, rather than rejects, when inventory plus shipped units does not equal total production, because incomplete or timing-dependent operational data may legitimately produce a temporary mismatch.

---

## 11. Calculation and decision logic

### 11.1 Defect rate

For any group of inspection records:

`Defect rate (%) = total defective quantity / total inspected quantity × 100`

Rates are volume adjusted because samples are summed before division. The application does not average individual inspection percentages.

### 11.2 Defects per hundred units

The displayed defect rate is equivalent to defects per hundred inspected units when defective quantity is counted at garment level:

`DHU = total defects / total inspected units × 100`

If an organization records multiple defects per garment, the meaning differs from defective-garment rate and should be explicitly identified in source data. The current generic field is `defects` or `defective_quantity`.

### 11.3 First-pass yield

First-pass yield is accepted as a supplied batch attribute. Decimal values such as `0.90` are normalized to `90%`. The current application does not derive FPY from a full pass/rework event history when the field is absent.

### 11.4 Focus selection

The active defect is selected in this order:

1. A user-selected valid defect.
2. The incident's supplied defect type when present.
3. The highest-priority aggregated defect.
4. Unclassified when no category exists.

The defect ranking score increases with defect count and gives additional weight to failed inspection records.

### 11.5 Reference-batch selection

The active reference batch is selected in this order:

1. A user-selected batch.
2. The incident's supplied reference batch.
3. The batch with the highest matching signal score.

The matching score combines defect count, a penalty based on sample size for failed inspections, and a stronger weight for a human-reviewed complaint.

### 11.6 Exposure totals

`Confirmed stock = sum of inventory for confirmed batches with known inventory`

`Confirmed shipped = sum of shipped quantity for confirmed batches with known shipped values`

When one or more confirmed batches lack a quantity, the application labels the result partial. It does not assume missing quantity is zero.

### 11.7 Confidence

The current transparent confidence bands are:

- **Moderate:** at least 400 inspected units and at least two confirmed batches.
- **Limited:** at least 100 inspected units.
- **Low:** fewer than 100 inspected units.

These bands communicate evidence quantity, not a statistical probability of causation.

### 11.8 Known COPQ

`Known COPQ = sum of available prevention + appraisal + internal failure + external failure values`

Coverage is reported as 0–4 known categories. Because unknown values are retained as null, Known COPQ should not be interpreted as complete COPQ unless coverage is 4/4.

### 11.9 COPQ per acceptable garment

`COPQ per acceptable garment = known COPQ / explicitly supplied accepted units`

The application does not divide by total production as a substitute for accepted units. This avoids understating the cost per saleable garment.

### 11.10 Prevention economics

The prevention model uses:

`Failure cost = internal failure cost + external failure cost`

`Expected loss = failure cost × recurrence probability`

`Expected avoided loss = expected loss × expected defect-reduction percentage`

`ROI (%) = (expected avoided loss − prevention cost) / prevention cost × 100`

`Payback period = prevention cost / expected avoided loss`, expressed in the same recurrence-cycle units as the input assumptions.

The output is sensitive to the supplied recurrence and reduction assumptions. It is a decision model, not a guaranteed financial forecast.

### 11.11 Recovery capacity

`Effective concurrent inspectors = min(number of inspectors, number of stations)`

`Daily inspection capacity = effective concurrent inspectors × inspection rate per hour × 8 hours`

`Daily rework capacity = rework lines × rework units per line-day`

`Estimated defect proportion = focus defects / focus inspected units`

`Expected rework units = ceiling(confirmed stock × estimated defect proportion)`

`Inspection hours = units to inspect / inspection rate per inspector-hour`

`Inspection days = units to inspect / daily inspection capacity`

`Rework days = rework units / daily rework capacity`

`Replacement production days = replacement units / 1,100 units per day`

`Full completion duration = inspection days + rework days + replacement production days + 1 release/packing/shipment day`

The duration is rounded upward to one decimal day for display and then converted to a calendar completion date.

### 11.12 Recovery scenario cost

`Estimated incremental cost = inspection hours × $15 + rework units × $2.60 + replacement units × $6 + delay days × $900 + split-shipment handling`

Split-shipment handling is `$250`. These are transparent prototype assumptions embedded in the calculation and stated in the interface. They should be replaced by organization-specific rates in a production implementation.

### 11.13 Shipment delay

`Delay days = max(0, estimated full completion date − applicable shipment/order cut-off)`

If no applicable cut-off is supplied, delay remains unknown. The split-shipment scenario additionally estimates a first release using half of inspection and rework duration plus half a day.

### 11.14 Effectiveness rates

`Baseline rate = baseline defects / baseline inspected units × 100`

`Post-action rate = post-action defects / post-action inspected units × 100`

The action is effective only when post-action evidence exists, the post sample is at least 30 units, post rate is below baseline, all 30/60/90 checks are valid, and no negative effect is recorded.

### 11.15 Known-answer traceability validation

For unchanged synthetic cases with ground truth:

`Precision = true confirmed batches / all batches predicted confirmed`

`Recall = true confirmed batches / all batches expected confirmed`

`Missed units = units in expected confirmed batches that were not predicted confirmed`

`False-hold units = inventory in predicted confirmed batches that were not expected confirmed`

These metrics are hidden after evidence changes invalidate the original known answer.

---

## 12. KPI framework

### 12.1 Quality KPIs

| KPI | Definition or current treatment | Management use |
|---|---|---|
| Defects per hundred units | Defects ÷ inspected units × 100 | Compare quality severity across different inspection volumes |
| First-pass yield | Supplied pass percentage before rework | Monitor process capability and rework dependence |
| Rework rate | Rework units ÷ relevant produced or inspected units; record support exists | Assess internal failure burden |
| Batch rejection rate | Failed/rejected batches ÷ inspected batches; derivable extension | Track systemic factory performance |
| Complaint rate | Complaints ÷ delivered units; requires delivered-volume basis | Connect customer experience to production |
| Repeat-defect rate | Repeated matching defect events ÷ relevant events; analytical concept supported | Measure recurrence |
| Corrective-action effectiveness | Baseline versus post-action defect rate with verification gates | Decide standardization or reopening |
| Recurrence-free period | Days from evidenced implementation through latest failure-free follow-up | Monitor sustained control |

### 12.2 Cost KPIs

| KPI | Definition or current treatment |
|---|---|
| Total known COPQ | Sum of known prevention, appraisal, internal, and external categories |
| COPQ per acceptable garment | Known COPQ ÷ explicit accepted units |
| Rework cost | Explicit internal failure or sum of rework record costs |
| Scrap cost | Can be included in internal failure input; separate field is a production extension |
| Additional inspection cost | Inspection hours × local rate within recovery scenarios |
| External failure cost | Explicit value or sum of complaint/claim costs |
| Expected avoided loss | Failure cost × recurrence × expected reduction |
| Preventive-action ROI | Net avoided loss ÷ prevention cost |

### 12.3 Delivery KPIs

| KPI | Definition or current treatment |
|---|---|
| Quality-hold duration | Incident or hold dates are available; complete duration history is a production extension |
| Rework completion time | Rework units ÷ daily rework capacity |
| Shipment-delay exposure | Days from modeled full completion past cut-off |
| Revised shipment adherence | Requires actual revised shipment completion history |
| Recovery lead time | Modeled inspection + rework + replacement + release time |
| Units released before cut-off | Split-shipment first release is estimated; exact released quantity scheduling is an extension |

### 12.4 Leadership and execution KPIs

| KPI | Definition or current treatment |
|---|---|
| Containment response time | Requires detection and containment timestamps; state is currently captured |
| CAPA completion rate | Done required actions ÷ required actions |
| Overdue actions | Open actions with due date before current date |
| Escalation-response time | Requires escalation event history in production implementation |
| Factory commitment completion | Can be represented through owned required actions |
| Time to root-cause confirmation | Requires timestamps for incident open and cause confirmation |
| Evidence-complete closure rate | Cases passing all evidence gates ÷ attempted closures |
| 30/60/90 verification completion | Valid checks completed ÷ three required checks |

The prototype fully displays the operational metrics required for its single active incident. Portfolio-wide aggregation across many historical incidents is a future enterprise layer.

---

## 13. Technology architecture

### 13.1 Implemented stack

- Semantic HTML generated by browser JavaScript.
- CSS for the desktop management interface.
- Native JavaScript ES modules.
- Browser File APIs for upload and download.
- Bundled SheetJS browser build for XLS/XLSX ingestion.
- IndexedDB for durable local dataset persistence.
- `localStorage` as a secondary persistence and storage-event fallback.
- `BroadcastChannel` for immediate cross-tab synchronization.
- Python `ThreadingHTTPServer` for local static serving.
- Explicit foreground local serving with no background service registration.
- Node.js scripts for data generation and automated validation.

No React, FastAPI, PostgreSQL, graph database, cloud service, or external API is needed by the current build.

### 13.2 Module responsibilities

| File | Responsibility |
|---|---|
| `dist/index.html` | Application shell, versioned CSS and JavaScript references, bundled Excel reader |
| `dist/styles.css` | Desktop interface, navigation, cards, forms, tables, statuses, and responsive rules |
| `dist/local-app.js` | Application state, rendering, interactions, CAPA workflow, exports, synchronization |
| `dist/analysis-core.js` | Normalization, validation, traceability, exposure, cost, recovery, and effectiveness logic |
| `dist/file-ingest.js` | JSON/CSV/TSV/Excel reading, entity-sheet recognition, upload combination, download helper |
| `dist/local-store.js` | IndexedDB save/load/clear logic |
| `dist/data.js` | Built-in synthetic seed dataset |
| `dist/vendor/xlsx.full.min.js` | Local spreadsheet reader dependency |
| `scripts/serve_local.py` | Loopback-only no-cache server and health endpoint |
| `scripts/generate-scenarios.mjs` | Synthetic scenario generation |
| `scripts/create-examples.mjs` | Independent CSV and Excel example generation |
| `scripts/validate-data.mjs` | Seed relationships and referential-integrity validation |
| `scripts/validate-scenarios.mjs` | Scenario count/schema and legacy report utility validation |
| `scripts/validate-local.mjs` | Current normalization, analysis, recovery, effectiveness, and independent-file validation |

### 13.3 Local service design

`serve_local.py` starts a foreground process from the project directory. The server binds to `127.0.0.1`, making it available only from the local computer. It adds `Cache-Control: no-store`, `Pragma: no-cache`, and an expired response header. The `/health` endpoint returns an application-specific JSON response. The process is stopped explicitly with Ctrl-C; no LaunchAgent, plist, Application Support deployment, or automatic restart is used.

### 13.4 Stale-build prevention

Several controls address stale calculations and old browser assets:

- Version query parameters on CSS and JavaScript references.
- No-cache HTTP headers.
- An `index.html` build-version check when a tab receives focus.
- A build-version check when a hidden tab becomes visible.
- A periodic 30-second build-version check.
- Automatic page reload when the deployed script version differs from the running version.
- A load token that prevents an older asynchronous file operation from replacing a newer one.
- Updated timestamps used to reject stale cross-tab state.
- BroadcastChannel and storage-event synchronization.

These mechanisms were added after the user observed that different uploaded files could leave previous values visible.

### 13.5 Local persistence

The application writes the active normalized dataset to IndexedDB and also attempts `localStorage`. IndexedDB supports larger structured records and is the primary durable browser store. When storage is unavailable, the application continues using the in-memory result and displays a warning that the user will need to upload the file again after reload.

Persistence includes local edits such as inspections, complaint decisions, capacity, costs, CAPA records, evidence, verification, and audit events.

---

## 14. Security, privacy, and governance

### 14.1 Privacy characteristics

- The application runs on the local computer.
- The server listens only on loopback.
- Uploaded files are parsed in the browser.
- No upload API or external telemetry is required.
- No private hosting platform is used.
- Reports are downloaded directly by the browser.

### 14.2 Input and rendering controls

User-supplied text is HTML escaped before being inserted into the interface or generated HTML report. CSV cells are quoted and embedded quotes are doubled. Numeric and date inputs are validated before analysis. These controls reduce malformed output and common markup injection risk in the local context.

### 14.3 Governance limitations

The prototype does not provide:

- User authentication.
- Role-based authorization.
- Electronic signatures.
- Tamper-evident server audit logs.
- Encrypted evidence vaults.
- Binary photo/document evidence storage.
- Record-level permissions.
- Retention and deletion policies.
- Multi-user locking or conflict resolution.

Evidence is currently stored as a text reference. Approval and reviewer fields are asserted by the local user rather than cryptographically tied to an authenticated identity.

---

## 15. Synthetic dataset and test strategy

### 15.1 Purpose of synthetic data

The project uses permission-cleared synthetic data to demonstrate sensitive factory, operator, supplier, customer, cost, and defect relationships without exposing proprietary records. The data contains planted patterns so the exposure engine can be evaluated objectively.

The seed data contains relationships such as:

- Two batches sharing fabric and thread but using different machines.
- Two failures sharing a machine while using different fabric lots.
- A passing control batch that prevents shared material from being treated automatically as proof of defect.
- Complaints and shipments linked back to production batches.
- Known confirmed and precautionary exposure lists.

### 15.2 The 20 scenario files

| # | Scenario | Main condition tested | Expected analytical challenge |
|---:|---|---|---|
| 1 | Baseline seam failure | MG-7 seam defect and late complaint | Establish the complete reference workflow |
| 2 | Shared material control | Shared fabric/thread performs well on another machine | Avoid declaring all shared-lot batches defective |
| 3 | Cross-lot machine pattern | Same machine fails across different material combinations | Strengthen machine hypothesis over material hypothesis |
| 4 | Late customer complaint | Complaint arrives after delivery | Add external evidence and shipped exposure after production |
| 5 | Missing end-line data | Planted problem with absent result | Handle incomplete inspection evidence |
| 6 | Same defect, different cause | Similar seam defect from unrelated thread snag | Keep separate contexts from being merged into one cause |
| 7 | Night shift change | Failure follows machine reassignment on night shift | Compare shift, team, and machine changes |
| 8 | Fabric shade cluster | Shade variation on shared fabric lot | Apply material-category traceability logic |
| 9 | Measurement deviation | Waistband measurement failure | Support a distinct product and defect without seed leakage |
| 10 | Critical label error | Incorrect care labels | Apply trim/label linkage and high-severity containment |
| 11 | Packing complaint after shipment | Customer reports size assortment error | Require human review before complaint confirmation |
| 12 | Trim supplier issue | Button and label lot problem | Trace supplier-related trim exposure |
| 13 | Inspector shortage | Only one inspector available | Lengthen recovery based on constrained capacity |
| 14 | Rework bottleneck | Repair capacity is 55 units/day | Expose rework-line delay |
| 15 | Inspection handling risk | Slower, costly inspection and handling | Show containment can create additional risk and cost |
| 16 | Inspection exceeds expected loss | Appraisal spend is higher than failure exposure | Support an economic decision against excessive inspection |
| 17 | Negative preventive ROI | Low recurrence and effectiveness | Show that an intervention can be commercially unattractive |
| 18 | Quality gain, delivery loss | Defects fall while throughput slows | Reveal a negative delivery consequence of improvement |
| 19 | Corrective action fails | Defect rate rises after action | Produce ineffective/reopen decision |
| 20 | Evidence gate blocks closure | Actions are marked Done without evidence | Enforce closure governance |

The 20 JSON files are also packaged into `scenarios.zip`. A manifest drives the built-in scenario selector.

### 15.3 Independent files

The project includes:

- `examples/unseen-inspections.csv`: a flat input outside the 20 cases.
- `examples/unseen-multisheet.xlsx`: a related-table workbook outside the 20 cases.
- `dist/test-files/inspection-template.csv`: a minimal template.

The independent workbook was manually uploaded during verification and produced its own HOOD-21/Puckering analysis, batch counts, inspected volume, defect count, stock, and shipped exposure. This check confirmed that the interface changed with the file rather than retaining baseline seam-case values.

---

## 16. Validation performed

### 16.1 Automated validation commands

The project provides three repeatable checks:

```bash
node scripts/validate-data.mjs
node scripts/validate-scenarios.mjs
node scripts/validate-local.mjs
```

### 16.2 Seed-data validation

`validate-data.mjs` checks:

- Unique batch, order, material, inspection, complaint, shipment, and action IDs.
- Valid batch-to-order and batch-to-product relationships.
- Valid batch-to-material relationships.
- Inventory plus shipped reconciliation in the seed data.
- Inspection sample validity.
- Complaint, shipment, fabric-roll, and rework batch links.
- The shared-material control.
- The different-machine control.
- The repeat-machine signal across different material lots.
- Valid ground-truth batch references.

### 16.3 Scenario validation

`validate-scenarios.mjs` checks:

- Exactly 20 manifest entries.
- Unique scenario IDs.
- Manifest and file metadata agreement.
- Presence of batches and inspections in every case.
- Import of the CSV template.
- Generation of both report formats in the supporting report utility.

### 16.4 Current local-analysis validation

`validate-local.mjs` checks:

- Expected confirmed and precautionary baseline batches.
- Expected baseline known cost and due date.
- Recovery inspection scope.
- Valid ordering of split-shipment first release and full completion.
- Pending, reviewed, and rejected complaint behavior.
- Due-date scoping to affected orders.
- Rejection of zero capacity.
- Decimal first-pass yield conversion.
- Accepted-unit parsing.
- Correct parsing of `required: false`.
- Effective, partially effective, and not-yet-eligible verification behavior.
- Shipment quantity derivation from shipment records.
- Day-first date parsing.
- Comma-formatted number parsing.
- Rejection of impossible calendar dates.
- An independent JSON case with no seed-data leakage.
- A flat CSV case.
- Multiple related CSV files.
- All 20 scenarios load and create exposure records.
- Distinct measurement, packing, capacity, cost, and evidence-gate cases.
- Recovery delay increase when inspector capacity is reduced.

### 16.5 Manual browser verification

The browser pass covered:

- Local service availability.
- Uploading an independent Excel workbook.
- Visible changes in title, active file, KPIs, defect focus, batches, stock, and shipment numbers.
- Recalculation in Overview and all analytical pages.
- Opening all eight navigation sections without an application error.
- Cross-tab dataset synchronization.
- Automatic build-version update behavior.
- HTML report download.
- CSV report download.
- Active-dataset values in downloaded reports.
- Absence of prior seed batch identifiers in unrelated uploaded-file reports.
- Browser console without observed errors in the tested flow.

### 16.6 Quality checks on source changes

`git diff --check` was used to detect whitespace and patch-format problems. The local validation suite passed after the final analysis and synchronization changes.

### 16.7 Interpretation of validation

The checks provide strong evidence for the defined file contracts and tested workflows. They do not prove that every possible arbitrary file, browser condition, malformed workbook, or business policy will behave correctly. A bounded production acceptance plan should define required source schemas, data volumes, browsers, roles, formula sign-off, and expected outcomes.

---

## 17. Major problems found and corrective changes made during development

### 17.1 Uploaded files did not visibly replace stale numbers

**Observed problem:** Loading different files could leave the user seeing previous figures, especially in another open tab or after source updates.

**Changes made:**

- Rebuilt the active interface around the normalized current dataset.
- Removed reliance on fixed demo calculations in the live path.
- Added IndexedDB persistence.
- Added BroadcastChannel synchronization.
- Added `localStorage` fallback and storage-event synchronization.
- Added updated timestamps and stale-update rejection.
- Added load-state handling and a load token for overlapping asynchronous uploads.
- Added no-cache server headers.
- Added versioned asset URLs.
- Added focus, visibility, and periodic build-version checks with automatic reload.
- Deployed the changed `dist` files through the local service manager.

### 17.2 Complaint text could overstate confirmed exposure

**Observed problem:** A matching customer complaint should not automatically prove a defect or root cause.

**Changes made:**

- Pending complaints support precautionary scope only.
- Human-reviewed complaints can support confirmed exposure.
- Rejected or dismissed complaints are excluded.
- Complaint review is persisted and audited.

### 17.3 Traceability links were too generic

**Observed problem:** Different defects require different linkage logic. A packing error should not be traced in the same way as shade variation or an open seam.

**Changes made:**

- Packing categories use packing-lot relationships.
- Material and shade categories use fabric-lot relationships.
- Trim, label, zip, and button categories use trim/thread relationships.
- Sewing defects use machine, line, fabric, and thread context.
- Different product/factory signals are shown separately rather than merged.

### 17.4 Recovery could present a misleading plan without stock

**Observed problem:** A plan with zero or unknown confirmed inventory could appear feasible.

**Changes made:**

- Recovery options return no plan when confirmed stock is zero or unavailable.
- The interface explains whether stock is absent or unquantified.
- Inspector concurrency is capped by available stations.
- A split shipment now distinguishes priority release from full completion.

### 17.5 Cost calculations treated incomplete data too confidently

**Observed problem:** Missing costs or accepted units could be interpreted as zero or could create misleading unit economics.

**Changes made:**

- Unknown cost categories remain unavailable.
- Cost coverage is displayed.
- Internal and external costs are derived only when underlying cost records exist.
- COPQ per acceptable garment requires explicit accepted units.
- ROI uses internal plus external failure exposure, recurrence, reduction, and prevention investment.

### 17.6 CAPA closure could be administrative rather than evidence based

**Observed problem:** Actions marked Done did not necessarily prove implementation or sustained effectiveness.

**Changes made:**

- Corrective implementation requires Done status, evidence, completion date, and a nonfuture date.
- Each 30/60/90 check requires its own date and evidence.
- Checks must be due before they can become valid.
- Follow-up inspections are separated from pre-action evidence.
- A minimum post-action sample is required.
- A side effect produces a negative-effect decision.
- Closure reports every missing gate and remains blocked.

### 17.7 Known-answer scoring remained after evidence changes

**Observed problem:** Synthetic precision and recall were no longer valid after adding inspections or changing complaint decisions.

**Changes made:**

- Local evidence changes clear ground truth.
- The cleared state is persisted.
- A warning explains why known-answer validation is unavailable.

### 17.8 Import edge cases reduced trust

**Observed problem:** Real files can contain commas in numbers, decimal FPY, Boolean strings, day-first dates, incomplete batch tables, and invalid capacity values.

**Changes made:**

- Added alias and type normalization.
- Added thousands-separator handling.
- Added decimal-to-percent FPY conversion.
- Corrected false/true parsing for required actions.
- Added date normalization and impossible-date rejection.
- Added shipment-derived shipped quantities.
- Added positive and whole-number capacity validation.

### 17.9 Final correctness pass on independent files and reload

**Observed risks:** Files without a reviewed result or approved threshold could be labeled Confirmed from a default rate. Undated inspections could be assigned today's date and appear as valid post-action evidence. Partially known stock could produce a complete-looking recovery estimate. Inferred production batches could receive inspection sample size as a false production total. Concurrent browser saves could let older data replace newer analysis. Long-form cost tables were not aggregated.

**Changes made:**

- Classify a rate-only alert as Precautionary until an inspection reviewer records Pass/Fail with evidence or the source provides an approved threshold/result.
- Add an inspection review control to the Quality signals page and retain screening provenance through reload.
- Preserve missing inspection dates and exclude undated rows from trend and effectiveness time comparisons.
- Suppress recovery options when confirmed or related stock quantities are incomplete or no matching inspection sample supports the rework estimate.
- Keep unknown production volume unknown when batches are inferred from inspection rows.
- Require explicit action completion dates in the interface and reopen a closed case after material evidence or decision changes.
- Serialize browser saves, compare stored revisions, and choose the newest IndexedDB or localStorage copy during reload and tab synchronization.
- Derive prevention economics from explicit or recorded internal and external failure costs, and include these outcomes in downloaded reports.
- Aggregate category/amount cost tables, prioritize explicit sheet names in mixed workbooks, and parse Excel dates as date values.
- Validate duplicate operational IDs, production dates, complaint dates and costs, order quantities, and rework quantities and costs.
- Escape spreadsheet formula prefixes in CSV export cells.

Automated tests cover these boundary conditions. Browser checks confirmed independent CSV and XLSX uploads, persistence after reload, the inspection review transition, CAPA closure blocking, all eight views, and a report calculated from the active file. The local workbook was restored after the interaction tests.

---

## 18. User experience assessment

### 18.1 Strengths

- The active source is visible, reducing confusion about which file is being analyzed.
- The management overview connects quality, cost, delivery, and execution.
- Confirmed and precautionary scope use explicit rationales.
- Missing data appears as unavailable instead of a false zero.
- Forms recalculate the same active model immediately.
- Closure explains missing evidence rather than silently failing.
- Recovery alternatives use consistent cards and comparable outputs.
- Reports provide a portable record outside the application.
- Built-in cases make demonstrations repeatable.
- Independent uploads allow the same interface to analyze similar external files.

### 18.2 Remaining usability opportunities

- Provide a downloadable data dictionary and blank multi-table workbook template.
- Add field-mapping preview before import.
- Add row-level import error download for large files.
- Add visual network genealogy with expandable nodes.
- Add richer Pareto and control charts.
- Add side-by-side recovery comparison with editable organization rates.
- Add explicit overdue action highlighting and calendar view.
- Add portfolio-level incident history rather than one active local case.
- Add evidence attachment previews in a production evidence store.
- Add accessibility testing with keyboard-only and screen-reader workflows.

---

## 19. Developer assessment

### 19.1 Strengths

- Analysis logic is separated from DOM rendering.
- File ingestion and persistence are separate modules.
- Business rules are transparent and testable.
- Missing-data semantics use null rather than zero.
- Independent files are included in validation.
- The local server is small, inspectable, and dependency-light.
- Versioning and cache controls directly address stale-code behavior.
- HTML escaping and CSV quoting are centralized.
- The application can run without a build tool or package install.

### 19.2 Technical debt and risks

- `local-app.js` remains a large single rendering/controller module.
- The CSS is minified into a small number of long lines, which reduces maintainability.
- There is no formal TypeScript schema or JSON Schema contract.
- Automated tests are assertion scripts rather than a test-runner suite with coverage reporting.
- Browser interaction testing is manual rather than Playwright-based.
- The heuristic traceability rules are embedded in code rather than configurable policy tables.
- Currency is fixed to dollars in displayed assumptions.
- Replacement capacity is fixed at 1,100 units/day.
- Delay and unit-cost assumptions are fixed in code.
- There is no worker thread for very large parsing or analysis tasks.
- IndexedDB schema migration is minimal because the application has a single store and current dataset.
- Legacy modules from the earlier site build remain in `dist` even though the current entry point uses the local modules.
- The current release baseline is committed at `3caeef5`; generated assets are included deliberately because the build is a static, buildless deployment.

### 19.3 Recommended code evolution

1. Define a versioned JSON Schema for all supported entities.
2. Split view rendering, state transitions, reporting, and form handling into modules.
3. Move business assumptions into an editable configuration object with currency and units.
4. Add unit tests for every formula boundary and classification branch.
5. Add browser tests for upload, cross-tab synchronization, reload, form edits, closure gates, and downloads.
6. Add performance tests for large workbooks.
7. Add a migration path for stored browser datasets.
8. Remove unused legacy files after confirming no supported workflow depends on them.
9. Create a signed release archive and checksum.
10. For enterprise use, introduce an API, relational persistence, authorization, evidence storage, and immutable event history.

---

## 20. Requirement coverage matrix

| Requested capability | Current status | Implementation notes |
|---|---|---|
| Product genealogy | Implemented for supplied identifiers | Batch, order, product, process, material, packing, inventory, shipment |
| Multiple inspection stages | Implemented | Stage is open text with common stages supported |
| Defect capture | Implemented | Type, location, severity, quantity, inspector, threshold, evidence, disposition |
| Early warning | Partially implemented | Aggregation, rate, failed-record weighting, comparisons, confidence; full SPC/novelty model remains future work |
| Exposure engine | Implemented | Confirmed, precautionary, separate, unrelated, partial-data warnings |
| Root-cause workspace | Implemented as evidence comparison | Human confirmation required; richer diagram tools remain future work |
| Containment planning | Implemented in current incident scope | Hold, shipment block, inspection/recovery scope; physical execution integration absent |
| Capacity recovery | Implemented as five scenario estimates | High-level capacity model, not minute-by-minute optimization |
| COPQ | Implemented | Four categories, coverage, unit cost, expected loss, ROI |
| CAPA command | Implemented for one active local incident | Owners, dates, evidence, approval, closure gates, audit |
| Corrective-option evaluation | Partially implemented | Recovery alternatives and intervention data supported; full multicriteria scoring UI remains future work |
| Effectiveness verification | Implemented | Baseline/post rates, sample gate, 30/60/90, recurrence, side effects |
| Customer feedback | Implemented | Complaint categories, review states, batch link, costs; automated NLP absent |
| Learning layer | Implemented at case level | Evidence, results, side effects, audit, lesson records; portfolio learning future work |
| Test dataset | Implemented | Seed, 20 controlled cases, independent CSV and Excel |
| File upload | Implemented | JSON, CSV, TSV, XLSX, XLS; flat and related tables |
| Report download | Implemented | HTML and CSV based on active data |
| Local-only running | Implemented | Loopback Python service and browser processing |
| Arbitrary similar files | Implemented within documented contract | Alias-tolerant normalization; unknown structures still require mapping or transformation |
| Role-based access | Not implemented | Required for production |
| Database or graph store | Not implemented | Browser-local normalized model used |
| Machine-learning root cause | Intentionally not implemented | Human reviewer must approve conclusions |

---

## 21. Operational instructions

### 21.1 Start or refresh the local application

From the project directory:

```bash
python3 scripts/serve_local.py
```

Open:

```text
http://127.0.0.1:8765/
```

Keep the terminal open while using the application and stop the server with Ctrl-C.

### 21.5 Upload a dataset

1. Open Overview.
2. Select Upload files.
3. Choose one JSON/CSV/TSV/Excel file or a related set of entity files.
4. Confirm that the source panel names the new file.
5. Review warnings and inferred records.
6. Review the recalculated defect, reference batch, exposure, costs, and recovery.
7. Download the HTML or CSV report when required.

### 21.6 Run validation

```bash
node scripts/validate-data.mjs
node scripts/validate-scenarios.mjs
node scripts/validate-local.mjs
git diff --check
```

---

## 22. Limitations and appropriate interpretation

The current application has deliberate boundaries:

- It is a single-browser local tool.
- It supports one active persisted dataset rather than a multi-incident server repository.
- It does not authenticate users or approvals.
- It stores evidence references, not evidence binaries.
- It does not send email, supplier, factory, or logistics notifications.
- It does not integrate with ERP, PLM, MES, WMS, laboratory, inspection, or customer-service systems.
- It uses heuristic defect-category links and does not prove causal relationships.
- Its confidence labels reflect data volume and confirmation count, not formal Bayesian confidence.
- Its recovery output is a scenario estimate, not a constraint-programmed shift schedule.
- It does not model individual operator calendars, machine maintenance windows, skill matrices, material replenishment, approval queues, overtime, weekends, or logistics sailing schedules.
- Its default cost and throughput assumptions are illustrative.
- It does not implement a trained complaint classifier.
- It does not include complete control-chart rule sets or new-pattern detection.
- It does not replace a qualified quality engineer, industrial engineer, production planner, or financial approver.
- Its 20 MB upload limit is suited to demonstration and moderate datasets.
- Similar files are supported when they follow recognizable entity or flat-table structures; any arbitrary schema cannot be interpreted without mapping.

Users should treat results as decision support and verify critical dispositions against source records and approved company procedures.

---

## 23. Production roadmap

### Phase 1: Controlled pilot hardening

- Freeze a versioned data contract.
- Configure company currency, rates, shifts, working calendar, and defect taxonomy.
- Add import mapping and rejection reports.
- Add automated browser regression tests.
- Conduct formula sign-off with Quality, Finance, Production, and Merchandising.
- Run parallel results against manually solved incidents.

### Phase 2: Multi-user workflow

- Introduce FastAPI or equivalent service layer.
- Store transactional records in PostgreSQL.
- Add graph queries or a graph projection for genealogy.
- Implement SSO and role-based access.
- Add authenticated approvals and immutable audit events.
- Add binary evidence storage with retention controls.
- Add notification and escalation services.

### Phase 3: Integration and optimization

- Integrate ERP orders, PLM specifications, MES operations, WMS inventory, shipment status, inspection systems, and customer complaints.
- Use constraint programming for inspector, station, line, skill, material, shift, cut-off, and approval scheduling.
- Add actual-versus-plan recovery tracking.
- Add supplier and factory scorecards based on total landed quality cost.
- Add portfolio incident and recurrence analytics.

### Phase 4: Advanced analytics

- Add statistical control charts with run rules.
- Add hierarchical baselines by style complexity, line, factory, and stage.
- Add complaint-text suggestions with human approval.
- Add anomaly and emerging-pattern detection.
- Add causal experiment support for intervention evaluation.
- Add calibrated risk scores with uncertainty intervals.
- Retain the rule that machine learning prioritizes investigation and never autonomously declares root cause.

---

## 24. Business value

The platform creates value by shortening the time between a defect signal and a controlled management response. Its main benefits are:

- **Reduced customer risk:** earlier connection between complaints, shipped units, and factory evidence.
- **Lower false containment:** separation of confirmed and precautionary batches prevents unnecessary blanket holds.
- **Faster investigation:** production and material comparisons bring relevant evidence into one workspace.
- **More credible delivery promises:** recovery scenarios incorporate actual inspector and rework constraints.
- **Better financial decisions:** COPQ connects factory price, appraisal, rework, claims, delay, and prevention.
- **Clear accountability:** owners, evidence, dates, approval, and verification are visible.
- **Stronger closure discipline:** a case cannot close on task status alone.
- **Organizational learning:** failed assumptions, later evidence, and side effects remain connected to the incident.
- **Privacy and portability:** the current prototype works without uploading sensitive factory data to a hosted service.

The most important management contribution is the connection of quality, cost, delivery, and execution. The platform demonstrates that the cheapest immediate action may create a larger shipment delay, that a broader inspection may cost more than the expected loss, and that a quality improvement may still be unacceptable if it creates a serious delivery or operational side effect.

---

## 25. Acceptance criteria for the current prototype

The current build should be considered acceptable for its defined prototype scope when all of the following are true:

- The local service starts and the health endpoint responds.
- The interface opens without external network access.
- All 20 built-in cases load.
- Independent JSON, CSV, multi-file tables, and Excel workbooks within the documented schema load.
- Uploading a different file changes source identity and calculated results.
- Reload retains the current stored dataset when browser storage is available.
- A second local tab receives the updated dataset.
- Exposure distinguishes confirmed and precautionary relationships.
- Missing quantities and costs remain unavailable rather than becoming zero.
- Recovery responds to capacity changes and does not plan unknown/zero stock.
- Cost outputs respond to supplied category and probability inputs.
- Corrective implementation requires dated evidence.
- Verification requires eligible, separately evidenced 30/60/90 checks.
- Closure is blocked until all gates pass.
- HTML and CSV reports contain the active analysis.
- All three validation scripts pass.

These criteria define a testable boundary. They are more credible than claiming correctness for every conceivable file and workflow outside the documented contract.

---

## 26. Conclusion

Garment Quality Intelligence turns an apparel defect from a static percentage into a connected management case. The completed local application links inspections and complaints to production genealogy, distinguishes evidence from precaution, estimates inventory and shipment exposure, compares constrained recovery alternatives, quantifies COPQ, assigns corrective work, blocks unsupported closure, and evaluates whether later evidence shows a sustained improvement.

The project also captures the lessons of its own development. The stale-result problem led to a stronger architecture for active-dataset state, persistence, synchronization, cache control, and build reloads. Investigation of complaint and exposure behavior led to human-review gates and defect-category-aware traceability. Review of recovery, cost, and CAPA behavior led to explicit missing-data semantics, feasible-capacity constraints, evidence-dated implementation, and effectiveness-based closure.

Within its documented local prototype scope, the platform is a substantial end-to-end demonstration of garment quality intelligence. It shows how quality management can support production, delivery, finance, sourcing, customer service, and factory leadership through one explainable workflow. Its next step is not to add opaque automation, but to formalize the data contract, validate assumptions with business owners, add enterprise controls, and connect the proven workflow to live operational systems.

---

## Appendix A. Project file inventory

```text
quality-platform/
├── README.md
├── project-report.md
├── dist/
│   ├── index.html
│   ├── styles.css
│   ├── local-app.js
│   ├── analysis-core.js
│   ├── file-ingest.js
│   ├── local-store.js
│   ├── data.js
│   ├── app.js                 # earlier site implementation retained in source
│   ├── dashboard.js           # earlier dashboard implementation retained in source
│   ├── file-tools.js          # supporting/legacy scenario utilities
│   ├── vendor/
│   │   ├── xlsx.full.min.js
│   │   └── XLSX-LICENSE.txt
│   └── test-files/
│       ├── index.json
│       ├── 01-baseline-seam.json ... 20-evidence-gate.json
│       ├── inspection-template.csv
│       └── scenarios.zip
├── examples/
│   ├── unseen-inspections.csv
│   └── unseen-multisheet.xlsx
├── scripts/
│   ├── serve_local.py
│   ├── generate-scenarios.mjs
│   ├── create-examples.mjs
│   ├── validate-data.mjs
│   ├── validate-scenarios.mjs
│   └── validate-local.mjs
└── screenshots/
    └── local-audit-final.png
```

## Appendix B. Minimum flat-file fields

| Business meaning | Example accepted header |
|---|---|
| Batch ID | `batch_id` |
| Inspected quantity | `sample_size` |
| Defective quantity | `defective_quantity` |
| Defect type | `defect_type` |

Recommended additions include inspection ID, stage, date, threshold, disposition, SKU/style, factory, line, machine, fabric lot, thread lot, trim lot, production units, inventory, shipped units, and shipment cut-off.

## Appendix C. Suggested production data ownership

| Data domain | Recommended owner |
|---|---|
| Product, style, specification | Product development / technical |
| Orders and customer commitments | Merchandising |
| Batch and operation genealogy | Production / MES owner |
| Material and trim lots | Warehouse / sourcing / supplier quality |
| Inspection records | Factory quality |
| Complaints and returns | Customer quality |
| Shipment events | Logistics |
| Rework and scrap | Production and Finance |
| COPQ rates and assumptions | Finance with Quality |
| CAPA actions and evidence | Named action owners |
| Approval and closure | Factory and quality management |
| Verification | Independent verification owner |

## Appendix D. Glossary

| Term | Meaning |
|---|---|
| CAPA | Corrective and Preventive Action |
| COPQ | Cost of Poor Quality |
| DHU | Defects per Hundred Units |
| FPY | First-Pass Yield |
| Genealogy | The chain connecting customer/product records to batches, processes, materials, and production conditions |
| Confirmed exposure | A batch supported by failed inspection or approved complaint evidence in the relevant context |
| Precautionary exposure | A related batch requiring verification before disposition |
| False containment | Units held even though they are not truly affected |
| Missed affected units | Truly affected units that were not identified by the exposure logic |
| Appraisal cost | Cost of detecting quality problems |
| Internal failure cost | Failure cost incurred before delivery |
| External failure cost | Failure cost incurred after delivery |
| Effectiveness check | Evidence that an implemented action reduced the target problem and remained stable |
| Recurrence | Reappearance of the same defect after corrective action |
| Reference batch | The batch used as the starting point for traceability analysis |
| Separate signal | A matching defect in a different product/factory context that requires its own investigation |

