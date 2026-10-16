// Pure decision-support calculations. No browser state or display rounding here.
export const sum = (rows, field) => rows.reduce((n, r) => n + (Number(r[field]) || 0), 0);
export const day = () => new Date().toLocaleDateString('en-CA', {timeZone:'Asia/Dhaka'});
export function interval(defects, sample) {
  if (!(sample > 0)) return null;
  const p = defects / sample, z = 1.96, den = 1 + z*z/sample;
  const center = (p + z*z/(2*sample))/den;
  const margin = z*Math.sqrt(p*(1-p)/sample + z*z/(4*sample*sample))/den;
  return {low:Math.max(0, center-margin)*100, high:Math.min(1, center+margin)*100};
}
export function groupRates(db, rows, field) {
  const batches = new Map(db.batches.map(b=>[b.id,b])), groups = new Map();
  for (const i of rows) {
    const label = String(i[field] || batches.get(i.batch)?.[field] || 'Not supplied');
    const g = groups.get(label) || {label,sample:0,defects:0,records:[],batchIds:new Set()};
    g.sample += i.sample; g.defects += i.defects; g.records.push(i.id); g.batchIds.add(i.batch); groups.set(label,g);
  }
  return [...groups.values()].map(g=>({...g,batchIds:[...g.batchIds],rate:g.defects/g.sample*100,ci:interval(g.defects,g.sample)})).sort((a,b)=>b.rate-a.rate);
}
export function controlSeries(rows) {
  const dated=rows.filter(i=>i.date).sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
  const sample=sum(dated,'sample'), defects=sum(dated,'defects'), mean=sample?defects/sample:0;
  const points=dated.map(i=>{const sigma=Math.sqrt(mean*(1-mean)/i.sample),low=Math.max(0,mean-3*sigma)*100,high=Math.min(1,mean+3*sigma)*100,rate=i.defects/i.sample*100;return {...i,rate,low,high,signal:rate>high||rate<low,limited:i.sample*mean<5||i.sample*(1-mean)<5}});
  return {points,mean:mean*100,sample,defects,provisional:points.length<20,signals:points.filter(p=>p.signal)};
}
export function signalRegister(db,a) {
  const ref=a.reference;
  const ids=new Set(db.batches.filter(b=>b.sku===ref.sku&&b.factory===ref.factory&&(!ref.line||b.line===ref.line)).map(b=>b.id));
  const rows=a.focusRows.filter(i=>ids.has(i.batch));
  const stages=[...new Set(rows.map(i=>i.stage))];
  const stage=stages.sort((x,y)=>rows.filter(i=>i.stage===y).length-rows.filter(i=>i.stage===x).length)[0];
  const control=controlSeries(rows.filter(i=>i.stage===stage));
  const signals=control.signals.map(i=>({title:'Outside statistical limits',severity:'High',where:i.batch,records:[i.id],detail:`${i.rate.toFixed(1)}% vs ${(i.rate>i.high?i.high:i.low).toFixed(1)}% control limit at n=${i.sample}.`,next:'Confirm sample comparability and inspect the process change.',uncertainty:control.provisional?'Provisional limits: fewer than 20 subgroups.':'Limits estimated from the displayed history.'}));
  const fail=a.focusRows.filter(i=>i.disposition==='Fail');
  if(fail.length)signals.push({title:'Inspection exceptions require disposition',severity:fail.some(i=>/critical/i.test(i.severity))?'Critical':'High',where:[...new Set(fail.map(i=>i.batch))].join(', '),records:fail.map(i=>i.id),detail:`${fail.length} failed or screening records for ${a.focus}.`,next:'Review supplied acceptance criteria and verify related stock.',uncertainty:'Screening assumptions do not confirm nonconformance.'});
  const pending=db.complaints.filter(c=>!/^(human reviewed|reviewed|approved|confirmed|rejected classification)$/i.test(c.decision));
  if(pending.length)signals.push({title:'Customer signals await classification review',severity:'Review',where:[...new Set(pending.map(c=>c.batch||'Untraced'))].join(', '),records:pending.map(c=>c.id),detail:`${pending.length} complaint records need a human decision.`,next:'Trace to shipment and review the proposed defect classification.',uncertainty:'Text matching is a suggestion, not verified failure evidence.'});
  const repeats=groupRates(db,a.focusRows,'machine').filter(g=>g.batchIds.length>1&&g.defects>0&&g.label!=='Not supplied');
  for(const g of repeats.slice(0,3))signals.push({title:'Repeated defect across machine-linked batches',severity:'Review',where:g.label,records:g.records,detail:`${g.batchIds.length} batches; ${g.defects}/${g.sample} observed defective units.`,next:'Compare a passing control batch and machine setup records.',uncertainty:'Shared machine is an association; material and method may confound it.'});
  return {signals,control,cohort:`${ref.sku||'Unknown SKU'} · ${ref.factory} · ${ref.line||'all lines'} · ${stage||'no stage'}`};
}
export function profileData(db) {
  const dims=[['Inventory','batches','inventory'],['Shipment quantity','batches','shipped'],['Production volume','batches','units'],['Product / style','batches','sku'],['Machine group','batches','machine'],['Fabric lot','batches','fabric'],['Inspection date','inspections','date'],['Inspection evidence','inspections','evidence'],['Action owner','actions','owner']];
  const coverage=dims.map(([label,table,field])=>{const rows=db[table],known=rows.filter(r=>r[field]!==null&&r[field]!==undefined&&r[field]!=='').length;return {label,known,total:rows.length,percent:rows.length?known/rows.length*100:null}});
  const dates=db.inspections.map(i=>i.date).filter(Boolean).sort();
  const seen=new Set(),duplicates=[];
  for(const i of db.inspections){const key=[i.batch,i.date,i.stage,i.type,i.sample,i.defects].join('|');if(seen.has(key))duplicates.push(i.id);seen.add(key)}
  return {coverage,dates:[dates[0]||null,dates.at(-1)||null],duplicates,undated:db.inspections.filter(i=>!i.date).length,assumed:db.inspections.filter(i=>i.thresholdAssumed).length,unreviewed:db.inspections.filter(i=>i.thresholdAssumed&&i.dispositionInferred).length};
}
export function compareGroups(db,rows,field) {
  const groups=groupRates(db,rows,field).filter(g=>g.label!=='Not supplied');
  if(groups.length<2)return null;
  const high=groups[0],control=groups.at(-1),difference=high.rate-control.rate;
  // Independent binomial approximation, exploratory only; no causal inference.
  const se=Math.sqrt((high.rate/100)*(1-high.rate/100)/high.sample+(control.rate/100)*(1-control.rate/100)/control.sample)*100;
  const low=difference-1.96*se,upper=difference+1.96*se;
  return {high,control,difference,low,upper,adequate:[high,control].every(g=>g.defects>=5&&g.sample-g.defects>=5),conclusion:low>0?'Higher observed rate; verify confounding factors':'Difference is inconclusive at this sample volume'};
}
export function costSensitivity(db,a) {
  const categories=Object.fromEntries(a.costRows),internal=categories['Internal failure'],external=categories['External failure'];
  const failure=internal!==null&&external!==null?internal+external:null;
  const investment=categories['Prevention'],reduction=db.costInputs.reduction;
  const ready=failure!==null&&investment!==null&&reduction!==null;
  return {failure,breakEven:ready&&failure*reduction>0?investment/(failure*reduction/100)*100:null,points:ready?Array.from({length:11},(_,i)=>({probability:i*10,avoided:failure*i/10*reduction/100,net:failure*i/10*reduction/100-investment})):[]};
}
export const PLANNING_DEFAULTS={shiftHours:8,workingDays:5,reinspectionRate:40,packingRate:800,replacementRate:1100,materialLeadDays:2,approvalDays:1,inspectionCost:15,reworkCost:2.6,replacementCost:6,delayCost:900,holdingCost:0.02,samplePercent:10,priorityPercent:50,skillAvailability:100,machineAvailability:100,handlingRisk:0.2,falseNegative:2,falsePositive:1,alternateRate:240,transferDays:1,transferCost:300,scrapCost:1};
export function planningInputs(db) {
  const supplied=db.workspace?.planning||{},result={...PLANNING_DEFAULTS};
  for(const k of Object.keys(result))if(supplied[k]!==undefined){const n=Number(supplied[k]);if(!Number.isFinite(n)||n<0)throw new Error('Invalid planning assumption: '+k);result[k]=n;}
  for(const k of ['shiftHours','reinspectionRate','packingRate','replacementRate','alternateRate','skillAvailability','machineAvailability','samplePercent','priorityPercent'])if(result[k]<=0)throw new Error(k+' must be greater than zero.');
  for(const k of ['skillAvailability','machineAvailability','samplePercent','priorityPercent','handlingRisk','falseNegative','falsePositive'])if(result[k]>100)throw new Error(k+' cannot exceed 100%.');
  if(result.shiftHours>24||![5,6,7].includes(result.workingDays))throw new Error('Invalid shift hours or working-day calendar.');
  return result;
}
function calendarDate(start,workDays,weekDays) {
  const d=new Date(start+'T12:00:00Z');
  let remaining=Math.ceil(workDays),guard=0;
  if(!Number.isFinite(remaining)||remaining>26000)throw new Error('Recovery horizon exceeds 100 years. Check inventory and capacity units.');
  while(remaining>0&&guard++<36500){d.setUTCDate(d.getUTCDate()+1);const w=d.getUTCDay();if(weekDays===7||(weekDays===6?w!==0:w!==0&&w!==6))remaining--}
  return d.toISOString().slice(0,10);
}
export function scheduleRecovery(db,a,options,start=day()) {
  const p=planningInputs(db),c=db.recoveryInputs,stocks=[...a.confirmed,...a.precautionary];
  if(!options.length)return [];
  const confirmedSample=a.focusRows.filter(i=>a.confirmed.some(b=>b.id===i.batch));
  const n=sum(confirmedSample,'sample'),rate=n?sum(confirmedSample,'defects')/n:0;
  const precaution=sum(a.precautionary,'inventory'),stock=a.confirmedStock;
  const availability=p.skillAvailability/100*p.machineAvailability/100;
  const candidates=[...options,{name:'Approved alternate line + transfer',replacementUnits:0,alternate:true},{name:'Reject and remake confirmed stock',replacementUnits:stock,remake:true}];
  return candidates.map((o,index)=>{
    const reworkUnits=index===1?stock:index===3||o.remake?0:Math.ceil(stock*rate);
    const inspectUnits=index===0?stock+precaution:index===1||index===3||o.remake?stock:stock+Math.ceil(precaution*p.samplePercent/100);
    const inspectionHours=inspectUnits/c.inspectRate;
    const inspectDays=inspectionHours/(Math.min(c.inspectors,c.stations)*p.shiftHours);
    const repairDays=reworkUnits/((o.alternate?p.alternateRate:c.reworkLines*c.reworkRate)*availability);
    const replaceDays=o.replacementUnits/(p.replacementRate*availability);
    const reinspectDays=reworkUnits/(Math.min(c.inspectors,c.stations)*p.reinspectionRate*p.shiftHours);
    const packingDays=stock/p.packingRate;
    const stages=[];let cursor=0;
    for(const [name,duration,resource] of [['Approval',p.approvalDays,'Quality manager'],['Transfer to approved line',o.alternate?p.transferDays:0,'Logistics'],['Material availability',o.replacementUnits?p.materialLeadDays:0,'Material supply'],['Replacement production',replaceDays,'Approved production line'],['Inspection / sorting',inspectDays,'Inspectors + stations'],['Rework',repairDays,o.alternate?'Approved alternate line':'Skilled operators + machines'],['Reinspection',reinspectDays,'Inspectors + stations'],['Packing / quality release',packingDays,'Packing team + quality']]){if(duration>0){stages.push({name,resource,start:cursor,end:cursor+duration,duration,startDate:calendarDate(start,cursor,p.workingDays),endDate:calendarDate(start,cursor+duration,p.workingDays)});cursor+=duration}}
    const complete=calendarDate(start,cursor,p.workingDays),delay=a.due?Math.max(0,Math.round((Date.parse(complete)-Date.parse(a.due))/86400000)):null;
    const firstDays=p.approvalDays+(inspectDays+repairDays+reinspectDays+packingDays)*p.priorityPercent/100;
    const firstRelease=index===4?calendarDate(start,firstDays,p.workingDays):null;
    const holdingDays=Math.max(0,(Date.parse(complete)-Date.parse(start))/86400000);
    const costs={inspection:inspectionHours*p.inspectionCost,rework:reworkUnits*p.reworkCost,replacement:o.replacementUnits*p.replacementCost,reinspection:reworkUnits/p.reinspectionRate*p.inspectionCost,delay:(delay??0)*p.delayCost,holding:sum(stocks,'inventory')*holdingDays*p.holdingCost,handling:index===4?250:0,transfer:o.alternate?p.transferCost:0,scrap:o.remake?stock*p.scrapCost:0};
    const relatedInspected=index===0?precaution:index===2||index===4||o.alternate?Math.ceil(precaution*p.samplePercent/100):0,untested=precaution-relatedInspected;
    return {...o,inspectUnits,reworkUnits,inspectionHours,inspectionDays:inspectDays,reworkDays:repairDays,productionDays:replaceDays,totalDays:cursor,complete,delay,firstRelease,stages,costs,cost:Object.values(costs).reduce((x,y)=>x+y,0),priorityUnits:index===4?Math.floor(stock*p.priorityPercent/100):stock,unitsBeforeCutoff:!a.due?null:complete<=a.due?stock:firstRelease&&firstRelease<=a.due?Math.floor(stock*p.priorityPercent/100):0,untestedRelated:untested,expectedMissed:Math.ceil(inspectUnits*rate*p.falseNegative/100),expectedFalseHold:Math.ceil(inspectUnits*(1-rate)*p.falsePositive/100),handlingUnits:Math.ceil(inspectUnits*p.handlingRisk/100),basisSample:n,basisRate:rate*100,assumptions:`${p.shiftHours} hour shifts; ${p.workingDays} workdays/week; sequential resource allocation; ${p.skillAvailability}% skill and ${p.machineAvailability}% machine availability. Rates and risk inputs are planning assumptions. Split shipments use a proportional priority-lot estimate.`,feasible:availability>0&&Number.isFinite(cursor),onTime:delay===null?null:delay===0};
  });
}
export function actionBlockers(db,action) {
  const dependencies=String(action.dependsOn||'').split(',').map(s=>s.trim()).filter(Boolean);
  return dependencies.filter(id=>!db.actions.some(a=>a.id===id&&a.status==='Done'&&a.evidence&&a.completedAt));
}
export function governanceGates(db,today=day()) {
  const g=db.workspace?.governance||{},required=db.actions.filter(a=>a.required);
  return [
    ['Named incident leader',!!db.incident.leader],
    ['Recorded approver and approval evidence',!!db.incident.approval&&!!g.approver&&!!g.approvalEvidence&&!!g.approvalDate&&g.approvalDate<=today],
    ['Action ownership, accountability, verification and dependencies',required.length>0&&required.every(a=>a.owner&&a.accountable&&a.verifier&&a.status==='Done'&&a.evidence&&a.completedAt&&a.completedAt<=today&&!actionBlockers(db,a).length)],
    ['Independent effectiveness reviewer',!!g.verifier&&g.verifier!==db.incident.causeReviewer],
    ['Verification cohort and outcome reviewed',!!g.comparisonEvidence&&g.verificationDecision==='Accepted']
  ];
}
export function suggestClassification(text) {
  const rules=[['Open seam',/seam.*(open|apart|split)|came apart|opened.*seam/i],['Broken stitch',/broken stitch|stitch.*break/i],['Skipped stitch',/skip.*stitch/i],['Puckering',/pucker|wrinkl/i],['Shade variation',/shade|color.*(different|vary)|colour/i],['Measurement deviation',/size|measure|too (small|large|short)/i],['Incorrect label',/label|tag/i],['Packing error',/pack|carton/i],['Fabric hole',/hole|tear/i],['Stain',/stain|spot/i],['Trimming problem',/loose thread|trimm/i]];
  return rules.filter(([,pattern])=>pattern.test(text||'')).map(([label])=>label);
}
export function comparableEffect(db,a,effect) {
  const ref=a.reference,known=ref.sku&&ref.factory&&ref.factory!=='Unspecified'&&ref.line,ids=new Set(db.batches.filter(b=>known&&b.sku===ref.sku&&b.factory===ref.factory&&b.line===ref.line).map(b=>b.id));
  const before=effect.baseline.filter(i=>ids.has(i.batch)),after=effect.post.filter(i=>ids.has(i.batch));
  const stages=new Set(before.map(i=>i.stage).filter(s=>after.some(i=>i.stage===s)));
  const pre=before.filter(i=>stages.has(i.stage)),post=after.filter(i=>stages.has(i.stage));
  const measure=rows=>({sample:sum(rows,'sample'),defects:sum(rows,'defects'),rate:sum(rows,'sample')?sum(rows,'defects')/sum(rows,'sample')*100:null,ci:interval(sum(rows,'defects'),sum(rows,'sample'))});
  const baseline=measure(pre),followup=measure(post);
  return {baseline,followup,stages:[...stages],reduction:baseline.rate>0&&followup.rate!==null?(baseline.rate-followup.rate)/baseline.rate*100:null,conclusive:!!baseline.ci&&!!followup.ci&&followup.ci.high<baseline.ci.low,comparable:pre.length>0&&post.length>0};
}

export function operatingMetrics(db,a) {
  const cells=new Map();
  for(const i of a.focusRows){const batch=db.batches.find(b=>b.id===i.batch),line=batch?.line||'Unspecified line',operation=i.operation||i.stage||'Unspecified operation',key=line+'|'+operation;const cell=cells.get(key)||{line,operation,sample:0,defects:0,weighted:0,records:[]};cell.sample+=i.sample;cell.defects+=i.defects;cell.weighted+=i.defects*(/critical/i.test(i.severity)?9:/major|high/i.test(i.severity)?3:1);cell.records.push(i.id);cells.set(key,cell);}
  const rateCells=[...cells.values()].map(c=>({...c,rate:c.defects/c.sample*100,severityPoints:c.weighted/c.sample*100}));
  const dates=a.focusRows.map(i=>i.date).filter(Boolean).sort(),last=dates.at(-1),recent=a.focusRows.filter(i=>i.date===last),previous=a.focusRows.filter(i=>i.date&&i.date<last);
  const rate=items=>sum(items,'sample')?sum(items,'defects')/sum(items,'sample')*100:null;
  return {cells:rateCells,lines:[...new Set(rateCells.map(c=>c.line))],operations:[...new Set(rateCells.map(c=>c.operation))],latestDate:last||null,latestRate:rate(recent),priorRate:rate(previous),newTypes:db.inspections.filter(i=>i.date===last&&i.defects>0&&!db.inspections.some(j=>j.type===i.type&&j.date&&j.date<last)).map(i=>({type:i.type,record:i.id}))};
}

export function ledgerSummary(db,field){
  const groups=new Map();
  for(const entry of db.workspace?.costLedger||[]){const label=entry[field]||'Unallocated',g=groups.get(label)||{label,qualityCost:0,copq:0,records:0};g.qualityCost+=entry.amount;g.copq+=['internal','external'].includes(entry.category)?entry.amount:0;g.records++;groups.set(label,g);}
  return [...groups.values()].sort((a,b)=>b.qualityCost-a.qualityCost);
}
