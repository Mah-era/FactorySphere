import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {seed} from '../dist/data.js';
import {normalizeDataset,deriveAnalysis,recoveryOptions,deriveCost,deriveEffectiveness} from '../dist/analysis-core.js';
import {readDataFiles} from '../dist/file-ingest.js';

const base=normalizeDataset(seed,'seed');
const baseline=deriveAnalysis(base);
assert.deepEqual(baseline.confirmed.map(b=>b.id).sort(),['B-1038','B-1042','B-1044']);
assert.deepEqual(baseline.precautionary.map(b=>b.id),['B-1043']);
assert.equal(baseline.knownCost,14820);
assert.equal(baseline.due,'2026-10-18');
const baselinePlans=recoveryOptions(base,baseline);
assert(baselinePlans[0].inspectUnits>=baseline.confirmedStock+baseline.precautionary[0].inventory);
assert(baselinePlans[2].inspectUnits>=baseline.confirmedStock);
assert(baselinePlans[4].firstRelease<=baselinePlans[4].complete);
const pending=normalizeDataset({batches:[{id:'P-1',sku:'P',factory:'F',units:100,inventory:100}],inspections:[{id:'I-P',batch:'P-1',sample:100,defects:0,type:'Open seam',disposition:'Pass'}],complaints:[{id:'C-P',batch:'P-1',category:'Open seam',decision:'Pending review'}]},'pending.json');
assert.equal(deriveAnalysis(pending).exposure[0].scope,'Precautionary');
pending.complaints[0].decision='Human reviewed';
assert.equal(deriveAnalysis(pending).exposure[0].scope,'Confirmed');
pending.complaints[0].decision='Rejected classification';
assert.equal(deriveAnalysis(pending).exposure[0].scope,'Reference');
const dated=normalizeDataset({...customPlaceholder()},'dated.json');
function customPlaceholder(){return {batches:[{id:'D-1',order:'PO-1',sku:'A',factory:'F',units:100,inventory:100},{id:'D-2',order:'PO-2',sku:'B',factory:'G',units:100,inventory:100}],inspections:[{id:'I-1',batch:'D-1',sample:100,defects:10,type:'Seam',disposition:'Fail'},{id:'I-2',batch:'D-2',sample:100,defects:0,type:'Seam',disposition:'Pass'}],orders:[{id:'PO-1',due:'2026-10-10'},{id:'PO-2',due:'2026-09-01'}]}}
assert.equal(deriveAnalysis(dated).due,'2026-10-10');
assert.throws(()=>normalizeDataset({inspections:[{batch:'B',sample:100,defects:1,type:'Seam'}],capacity:{inspectors:0}},'invalid.json'),/inspectors/);
const effectivenessData=normalizeDataset({
  batches:[{id:'E-1',sku:'E',factory:'F',units:200,accepted_units:190,inventory:150,shipped:50,first_pass_yield:0.9}],
  inspections:[{id:'E-PRE',batch:'E-1',sample:100,defects:10,type:'Seam',date:'2026-05-20',disposition:'Fail'},{id:'E-POST',batch:'E-1',sample:100,defects:2,type:'Seam',date:'2026-09-10',disposition:'Pass'}],
  actions:[{id:'E-A',type:'Corrective',status:'Done',evidence:'setup-log',completedAt:'2026-06-01',required:'false'}],
  incident:{verification:{d30:true,d60:true,d90:true},verificationRecords:{d30:{date:'2026-07-01',evidence:'I-30'},d60:{date:'2026-08-01',evidence:'I-60'},d90:{date:'2026-09-01',evidence:'I-90'}}}
},'effectiveness.json');
assert.equal(effectivenessData.batches[0].firstPass,90);
assert.equal(effectivenessData.batches[0].accepted,190);
assert.equal(effectivenessData.actions[0].required,false);
const effective=deriveEffectiveness(effectivenessData,deriveAnalysis(effectivenessData),'2026-10-15');
assert.equal(effective.decision,'Effective and ready to standardize');
assert.equal(effective.postRate,2);
assert.equal(deriveCost(effectivenessData,deriveAnalysis(effectivenessData)).perAccepted,null);
effectivenessData.incident.verificationRecords.d90.evidence='';
assert.equal(deriveEffectiveness(effectivenessData,deriveAnalysis(effectivenessData),'2026-10-15').decision,'Partially effective — continue verification');
assert.equal(deriveEffectiveness(effectivenessData,deriveAnalysis(effectivenessData),'2026-07-01').allChecks,false);
const shippedFromRecords=normalizeDataset({batches:[{id:'S-1',sku:'S',factory:'F',units:100,inventory:60}],inspections:[{batch:'S-1',sample:50,defects:5,type:'Seam',disposition:'Fail'}],shipments:[{batch:'S-1',units:40,status:'Shipped'}]},'shipment-only.json');
assert.equal(deriveAnalysis(shippedFromRecords).confirmedShipped,40);
const dayFirst=normalizeDataset({inspections:[{batch:'DF-1',sample:50,defects:5,type:'Seam',date:'15/10/2026'}]},'day-first.json');
assert.equal(dayFirst.inspections[0].date,'2026-10-15');
const commaNumbers=normalizeDataset({batches:[{id:'C-1',units:'1,000',inventory:'750',shipped:'250'}],inspections:[{batch:'C-1',sample:'1,000',defects:'100',type:'Seam'}]},'commas.json');
assert.equal(commaNumbers.batches[0].units,1000);
assert.equal(deriveAnalysis(commaNumbers).focusSample,1000);
assert.throws(()=>normalizeDataset({inspections:[{batch:'DF-1',sample:50,defects:5,type:'Seam',date:'31/02/2026'}]},'bad-date.json'),/invalid date/);
assert.throws(()=>normalizeDataset({inspections:[{id:'DUP',batch:'B',sample:10,defects:1},{id:'DUP',batch:'B',sample:10,defects:1}]},'duplicate.json'),/Inspection IDs must be unique/);
assert.throws(()=>normalizeDataset({inspections:[{batch:'B',sample:10,defects:1}],rework:[{batch:'B',cost:-1}]},'negative-rework.json'),/Rework quantity, hours and cost/);
assert.throws(()=>normalizeDataset({batches:[{id:'B',start:'2026-10-16',end:'2026-10-15'}],inspections:[{batch:'B',sample:10,defects:1}]},'bad-production-dates.json'),/production dates/);
const undated=normalizeDataset({batches:[{id:'U-1',sku:'U',factory:'F',inventory:100}],inspections:[{id:'U-PRE',batch:'U-1',sample:100,defects:10,type:'Seam',disposition:'Fail'},{id:'U-POST',batch:'U-1',sample:100,defects:1,type:'Seam',date:'2026-09-01',disposition:'Pass'}],actions:[{id:'U-A',type:'Corrective',status:'Done',evidence:'E',completedAt:'2026-08-01'}]},'undated.json');
assert.equal(undated.inspections[0].date,'');
assert.equal(deriveEffectiveness(undated,deriveAnalysis(undated),'2026-10-15').decision,'Insufficient evidence');
const partialStock=normalizeDataset({batches:[{id:'P-1',sku:'P',factory:'F',inventory:100},{id:'P-2',sku:'P',factory:'F',machine:'M'}],inspections:[{batch:'P-1',sample:100,defects:10,type:'Seam',disposition:'Fail'},{batch:'P-2',sample:100,defects:8,type:'Seam',disposition:'Fail'}]},'partial-stock.json');
assert.equal(recoveryOptions(partialStock,deriveAnalysis(partialStock)).length,0);
const derivedCosts=normalizeDataset({batches:[{id:'COST-1',sku:'C',factory:'F',units:100,accepted:90,inventory:100}],inspections:[{batch:'COST-1',sample:50,defects:5,type:'Seam',disposition:'Fail'}],rework:[{batch:'COST-1',cost:100}],complaints:[{batch:'COST-1',category:'Seam',cost:50}],costInputs:{prevention:20,appraisal:30,recurrence:50,reduction:50}},'derived-costs.json');
const economics=deriveCost(derivedCosts,deriveAnalysis(derivedCosts));
assert.equal(economics.known,200);
assert.equal(economics.perAccepted,200/90);
assert.equal(economics.expectedLoss,75);
assert.equal(economics.avoided,37.5);
assert.equal(economics.roi,87.5);

const custom={
  batches:[
    {batch_id:'Z-1',style:'JACKET-X',factory_id:'F-Z',machine_group:'MG-X',production_qty:1000,on_hand:600,shipped_units:400,fabric_lot:'LOT-X'},
    {batch_id:'Z-2',style:'JACKET-X',factory_id:'F-Z',machine_group:'MG-Y',production_qty:800,on_hand:800,shipped_units:0,fabric_lot:'LOT-X'},
    {batch_id:'Z-3',style:'JACKET-X',factory_id:'F-Z',machine_group:'MG-X',production_qty:500,on_hand:500,shipped_units:0,fabric_lot:'LOT-Y'}
  ],
  inspections:[
    {inspection_id:'Q-1',batch_id:'Z-1',inspection_stage:'Final random',inspection_date:'2026-10-12',sample_size:100,defective_quantity:9,defect_type:'Zip failure',result:'Fail'},
    {inspection_id:'Q-2',batch_id:'Z-2',inspection_stage:'Final random',inspection_date:'2026-10-12',sample_size:100,defective_quantity:1,defect_type:'Zip failure',result:'Pass'},
    {inspection_id:'Q-3',batch_id:'Z-3',inspection_stage:'Final random',inspection_date:'2026-10-13',sample_size:100,defective_quantity:7,defect_type:'Zip failure',result:'Fail'}
  ],
  shipments:[{shipment_id:'S-Z',batch_id:'Z-1',quantity:600,status:'Blocked',ship_cutoff:'2026-10-19'}]
};
const db=normalizeDataset(custom,'unseen-custom.json');
const a=deriveAnalysis(db);
assert.equal(a.focus,'Zip failure');
assert.equal(a.reference.id,'Z-1');
assert.deepEqual(a.confirmed.map(b=>b.id).sort(),['Z-1','Z-3']);
assert.deepEqual(a.precautionary.map(b=>b.id),[]);
assert.equal(a.confirmedStock,1100);
assert.equal(a.confirmedShipped,400);
assert.equal(a.costCoverage,0);
assert.equal(a.validation,null);
assert.equal(recoveryOptions(db,a).length,5);
assert(!JSON.stringify(a).includes('B-1042'));

const csv='batch_id,style,factory_id,machine_group,production_qty,on_hand,shipped_units,inspection_date,inspection_stage,defect_type,sample_size,defective_quantity\nY-1,DRESS-9,F-Y,MG-19,400,300,100,2026-10-11,Final random,Color bleed,80,8\nY-2,DRESS-9,F-Y,MG-20,300,300,0,2026-10-12,Final random,Color bleed,80,1\n';
const flat=await readDataFiles([new File([csv],'outside-scenarios.csv',{type:'text/csv'})]);
const fa=deriveAnalysis(flat);
assert.equal(fa.focus,'Color bleed');
assert.equal(fa.confirmedStock,null);
assert.deepEqual(fa.precautionary.map(b=>b.id),['Y-1']);
assert.equal(fa.precautionary[0].inventory,300);
assert.equal(fa.precautionary[0].shipped,100);
assert.equal(flat.inspections[0].dispositionInferred,true);
assert.equal(normalizeDataset(flat,'reload').inspections[0].dispositionInferred,true);
assert(normalizeDataset(flat,'reload').warnings.some(w=>w.startsWith('Production batches were inferred')));
flat.inspections[0].dispositionInferred=false;
flat.inspections[0].evidence='Reviewed inspection record';
assert.deepEqual(deriveAnalysis(flat).confirmed.map(b=>b.id),['Y-1']);
assert.equal(flat.batches[0].sku,'DRESS-9');
assert.equal(flat.batches[0].machine,'MG-19');
assert.equal(flat.costInputs.prevention,null);

const batches='batch_id,style,factory_id,machine_group,units,inventory,shipped\nM-1,HOODIE-3,F-M,MG-2,700,700,0\n';
const inspections='inspection_id,batch_id,inspection_stage,sample_size,defective_quantity,defect_type\nI-M,M-1,End-line,100,11,Puckering\n';
const joined=await readDataFiles([new File([batches],'batches.csv'),new File([inspections],'inspections.csv')]);
assert.equal(deriveAnalysis(joined).focus,'Puckering');
assert.equal(joined.batches[0].inventory,700);
const bare=normalizeDataset({inspections:[{batch:'ONLY-SAMPLE',sample:100,defects:5,type:'Seam'}]},'bare.json');
assert.equal(bare.batches[0].units,null);
const costFile='category,amount\nPrevention,10\nAppraisal,20\nInternal failure,30\nExternal failure,40\n';
const related=await readDataFiles([new File([batches],'batches.csv'),new File([inspections],'inspections.csv'),new File([costFile],'costs.csv')]);
assert.equal(deriveCost(related,deriveAnalysis(related)).known,100);
const incompleteCosts=await readDataFiles([new File([batches],'batches.csv'),new File([inspections],'inspections.csv'),new File(['Cost category,Amount\nPrevention,\nAppraisal,20\n'],'quality-costs.csv')]);
assert.equal(incompleteCosts.costInputs.prevention,null);
assert.equal(incompleteCosts.costInputs.appraisal,20);

const cases=JSON.parse(readFileSync(new URL('../dist/test-files/index.json',import.meta.url),'utf8'));
assert.equal(cases.length,20);
for(const c of cases){
  const dataset=JSON.parse(readFileSync(new URL('../dist/test-files/'+c.file,import.meta.url),'utf8'));
  const normalized=normalizeDataset(dataset,c.file);
  const outcome=deriveAnalysis(normalized);
  assert(outcome.exposure.length>0,c.file);
}
function fixture(name){return normalizeDataset(JSON.parse(readFileSync(new URL('../dist/test-files/'+name+'.json',import.meta.url),'utf8')),name)}
const measurement=fixture('09-measurement-deviation');
const measurementOutcome=deriveAnalysis(measurement);
assert.equal(measurementOutcome.focus,'Measurement deviation');
assert.equal(measurementOutcome.reference.id,'B-1046');
assert.equal(measurementOutcome.confirmedStock,2100);
assert.equal(measurementOutcome.costCoverage,0);
assert.equal(measurement.actions.length,0);
assert.equal(deriveAnalysis(fixture('11-packing-after-shipment')).focus,'Packing error');
const packing=fixture('11-packing-after-shipment');
assert.equal(deriveAnalysis(packing).confirmed.length,0);
packing.complaints[0].decision='Human reviewed';
assert.deepEqual(deriveAnalysis(packing).confirmed.map(b=>b.id),['B-1038']);
assert.equal(deriveAnalysis(packing).precautionary.length,0);
assert.equal(recoveryOptions(packing,deriveAnalysis(packing)).length,0);
assert.equal(deriveEffectiveness(fixture('20-evidence-gate'),deriveAnalysis(fixture('20-evidence-gate')),'2026-10-15').allChecks,false);
assert(recoveryOptions(fixture('13-inspector-shortage'),deriveAnalysis(fixture('13-inspector-shortage')))[0].totalDays>recoveryOptions(base,baseline)[0].totalDays);
assert(deriveAnalysis(fixture('16-inspection-cost-exceeds-loss')).knownCost>baseline.knownCost);
console.log('Passed local analysis: baseline, 20 scenarios, distinct focus/cost/capacity cases, unseen JSON, flat CSV, multi-table CSV.');
