# FactorySphere

FactorySphere is a local-first browser app for apparel quality traceability, inspection analysis, exposure, recovery planning, Cost of Poor Quality, CAPA, and effectiveness verification. Uploaded data stays in the browser during local use.

- Repository: https://github.com/mah-era/FactorySphere
- Live demo: https://mah-era.github.io/FactorySphere/

## Run locally

From this project directory:

    python3 scripts/serve_local.py

Open http://127.0.0.1:8765. Keep the terminal open while using the server. Stop it with Ctrl-C. The server sends no-cache headers, so reloading the page reads current app files. No LaunchAgent, background service, build, package installation, database, or internet connection is needed. The Excel reader is bundled locally in dist/vendor/.
An open tab checks the local build version when focused and periodically; it reloads after a local update so old analysis code does not keep showing outdated calculations.

## Upload your own data

Use Upload files on the Overview page. Uploads replace the active dataset and recalculate the dashboard, traceability, inspections, investigation comparisons, recovery estimates, costs, CAPA, verification, and reports. The source panel shows the file name, load time, sample count, and defect count. Other local tabs update to the same dataset. Browser IndexedDB retains the active dataset across reloads, including larger files; a storage warning appears if the browser cannot save it.

Supported inputs:

- One JSON file containing inspections and optional batches, shipments, complaints, actions, costInputs, recoveryInputs, and other related arrays. The included test JSON files show the full schema.
- One flat CSV/TSV/XLSX/XLS file with at least batch, sample, defects, and type columns. Common aliases such as batch_id, sample_size, defective_quantity, and defect_type work. Batch attributes on each row are used to infer production batches.
- Several related CSV/TSV/Excel files in one upload. Name them Inspections, Batches, Shipments, Complaints, Actions, and so on. Excel workbooks can use corresponding sheet names.

See dist/test-files/inspection-template.csv, examples/unseen-inspections.csv, and examples/unseen-multisheet.xlsx. The latter two are independent examples with defects and batches absent from the 20 prepared cases.

The minimum data gives inspection rates and a basic exposure classification. If both a result and acceptance threshold are missing, a 2.5% screening rule flags elevated records for review; those records remain precautionary until a reviewer records a Pass/Fail result with evidence or an approved threshold is supplied in the file. The Quality signals page has a review control for each inspection. Add SKU, factory, machine/line, material lots, stock, shipments, costs, and action records for stronger conclusions. Missing fields are shown as unavailable rather than filled from demo data. Sample size is never substituted for unknown production volume. Undated inspections cannot support time-based effectiveness verification. The app distinguishes confirmed evidence from precautionary links; a reviewer decides root cause and final disposition.
Dates should use `YYYY-MM-DD`; day/month/year is also accepted and interpreted day first when ambiguous. Add `accepted_units` per batch to calculate cost per acceptable garment. Shipped quantities can be read from shipment records when the batch table omits them.

## Twenty test cases

dist/test-files/ contains 20 synthetic JSON scenarios and scenarios.zip. Select one from Try a built-in case and click Load case, or upload its JSON file. Scenarios cover shared material controls, different causes of the same defect, incomplete inspections, delayed complaints, capacity bottlenecks, cost tradeoffs, weak corrective actions, and missing closure evidence.

## Workflows

- Choose a defect and reference batch; inspect product genealogy and scope rationale.
- Filter the dashboard by factory and exposure classification.
- Add inspections and review customer complaint records.
- Compare defect patterns by machine, material lot, line, thread, shift, and team; record an evidence-backed cause and reviewer.
- Adjust inspection and rework capacity; compare five estimated recovery options when confirmed and related stock quantities are complete. A split shipment shows both the priority release and full completion dates; one inspector is assigned per station.
- Enter prevention, appraisal, internal failure, external failure, recurrence, and reduction assumptions; review COPQ and expected prevention return.
- Maintain containment, CAPA ownership, approval, evidence, and 30/60/90-day verification. Record a corrective action completion date, a separate date and evidence reference for each later check, and post-action inspection evidence. Closure is blocked until required gates pass and the observed defect rate improves without a recorded negative effect.
- Download an HTML report or CSV export calculated from the active file and selected defect focus, including exposure, inspections, cost categories, recovery alternatives, verification checks, CAPA actions, and audit events.

## Validation

    node scripts/validate-data.mjs
    node scripts/validate-scenarios.mjs
    node scripts/validate-local.mjs

The local validation covers all 20 scenarios plus unseen JSON, flat CSV, and multiple related CSV tables. The browser workflow was also checked with the included independent CSV and XLSX examples.

## Operational limits

This is a single-browser local analysis tool. It does not synchronize users, authenticate approvals, store binary evidence, integrate ERP/inspection systems, or optimize a minute-by-minute factory schedule. The recovery model uses stated capacity and cost assumptions. Uploaded files are limited to 20 MB total. Use a database, access control, durable evidence store, and integration services for a multi-user production deployment.
