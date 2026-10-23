# FactorySphere — product design and analytical experience

## Release intent

Version 3, completed 23 October 2026, transforms the runtime across every operational workspace. The visual direction follows the supplied five-color reference. The interface is organized around evidence, decisions and execution, with a dedicated exploratory canvas for deeper analysis. It retains the browser-local data model, import formats, calculations, governance rules and portable reports.

This is a product design and decision-support upgrade. Authentication, a shared operational database and server-enforced approvals remain future architecture requirements; the design does not claim those capabilities exist.

### Release status

The current published build is commit `3caeef5`. GitHub Pages completed its deployment workflow successfully. Live verification uploaded the known-answer product-mix file, checked recalculation and reload persistence, then downloaded the decision report. The report contained the active source, raw and standardized comparison, shared-stratum evidence, recovery dominance results and the full signed prevention stress grid. No live console errors or warnings were observed.

## Foundations

| Token | Value | Role |
| --- | --- | --- |
| Ink | `#2b2d41` | Navigation, major headings, decision surfaces |
| Slate | `#8f99ad` | Comparison series, secondary classification |
| Ivory | `#f0e9e5` | Warm neutral foundation |
| Sand | `#d2b290` | Selected controls, precautionary classification, highlights |
| Clay | `#995043` | Primary actions, confirmed exposure, observed series |
| Paper | `#fffdfa` | Cards, inputs and report surfaces |
| Canvas | `#f5f2ee` | Main workspace background |
| Text secondary | `#6e7080` | Explanations, units and supporting metadata |

DM Sans supplies interface text and numerals. Manrope supplies headings and metric values. Font files are bundled locally and their licenses are retained alongside them. The styling uses restrained borders, consistent panel geometry, thin line icons, tabular numerals, deliberately spaced headings and contrasting decision surfaces. Semantic states have text labels; color is never the only indication of classification or action status.

## Application architecture

`experience.js` renders the shell, executive overview, quick-find results and workspace tabs. `experience.css` defines the shared responsive language. The existing calculation and workflow modules remain responsible for decisions.

`analytics-studio.js` renders the linked explorer, proportional inventory map, interactive recovery comparison and assurance canvas. `advanced-analytics.js` contains pure explorer calculations and the 12 additional chart specifications. `studio.css` handles the canvas layout. `visualizations.js` combines the original 38 and new 12 chart specifications into a single exportable library. `report-theme.js` supplies self-contained report styling.

The existing `styles.css` and `enterprise.css` provide structural compatibility for operational forms. The new styles load after them and define the current product language. New source files are formatted for maintenance. GitHub Pages versions entry assets and ES-module imports by the deployment commit.

## Information architecture

The navigation has 13 workspaces:

1. Overview: quality signal, inventory exposure, recorded costs, overdue actions and next decisions.
2. Analysis studio: linked exploratory comparisons, inventory, recovery economics and execution assurance.
3. Visual library: 50 analytical views, searchable by purpose and workspace.
4. Traceability: production genealogy, batch links and confirmed/precautionary rationale.
5. Quality signals: inspections, control monitoring, defect comparisons and review controls.
6. Investigation: hypothesis comparisons, Fishbone, Five Whys and cause evidence.
7. Customer feedback: complaints, classifications, traceability and human review.
8. Containment: commitments, ownership and exposure response.
9. Recovery planner: seven strategies, resources, assumptions and operational sequence.
10. Cost intelligence: quality-cost categories, attributed ledger, ROI and sensitivity.
11. CAPA command: ownership, actions, dependencies, approvals, gates and audit history.
12. Effectiveness: comparable cohorts, follow-up checks and learning.
13. Data workspace: import, coverage, evidence attachments, scenario library and definitions.

Global controls provide import, export and command search. The source strip identifies the active file and local save state on every page. Export choices distinguish the decision report, visual report, CSV, analytical JSON and a complete workspace backup.

## Interaction model

### Quick find

Search is available from the header and ⌘K/Ctrl+K. It searches workspace titles and the active dataset's batch identifiers, styles, factories, lines, inspections, defect names, action titles and owners. Record results retain their target batch when opening traceability. Text is HTML-escaped. A native dialog handles modality and Escape dismissal.

### Operational tabs

Operational pages separate working controls from their visual analysis. Tabs change visibility without rebuilding the forms, preserving unsubmitted field values. Arrow keys switch tabs; Home and End select the first and last tab. A section selector navigates the visible panel. This keeps long operational pages navigable while retaining their full content.

### Tables

Long tables receive an in-panel text filter and a visible matching-record count. Filtering changes visible rows only; it does not alter calculations or reports. Tables are keyboard-focusable labeled scroll regions. Horizontal scrolling remains within the table panel on narrow screens.

### Linked quality explorer

The explorer selects one defect and supports factory, line, product/style, stage, machine group, fabric lot and shift dimensions. Factory and stage filters intersect. Date filters include only dated records in their inclusive range. A minimum sample applies to each comparison group. A stale group from a different selection is discarded safely.

The summary is computed from the displayed selection: total inspected observations, defective observations, volume-weighted rate and distinct linked batches. Clicking a comparison group updates the activity grid and evidence records. The group ranking shows Wilson 95% intervals for rates. These comparisons remain descriptive and explicitly identify product-mix and sampling limitations.

The activity grid displays the most recent 21 observed dates and up to 10 eligible groups, or the selected group. Each cell aggregates defective/sample observations for that group and date. Missing samples are shown as a dash, not zero. Tooltips and underlying records retain denominators. Selection CSV exports the full selected record set, not merely the visible activity-grid window.

### Inventory area map

Rectangles represent supplied positive inventory. Binary area partitioning makes each rectangle proportional to its units. Confirmed, precautionary and other classifications remain distinct. Unknown and zero inventory are excluded from area and counted in the explanatory note. Tiles open batch genealogy. The overview and studio identify this as the entire selected-defect portfolio, independent of local explorer filters.

### Recovery trade-off selection

The interactive scatter plot places strategies by modeled working days and incremental cost. Selecting a point or its keyboard-accessible strategy button updates the existing saved recovery selection, strategy metrics and sequential timeline. The accompanying explanation retains shipment cut-off, coverage, missed-detection and resource caveats. A plot position alone is not a release recommendation.

## New analytical outputs

The chart library grows from 38 to 50 distinct specifications:

| Added output | Analytical purpose | Guardrail |
| --- | --- | --- |
| Daily defective rate | Separate volume-weighted rate changes from inspection activity | Descriptive trend, not a control chart |
| Sample volume vs batch rate | Expose sparse high-rate groups | Association, not root cause |
| Line × defect matrix | Identify recurring defect signatures | Separate denominator in each cell |
| Fabric lot × factory matrix | Compare shared inputs across operating contexts | Process/material confounding remains |
| Related batch stock/shipped footprint | Locate current and dispatched exposure | Missing components remain explicit |
| Factory containment inventory | Separate confirmed and precautionary stock | Does not claim physical quarantine |
| Inspection decisions by stage | Show where Pass/Fail/Unknown records accumulate | Inferred screening decisions are not confirmed failures |
| Prevention-benefit sensitivity | Show break-even and negative net benefit | One comparable future incident |
| Recovery stage timeline | Explain the modeled critical path | Sequential working days, not a live reservation |
| Action deadline distance | Prioritize overdue work and future deadlines | Negative days = overdue |
| Action assurance matrix | Find gaps by action and required input | Supplied evidence does not constitute approval |
| Before/after stage matrix | Reveal inspection-mix changes | Only explicit SKU/factory/line cohort |

Heatmaps, timelines, diverging bars and signed continuous curves join the existing interval bars, lines, stacks, grouped risks, waterfalls and scatter plots. Every library chart retains exportable evidence, scope, units, source and date. Sparse or unavailable data produce an explicit empty state.

## Critical decision review

The Analysis studio has two modes: **Analytical canvas** and **Critical decision review**. The second deliberately challenges interpretation rather than inventing a confidence score. Its scope is the active dataset and selected defect; local quality-explorer filters do not narrow the review.

The pure `decision-review.js` module generates traceable findings for assumed screening dispositions, unknown related stock, duplicate observation signatures, passing control evidence in related batches, sparse or zero-event observations, incomplete cost/cut-off inputs, insufficient comparable follow-up, cause confirmation and governance evidence. Each finding carries a priority, observed condition, decision implication, verification step, supporting record IDs and destination workspace. No additional automatic approval or closure rule is introduced.

### Product-mix challenge

For factory, line, machine and fabric comparisons, the engine takes the highest and lowest raw observed-rate groups. It constructs fully identified shared strata using product/style and inspection stage, adding factory for line/machine comparisons and factory/line for fabric comparisons. Each shared stratum receives the same weight for both groups: the pooled inspected sample in that stratum divided by the combined sample across all shared strata. The adjusted group rate is the sum of its stratum rates multiplied by those weights. Missing or unshared strata are excluded; both coverage percentages are shown. The UI compares raw and adjusted bars and flags an actual sign reversal.

This is direct descriptive standardization. Selecting extreme groups is exploratory and can introduce selection bias. The result is not a causal estimate, statistical-significance test, proof of worker performance or substitute for a controlled investigation. Timing, process complexity, environment and measurement effects can remain uncontrolled.

The independent regression oracle uses two styles and two factories. A has 1/100 and 81/900 defective observations; B has 18/900 and 10/100. Raw rates are 8.2% and 2.8%. Equal pooled-stratum weights yield 5% and 6%, a reversal from +5.4 to −1 percentage points. Missing style IDs correctly withhold the standardized result. A supplemental downloadable JSON demonstrates the same relationship.

### Recovery dominance

A feasible plan is dominated only if another is no worse in every modeled criterion and strictly better in at least one. The minimized criteria are incremental cost, working-day lead time, uninspected related units, expected missed defects, expected false holds and handling damage. Units before cut-off are maximized only when known for every alternative. Missing required criteria make a plan unassessable; equal alternatives do not dominate one another. A lower-cost strategy with worse coverage can remain undominated. Tests explicitly cover these cases.

This identifies a conditional Pareto set, not a uniquely optimal or approved plan. Customer priorities, worker safety, physical reservations, non-modeled consequences and uncertainty in the supplied planning assumptions still require human review.

### Prevention stress matrix

The 25-cell matrix varies recurrence and achieved reduction independently over 0%, 25%, 50%, 75% and 100%. Each cell calculates `failure cost × recurrence × reduction − prevention investment` for one comparable future incident. Signed values distinguish net cost from net benefit. The display includes the stated-assumption result, break-even recurrence at the stated reduction and break-even reduction at the stated recurrence. Missing cost inputs withhold the matrix; a zero denominator withholds a finite threshold. The scenarios are stress assumptions, not fitted probabilities or forecasts.

Decision HTML and analytical JSON retain the complete critical review, shared comparison strata, recovery assessment and stress-test values. CSV includes the serialized decision-review object. `decision-review-ui.js` presents the review; `studio.css` supplies responsive comparison cards, findings and the stress matrix.

## Report design

Both complete and visual HTML reports are self-contained and use the same palette and visual hierarchy. They contain all 50 chart sections. Individual SVG downloads include their description, source, units and scatter-plot keys; CSV retains numeric precision. Report styling includes responsive layout and print rules. System font fallbacks allow offline use without fetching additional assets.

## Responsive and accessibility behavior

- At wide desktop sizes, a persistent navigation rail frames the analytical workspace.
- At 1050 pixels and below, navigation becomes an explicit drawer with scrim, Escape dismissal, focus containment and an inert background.
- At 760 pixels and below, analytical layouts become single-column, overview metrics retain a two-column arrangement, and controls remain touch-sized.
- At 430 pixels and below, detailed forms use a single column and nonessential header copy is reduced.
- Tables and wide scientific plots scroll internally. Their full values remain available in evidence tables and downloads.
- Visible focus rings, semantic headings, a skip link, native dialogs, labeled fields, tab roles and source/save status support keyboard navigation.
- Reduced-motion preferences disable animation and transitions. Page-entry motion is subtle; changing a filter does not repeatedly fade the canvas.

## Verification record

Observed during the redesign verification on 23 October 2026:

- All 13 workspaces rendered at 1440, 768 and 390 pixels without document-level horizontal overflow.
- The independent CSV produced 17/300 defective observations, displayed as 5.7%, in overview and studio.
- All workspaces were inspected after that upload: no previous demonstration batch identifiers and no NaN/Infinity/undefined output remained.
- The independent Excel workbook produced 11/200, displayed as 5.5%.
- The independent JSON audit case produced 20/200, 10%, 1,000 confirmed stock units and $1,000 initial quality cost.
- Editing external failure from $400 to $800 changed total quality cost to $1,400. The value survived workspace/chart tab switching, saving and reload.
- Downloaded decision-report HTML contained 50 chart sections, the active source and updated $1,400 amount, with no previous-file batch identifiers or invalid numerical output.
- Attempting closure without mandatory evidence displayed the blocking gates and retained the open incident.
- Selecting line L-03 in the extended demonstration changed the explorer to 2/200, 1%, one linked batch and one selected inspection record.
- Command search found batch B-1044, its inspection and linked action in the demonstration.
- Browser console review returned no errors or warnings during these checks.
- Uploading `synthetic-product-mix.json` through the browser displayed the expected factory reversal: raw 8.2% versus 2.8%, standardized 5% versus 6%, 100% matched sample coverage and two shared strata. The downloaded report included the critical findings, strata, recovery-dominance assessment and prevention stress values. Critical review also rendered at 390 pixels without page-level overflow.

Six automated suites gate publication. The added experience suite independently verifies weighted arithmetic, filter intersections, group eligibility, stale selections, signed prevention values, inventory area conservation, safe search markup and rendering across 21 synthetic datasets. These checks substantiate the exercised paths; they do not certify every browser/device combination or make the local app a regulated enterprise system.

## Maintenance guidance

Keep calculations in pure data modules. Use the same chart specifications for screen and report outputs. Retain missing-value distinctions, scope notes and denominators when adding visuals. Do not recolor a precautionary relationship as a confirmed failure. Add new datasets to the test suite when changing analytic behavior. Keep local runtime assets bundled, licenses retained, and GitHub Pages versioning intact.
