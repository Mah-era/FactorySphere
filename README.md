# Garment Quality Intelligence

A working, private browser demo for apparel quality traceability, recovery, COPQ and corrective action. It uses synthetic records with a planted MG-7 seam failure and a shared-material control batch.

## Run locally

```sh
python3 -m http.server 8765 --directory dist
```

Open `http://localhost:8765`. The app has no build step. Edits are saved in the current browser's local storage. **Reset demo** restores the supplied test data.

## Included workflows

- Follow complaints and failed inspections through SKU, order, production, operation, machine, team, material lot, fabric roll, packing, inventory and shipment.
- Record inspections across incoming, in-line, end-line, finishing, final, pre-shipment and warehouse stages. Defect rates and exposure update when a record is saved.
- Review volume-adjusted alerts, Pareto counts, customer complaint classification, and confirmed versus precautionary scope.
- Investigate with evidence comparisons, 5 Whys, fishbone categories, a reviewer and a cause-verification gate.
- Compare inspection, rework, sampling, replacement and split-shipment recovery options using adjustable capacity and cut-off dates.
- Change COPQ and recurrence assumptions to see expected loss, avoided loss, ROI and payback.
- Assign CAPA actions with owners, deadlines, evidence, management approval, audit entries and closure gates.
- Record 30/60/90-day effectiveness checks, adverse effects, lessons and validation metrics against planted ground truth.

## Test data and validation

Run `node scripts/validate-data.mjs` to check relationships and the planted control cases. The Learning page reports batch-tracing precision, recall, missed affected units and false hold units against `seed.groundTruth`. The expected initial classification is confirmed `B-1042`, `B-1044`, `B-1038`; precautionary `B-1043`; unrelated `B-1045`, `B-1046`.

## Demo boundaries

This is a client-side demonstration. It does not share records across users, securely enforce roles, store uploaded evidence, connect factory systems, or run a production optimizer. Evidence references and approval checks model the workflow; they are not authenticated signatures. Scheduling and cost use explicit editable assumptions rather than a full shop-floor capacity model. A production rollout needs a server database, identity and role enforcement, immutable audit history, file storage, and integration with ERP, inspection, and logistics systems.
