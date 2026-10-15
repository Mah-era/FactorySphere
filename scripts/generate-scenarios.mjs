import {seed} from '../dist/data.js';
import {mkdir, writeFile} from 'node:fs/promises';
import {join} from 'node:path';

const out=new URL('../dist/test-files/',import.meta.url);
await mkdir(out,{recursive:true});
const clone=x=>structuredClone(x);
const addInspection=(d,{id,batch,type='Open seam',stage='Final random',sample=200,defects=12,location='Side seam',notes=''})=>d.inspections.unshift({id,batch,stage,date:'2026-10-14',sample,defects,type,location,severity:'Major',threshold:2.5,inspector:'Scenario QA',operation:'Scenario test',disposition:defects/sample*100>2.5?'Fail':'Pass',evidence:`Synthetic evidence ${id}`,notes});
const setDistinctIncident=(d,{id,title,type,batch})=>{
  d.incident={id,title,opened:'2026-10-14',severity:'High',leader:'Scenario quality lead',stage:'Assessment',hold:false,shipmentBlock:false,cause:'',causeConfirmed:false,approval:false,verification:{d30:false,d60:false,d90:false},closed:false,selectedScenario:'Inspect + targeted rework',referenceBatch:batch,defectType:type};
  d.costInputs={prevention:null,appraisal:null,internal:null,external:null,recurrence:null,reduction:null};
  d.actions=[];d.interventions=[];d.lessons=[];d.rework=[];d.complaints=[];d.groundTruth={confirmed:[batch]};
};
const scenarios=[
  ['01-baseline-seam','Baseline seam failure','Original MG-7 seam defect and late complaint','Trace confirmed and precautionary scope',d=>{}],
  ['02-shared-material-control','Shared material control','B-1043 shares fabric and thread but performs well on MG-3','Avoid false containment from shared lot alone',d=>{let i=d.inspections.find(x=>x.id==='INS-604');i.sample=400;i.defects=1;d.batches.find(x=>x.id==='B-1043').defectRate=.25}],
  ['03-cross-lot-machine','Cross-lot machine pattern','MG-7 fails on two different fabric and thread combinations','Prioritize machine hypothesis over material',d=>{let i=d.inspections.find(x=>x.id==='INS-613');i.defects=18;d.batches.find(x=>x.id==='B-1044').defectRate=9}],
  ['04-late-customer-complaint','Late customer complaint','An additional complaint arrives after B-1038 delivery','Extend exposure to already shipped units',d=>{d.complaints.unshift({id:'CMP-209',batch:'B-1038',sku:'ST-204',customer:'Northline Retail',date:'2026-10-14',text:'Side seam burst in use after purchase.',category:'Open seam',severity:'High',decision:'Pending review',cost:880})}],
  ['05-missing-endline-data','Missing end-line data','B-1044 inspection result is missing despite a planted defect','Measure missed affected units and recall',d=>{d.inspections=d.inspections.filter(x=>x.id!=='INS-613');d.batches.find(x=>x.id==='B-1044').status='Monitor'}],
  ['06-same-defect-different-cause','Same defect, different cause','A knit tee has an open seam caused by an unrelated thread snag','Challenge cross-case alert precision',d=>{addInspection(d,{id:'INS-630',batch:'B-1045',location:'Shoulder seam',defects:15,notes:'Independent thread snag at F-02; not MG-7'});d.groundTruth.unrelated=['B-1045','B-1046']}],
  ['07-night-shift-change','Night shift change','A night-shift batch fails after machine reassignment','Compare shift, machine and operator explanations',d=>{d.batches.find(x=>x.id==='B-1044').machine='MG-8';d.processConditions.find(x=>x.batch==='B-1044').machine='MG-8'}],
  ['08-shade-cluster','Fabric shade cluster','Shade variation clusters on the shared fabric lot','Separate material defect from seam incident',d=>{setDistinctIncident(d,{id:'INC-008',title:'Fabric shade variation',type:'Shade variation',batch:'B-1043'});addInspection(d,{id:'INS-631',batch:'B-1043',type:'Shade variation',location:'Front panel',defects:11})}],
  ['09-measurement-deviation','Measurement deviation','A trouser batch fails waistband measurement','Surface a distinct factory and operation signal',d=>{setDistinctIncident(d,{id:'INC-009',title:'Waistband measurement deviation',type:'Measurement deviation',batch:'B-1046'});addInspection(d,{id:'INS-632',batch:'B-1046',type:'Measurement deviation',location:'Waistband',defects:14})}],
  ['10-critical-label','Critical label error','Wrong care labels appear on finished shirts','Test critical classification and shipment hold',d=>{setDistinctIncident(d,{id:'INC-010',title:'Incorrect care label',type:'Incorrect label',batch:'B-1044'});addInspection(d,{id:'INS-633',batch:'B-1044',type:'Incorrect label',stage:'Warehouse',location:'Care label',defects:18});d.inspections[0].severity='Critical'}],
  ['11-packing-after-shipment','Packing complaint after shipment','Customer feedback reports a size assortment error','Connect post-shipment quality to packing lot',d=>{setDistinctIncident(d,{id:'INC-011',title:'Packing error after shipment',type:'Packing error',batch:'B-1038'});d.complaints.push({id:'CMP-210',batch:'B-1038',sku:'ST-204',customer:'Northline Retail',date:'2026-10-14',text:'Carton contained mixed sizes and wrong packing slip.',category:'Packing error',severity:'High',decision:'Pending review',cost:740})}],
  ['12-trim-supplier-issue','Trim supplier issue','Buttons and labels from a trim lot fail incoming review','Flag supplier corrective action separately',d=>{setDistinctIncident(d,{id:'INC-012',title:'Trim and label failure',type:'Incorrect label',batch:'B-1043'});addInspection(d,{id:'INS-634',batch:'B-1043',type:'Incorrect label',stage:'Incoming material',location:'Trim lot TRM-033',defects:10})}],
  ['13-inspector-shortage','Inspector shortage','Only one inspector is available for containment','Recalculate recovery feasibility and delay',d=>{d.recoveryInputs={inspectors:1,stations:1,inspectRate:40,reworkLines:1,reworkRate:240}}],
  ['14-rework-bottleneck','Rework bottleneck','Approved line can repair only 55 units per day','Expose rework-driven shipment delay',d=>{d.recoveryInputs={inspectors:4,stations:2,inspectRate:40,reworkLines:1,reworkRate:55}}],
  ['15-inspection-handling-risk','Inspection handling risk','Extra handling cost and slower inspection raise containment cost','Compare full inspection with selective sampling',d=>{d.recoveryInputs={inspectors:3,stations:2,inspectRate:24,reworkLines:1,reworkRate:240};d.costInputs={prevention:1900,appraisal:7200,internal:5480,external:4240,recurrence:35,reduction:74}}],
  ['16-inspection-cost-exceeds-loss','Inspection exceeds expected loss','Appraisal spend exceeds modeled failure exposure','Challenge blanket 100% inspection',d=>{d.costInputs={prevention:1900,appraisal:11000,internal:1400,external:900,recurrence:12,reduction:50}}],
  ['17-negative-prevention-roi','Negative preventive ROI','Low recurrence and low effectiveness make investment unattractive','Show sensitivity and net benefit',d=>{d.costInputs={prevention:4600,appraisal:3200,internal:5480,external:4240,recurrence:5,reduction:20}}],
  ['18-quality-gain-delivery-loss','Quality gain, delivery loss','Defects fall but the approved intervention slows throughput','Require adverse-effect review before standardization',d=>{d.postRate=.8;d.sideEffect='Throughput fell 18%; shipment missed revised cut-off.';d.incident.verification.d30=true;d.verificationEvidence='B-1051/B-1052, 400 samples, 30-day review'}],
  ['19-corrective-action-fails','Corrective action fails','Defect rate rises after the chosen action','Reopen investigation and retain failed assumption',d=>{d.postRate=6.2;d.incident.verification.d30=true;d.verificationEvidence='B-1051/B-1052, 400 samples, 30-day review';d.lessons.push({id:'LES-03',title:'Training alone did not control MG-7',text:'Initial retraining did not reduce the defect rate; inspect machine setup and maintenance handoff.',case:'INC-026',date:'2026-10-14'})}],
  ['20-evidence-gate','Evidence gate blocks closure','Actions are marked done without supporting evidence','Verify closure remains blocked',d=>{d.actions.forEach(a=>{a.status='Done';if(a.id!=='ACT-01')a.evidence=''});d.incident.approval=true;d.incident.causeConfirmed=true;d.incident.causeEvidence='INS-611, INS-613';d.incident.causeReviewer='Factory quality manager';d.incident.verification={d30:true,d60:true,d90:true}}]
];
const manifest=[];
for(const [id,title,description,focus,mutate] of scenarios){
  const data=clone(seed);mutate(data);data.scenario={id,title,description,focus};
  const file=id+'.json';await writeFile(new URL(file,out),JSON.stringify({format:'garment-quality-scenario-v1',scenario:data.scenario,data},null,2)+'\n');
  manifest.push({...data.scenario,file});
}
await writeFile(new URL('index.json',out),JSON.stringify(manifest,null,2)+'\n');
console.log(`Created ${manifest.length} scenario files.`);
