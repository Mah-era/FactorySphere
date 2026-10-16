import {planningInputs} from './intelligence.js';
const key=s=>String(s).toLowerCase().replace(/[^a-z0-9]/g,'');
const localDay=()=>new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Dhaka'});
const value=(row,...names)=>{const keys=Object.fromEntries(Object.entries(row||{}).map(([k,v])=>[key(k),v]));for(const n of names){const v=keys[key(n)];if(v!==undefined&&v!==null&&v!=='')return v}return undefined};
const str=(v,fallback='')=>v===undefined||v===null?fallback:String(v).trim();
const number=v=>{if(v===undefined||v===null||v==='')return null;const n=Number(String(v).replace(/[$,%\s,]/g,''));return Number.isFinite(n)?n:null};
const arr=(obj,...names)=>{for(const name of names){const v=value(obj,name);if(Array.isArray(v))return v}return []};
const date=v=>{if(!v)return '';if(v instanceof Date&&!Number.isNaN(v.getTime()))return v.toISOString().slice(0,10);const x=String(v).trim();if(/^\d{4}-\d{2}-\d{2}/.test(x))return x.slice(0,10);const m=x.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);if(m){let first=Number(m[1]),second=Number(m[2]);const month=second>12?first:second,day=second>12?second:first;return `${m[3]}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`}return x};
const validDate=x=>/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x+'T12:00:00Z'))&&new Date(x+'T12:00:00Z').toISOString().slice(0,10)===x;
const disposition=v=>{const x=str(v).toLowerCase();if(['fail','failed','reject','rejected','hold','nonconforming','non-conforming'].includes(x))return 'Fail';if(['pass','passed','accept','accepted','approved','release','released'].includes(x))return 'Pass';return str(v,'Unknown')};
const reviewedComplaint=c=>/^(human reviewed|reviewed|approved|confirmed)$/i.test(c.decision);
const activeComplaint=c=>!/^(rejected classification|rejected|dismissed)$/i.test(c.decision);
const flag=v=>v===true||['true','yes','1','required'].includes(str(v).toLowerCase());
const dayDiff=(a,b)=>Math.floor((new Date(a+'T12:00:00Z')-new Date(b+'T12:00:00Z'))/86400000);
export const clone=x=>structuredClone(x);
export const quantity=x=>number(x);

function rowBatch(row,index){
  const id=str(value(row,'id','batch','batch_id','batchid','lot','production_batch'),`BATCH-${index+1}`);
  const units=number(value(row,'units','production_units','production_qty','quantity','batch_quantity'));
  const inventory=number(value(row,'inventory','stock','stock_units','on_hand','onhand','available_units'));
  const shipped=number(value(row,'shipped','shipped_units','delivered_units'));
  const firstPass=number(value(row,'firstPass','first_pass_yield','fpy'));
  return {id,order:str(value(row,'order','order_id','po','purchase_order')),sku:str(value(row,'sku','product_sku','style','style_id')),factory:str(value(row,'factory','factory_id','plant'),'Unspecified'),line:str(value(row,'line','line_id','sewing_line')),machine:str(value(row,'machine','machine_group','machine_id')),team:str(value(row,'team','operator','operator_team')),shift:str(value(row,'shift')),cutting:str(value(row,'cutting','cutting_batch')),sewing:str(value(row,'sewing','sewing_batch')),finishing:str(value(row,'finishing','finishing_batch')),packing:str(value(row,'packing','packing_lot')),fabric:str(value(row,'fabric','fabric_lot','fabriclot')),thread:str(value(row,'thread','thread_lot','threadlot')),trim:str(value(row,'trim','trim_lot','trimlot')),start:date(value(row,'start','start_date','production_start')),end:date(value(row,'end','end_date','production_end')),units:units??(inventory!==null&&shipped!==null?inventory+shipped:null),accepted:number(value(row,'accepted','acceptable_units','accepted_units','released_units')),inventory,shipped,location:str(value(row,'location','inventory_location')),status:str(value(row,'status'),'Unknown'),firstPass:firstPass!==null&&firstPass<=1?firstPass*100:firstPass,defectRate:number(value(row,'defectRate','defect_rate'))};
}
function rowInspection(row,index){
  const sample=number(value(row,'sample','inspected','inspection_quantity','sample_size','sampled_units'));
  const defects=number(value(row,'defects','defective','defective_quantity','defect_qty','defect_count'));
  const suppliedThreshold=number(value(row,'threshold','acceptance_threshold'));
  const threshold=suppliedThreshold??2.5;
  const suppliedResult=value(row,'disposition','result','inspection_result');
  return {id:str(value(row,'id','inspection_id','record_id'),`INS-${String(index+1).padStart(3,'0')}`),batch:str(value(row,'batch','batch_id','batchid','production_batch')),stage:str(value(row,'stage','inspection_stage','inspection_type'),'Unspecified'),date:date(value(row,'date','inspection_date')),sample,defects,type:str(value(row,'type','defect_type','defect','defect_category'),'Unclassified'),location:str(value(row,'location','defect_location')),severity:str(value(row,'severity'),'Major'),threshold,thresholdAssumed:flag(value(row,'thresholdAssumed'))||suppliedThreshold===null,dispositionInferred:flag(value(row,'dispositionInferred'))||suppliedResult===undefined,inspector:str(value(row,'inspector','inspected_by')),operation:str(value(row,'operation','production_operation')),disposition:disposition(suppliedResult??(sample!==null&&defects!==null?(defects/sample*100>threshold?'Fail':'Pass'):'Unknown')),evidence:str(value(row,'evidence','photo','evidence_ref')),notes:str(value(row,'notes','comment','description'))};
}
function rowComplaint(row,index){return {id:str(value(row,'id','complaint_id'),`CMP-${index+1}`),batch:str(value(row,'batch','batch_id')),sku:str(value(row,'sku','product_sku')),customer:str(value(row,'customer','customer_name')),date:date(value(row,'date','complaint_date')),text:str(value(row,'text','description','complaint','failure_description')),category:str(value(row,'category','defect_type','defect')),severity:str(value(row,'severity'),'Unknown'),decision:str(value(row,'decision','review_status'),'Pending review'),reviewer:str(value(row,'reviewer')),reviewEvidence:str(value(row,'reviewEvidence','review_evidence')),cost:number(value(row,'cost','claim_cost','return_cost'))};}
function rowShipment(row,index){return {id:str(value(row,'id','shipment_id'),`SHP-${index+1}`),batch:str(value(row,'batch','batch_id')),units:number(value(row,'units','shipped_units','quantity')),date:date(value(row,'date','ship_date')),status:str(value(row,'status'),'Unknown'),destination:str(value(row,'destination','market')),cutoff:date(value(row,'cutoff','ship_cutoff','shipment_cutoff','due_date'))};}
function rowAction(row,index){const required=value(row,'required');return {id:str(value(row,'id','action_id'),`ACT-${index+1}`),title:str(value(row,'title','action','description')),type:str(value(row,'type'),'Corrective'),owner:str(value(row,'owner','action_owner')),role:str(value(row,'role','function')),accountable:str(value(row,'accountable')),consulted:str(value(row,'consulted')),informed:str(value(row,'informed')),verifier:str(value(row,'verifier')),dependsOn:str(value(row,'dependsOn','dependencies')),due:date(value(row,'due','due_date')),status:str(value(row,'status'),'Open'),evidence:str(value(row,'evidence','evidence_ref')),completedAt:date(value(row,'completedAt','completed_at','implementation_date')),required:required===undefined?true:flag(required)};}

export function normalizeDataset(payload,sourceName='Uploaded file'){
  const source=payload?.data??payload;
  const raw=Array.isArray(source)?{inspections:source}:source;
  if(!raw||typeof raw!=='object')throw new Error('Expected JSON records or a dataset object.');
  const workspace=raw.workspace&&typeof raw.workspace==='object'&&!Array.isArray(raw.workspace)?raw.workspace:{};
  for(const k of ['hypotheses','whys','containment','costLedger','evidenceFiles'])if(workspace[k]!==undefined&&!Array.isArray(workspace[k]))throw new Error('Workspace '+k+' must be an array.');
  for(const k of ['hypotheses','containment','costLedger','evidenceFiles'])if(workspace[k]?.some(r=>!r||typeof r!=='object'||Array.isArray(r)))throw new Error('Workspace '+k+' contains an invalid record.');
  if(Array.isArray(raw.costEntries)&&!workspace.costLedger)workspace.costLedger=raw.costEntries;
  for(const entry of workspace.costLedger||[]){if(!['prevention','appraisal','internal','external'].includes(entry.category)||typeof entry.amount!=='number'||!Number.isFinite(entry.amount)||entry.amount<0)throw new Error('Cost ledger needs valid category and numeric nonnegative amount.');}
  let evidenceBytes=0;for(const file of workspace.evidenceFiles||[]){if(typeof file.dataUrl!=='string'||!/^data:(image\/(png|jpeg|webp)|application\/pdf);base64,[A-Za-z0-9+/=]+$/.test(file.dataUrl))throw new Error('Unsupported evidence attachment encoding.');evidenceBytes+=file.dataUrl.length*0.75;if(file.dataUrl.length*0.75>2*1024*1024+100)throw new Error('Evidence attachment exceeds 2 MB.');}if(evidenceBytes>20*1024*1024+1000)throw new Error('Evidence attachments exceed 20 MB.');
  planningInputs({workspace});
  const warnings=Array.isArray(raw.warnings)?raw.warnings.filter(w=>/^(Production batches were inferred|Batch .+ was inferred)/.test(w)):[];
  const uniqueIds=(rows,label)=>{if(new Set(rows.map(r=>r.id)).size!==rows.length)throw new Error(`${label} IDs must be unique.`)};
  const rawInspections=arr(raw,'inspections','inspection_records','quality_records','records');
  const inspections=rawInspections.map(rowInspection);
  uniqueIds(inspections,'Inspection');
  if(!inspections.length)throw new Error('No inspection records found. Supply inspections or flat rows with sample and defects.');
  for(const i of inspections){if(!i.batch)throw new Error(`Inspection ${i.id} has no batch ID.`);if(i.sample===null||i.defects===null||i.sample<=0||i.defects<0||i.defects>i.sample||!Number.isInteger(i.sample)||!Number.isInteger(i.defects))throw new Error(`Inspection ${i.id} needs valid sample and defective quantities.`);if(i.threshold<0||i.threshold>100)throw new Error(`Inspection ${i.id} has an invalid acceptance threshold.`);if(i.date&&!validDate(i.date))throw new Error(`Inspection ${i.id} has an invalid date. Use YYYY-MM-DD or day/month/year.`)}
  if(inspections.some(i=>!i.date))warnings.push('Undated inspections are excluded from time-based trend and effectiveness verification.');
  if(inspections.some(i=>i.thresholdAssumed&&i.dispositionInferred))warnings.push('Some inspections have no result or acceptance threshold. A 2.5% screening rule flags them for review; it cannot confirm failure. Add an approved threshold or reviewed disposition.');
  let batches=arr(raw,'batches','production_batches','production','garment_batches').map(rowBatch);
  if(!batches.length){
    const grouped=new Map();for(const i of inspections){if(!grouped.has(i.batch))grouped.set(i.batch,[]);grouped.get(i.batch).push(i)}
    batches=[...grouped].map(([id],index)=>{const representative=rawInspections.find(r=>str(value(r,'batch','batch_id','batchid','production_batch'))===id)||{};return rowBatch({...representative,id},index)});
    warnings.push('Production batches were inferred from inspection rows; verify their production attributes.');
  }
  const existing=new Set(batches.map(b=>b.id));
  for(const i of inspections)if(!existing.has(i.batch)){batches.push(rowBatch({id:i.batch},batches.length));existing.add(i.batch);warnings.push(`Batch ${i.batch} was inferred from its inspection.`)}
  if(new Set(batches.map(b=>b.id)).size!==batches.length)throw new Error('Batch IDs must be unique.');
  for(const b of batches){if([b.units,b.accepted,b.inventory,b.shipped].some(v=>v!==null&&v<0))throw new Error(`${b.id}: production, accepted, stock and shipped quantities cannot be negative.`);if(b.accepted!==null&&b.units!==null&&b.accepted>b.units)throw new Error(`${b.id}: accepted units cannot exceed production units.`);if(b.firstPass!==null&&(b.firstPass<0||b.firstPass>100))throw new Error(`${b.id}: first-pass yield must be between 0 and 100%.`);if([b.start,b.end].some(d=>d&&!validDate(d))||b.start&&b.end&&b.end<b.start)throw new Error(`${b.id}: production dates are invalid.`);if(b.units!==null&&b.inventory!==null&&b.shipped!==null&&b.inventory+b.shipped!==b.units)warnings.push(`${b.id}: inventory + shipped differs from total units.`)}
  const complaints=arr(raw,'complaints','customer_complaints','returns').map(rowComplaint);
  const shipments=arr(raw,'shipments','shipment_records').map(rowShipment);
  uniqueIds(complaints,'Complaint');uniqueIds(shipments,'Shipment');
  for(const c of complaints){if(c.date&&!validDate(c.date))throw new Error(`${c.id}: complaint date is invalid.`);if(c.cost!==null&&c.cost<0)throw new Error(`${c.id}: claim cost cannot be negative.`);if(c.batch&&!existing.has(c.batch))warnings.push(`${c.id}: complaint batch ${c.batch} was not found in production records.`)}
  for(const s of shipments){if(s.units!==null&&s.units<0)throw new Error(`${s.id}: shipment quantity cannot be negative.`);if([s.date,s.cutoff].some(d=>d&&!validDate(d)))throw new Error(`${s.id}: shipment date or cut-off is invalid.`)}
  for(const s of shipments)if(s.batch&&!existing.has(s.batch))warnings.push(`${s.id}: shipment batch ${s.batch} was not found in production records.`);
  for(const b of batches)if(b.shipped===null){const actual=shipments.filter(s=>s.batch===b.id&&/^(shipped|delivered|in transit)$/i.test(s.status)&&s.units!==null);if(actual.length)b.shipped=actual.reduce((n,s)=>n+s.units,0)}
  const actions=arr(raw,'actions','capa_actions','corrective_actions').map(rowAction);
  uniqueIds(actions,'Action');
  const products=arr(raw,'products','product_master','styles').map(p=>({sku:str(value(p,'sku','id','style')),name:str(value(p,'name','product_name')),style:str(value(p,'style','description'))}));
  for(const sku of [...new Set(batches.map(b=>b.sku).filter(Boolean))])if(!products.some(p=>p.sku===sku))products.push({sku,name:sku,style:''});
  const orders=arr(raw,'orders','production_orders','purchase_orders').map(o=>({id:str(value(o,'id','order','order_id','po')),customer:str(value(o,'customer','customer_name')),sku:str(value(o,'sku','product_sku')),units:number(value(o,'units','quantity')),due:date(value(o,'due','due_date','shipment_cutoff')),market:str(value(o,'market','destination'))}));
  for(const o of orders)if(o.due&&!validDate(o.due))throw new Error(`${o.id}: order due date is invalid.`);
  for(const o of orders)if(o.units!==null&&o.units<0)throw new Error(`${o.id}: order quantity cannot be negative.`);
  for(const a of actions)if([a.due,a.completedAt].some(d=>d&&!validDate(d)))throw new Error(`${a.id}: action date is invalid.`);
  for(const r of arr(raw,'rework','rework_records'))if(['units','quantity','hours','rework_hours','cost','rework_cost'].some(k=>{const n=number(value(r,k));return n!==null&&n<0}))throw new Error('Rework quantity, hours and cost cannot be negative.');
  const factories=arr(raw,'factories','factory_master').map(f=>({id:str(value(f,'id','factory_id')),name:str(value(f,'name','factory_name'))}));
  for(const id of [...new Set(batches.map(b=>b.factory))])if(!factories.some(f=>f.id===id))factories.push({id,name:id});
  const materials=arr(raw,'materials','material_lots','lots').map(m=>({id:str(value(m,'id','lot_id')),type:str(value(m,'type','material_type')),detail:str(value(m,'detail','description')),supplier:str(value(m,'supplier'))}));
  const rawIncident=raw.incident||{};
  const incident={id:str(rawIncident.id,'INC-LOCAL'),title:str(rawIncident.title,'Quality analysis'),opened:date(rawIncident.opened)||localDay(),severity:str(rawIncident.severity,'Review'),leader:str(rawIncident.leader),stage:str(rawIncident.stage,'Assessment'),hold:flag(rawIncident.hold),shipmentBlock:flag(rawIncident.shipmentBlock),cause:str(rawIncident.cause),causeConfirmed:flag(rawIncident.causeConfirmed),causeEvidence:str(rawIncident.causeEvidence),causeReviewer:str(rawIncident.causeReviewer),approval:flag(rawIncident.approval),verification:{d30:flag(rawIncident.verification?.d30),d60:flag(rawIncident.verification?.d60),d90:flag(rawIncident.verification?.d90)},verificationRecords:Object.fromEntries(['d30','d60','d90'].map(k=>[k,{date:date(rawIncident.verificationRecords?.[k]?.date),evidence:str(rawIncident.verificationRecords?.[k]?.evidence)}])),closed:flag(rawIncident.closed),selectedScenario:str(rawIncident.selectedScenario,'Inspect all related stock + targeted rework').replace(/^Inspect \+ targeted rework$/,'Inspect all related stock + targeted rework'),referenceBatch:str(rawIncident.referenceBatch),defectType:str(rawIncident.defectType)};
  const originalCost=raw.costInputs||raw.costs||{};
  const costInputs={prevention:number(value(originalCost,'prevention','prevention_cost')),appraisal:number(value(originalCost,'appraisal','appraisal_cost')),internal:number(value(originalCost,'internal','internal_failure','internal_failure_cost')),external:number(value(originalCost,'external','external_failure','external_failure_cost')),recurrence:number(value(originalCost,'recurrence','recurrence_probability')),reduction:number(value(originalCost,'reduction','expected_reduction'))};
  const originalCapacity=raw.recoveryInputs||raw.capacity||{};
  const recoveryInputs={inspectors:number(value(originalCapacity,'inspectors'))??4,stations:number(value(originalCapacity,'stations','inspection_stations'))??2,inspectRate:number(value(originalCapacity,'inspectRate','inspection_rate'))??40,reworkLines:number(value(originalCapacity,'reworkLines','rework_lines'))??1,reworkRate:number(value(originalCapacity,'reworkRate','rework_rate'))??240};
  for(const [k,v] of Object.entries(recoveryInputs))if(v<=0)throw new Error(`Recovery capacity ${k} must be greater than zero.`);
  for(const k of ['inspectors','stations','reworkLines'])if(!Number.isInteger(recoveryInputs[k]))throw new Error(`Recovery capacity ${k} must be a whole number.`);
  for(const [k,v] of Object.entries(costInputs))if(v!==null&&(v<0||(['recurrence','reduction'].includes(k)&&v>100)))throw new Error(`Cost input ${k} is outside its valid range.`);
  if(batches.some(b=>b.inventory===null))warnings.push('Some inventory quantities are absent; stock exposure and recovery estimates may be unavailable.');
  if(!shipments.length&&batches.every(b=>b.shipped===null))warnings.push('No shipment records were supplied; customer delivery exposure is unknown.');
  if(Object.values(costInputs).slice(0,4).every(x=>x===null))warnings.push('No complete cost data were supplied; COPQ is shown as partial or unavailable.');
  const audit=arr(raw,'audit'),evidenceEdited=audit.some(x=>/Inspection added|Complaint .* review updated/.test(str(x.event))),groundTruthCleared=!!raw.groundTruthCleared||(evidenceEdited&&!!raw.groundTruth);
  if(groundTruthCleared)warnings.push('Known-answer validation was cleared after local evidence changed.');
  return {workspace,sourceName:str(raw.sourceName,sourceName),loadedAt:str(raw.loadedAt,new Date().toISOString()),updatedAt:str(raw.updatedAt,raw.loadedAt||''),revision:number(raw.revision),scenario:raw.scenario||payload?.scenario||{title:sourceName,description:'Analysis from uploaded file',focus:'Review active quality and exposure signals'},factories,products,orders,materials,batches,processConditions:arr(raw,'processConditions','process_conditions'),fabricRolls:arr(raw,'fabricRolls','fabric_rolls'),rework:arr(raw,'rework','rework_records').map(r=>({id:str(value(r,'id','rework_id')),batch:str(value(r,'batch','batch_id')),operation:str(value(r,'operation')),units:number(value(r,'units','quantity'))??0,hours:number(value(r,'hours','rework_hours'))??0,cost:number(value(r,'cost','rework_cost')),status:str(value(r,'status'))})),groundTruth:groundTruthCleared?null:raw.groundTruth||null,groundTruthCleared,inspections,complaints,shipments,incident,actions,interventions:arr(raw,'interventions','corrective_options'),lessons:arr(raw,'lessons','learning_records'),costInputs,recoveryInputs,audit,postRate:number(raw.postRate),verificationEvidence:str(raw.verificationEvidence),sideEffect:str(raw.sideEffect),warnings};
}

const mean=(sum,count)=>count?sum/count:null;
const sum=(rows,field)=>rows.reduce((n,row)=>n+(quantity(row[field])??0),0);
const addDays=(day,n)=>{const d=new Date((day||new Date().toISOString().slice(0,10))+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+Math.ceil(n));return d.toISOString().slice(0,10)};
const diffDays=(a,b)=>Math.ceil((new Date(a+'T12:00:00Z')-new Date(b+'T12:00:00Z'))/86400000);

export function deriveAnalysis(db,{defect='Auto',referenceBatch='Auto'}={}){
  const groups=new Map();
  for(const i of db.inspections){const g=groups.get(i.type)||{type:i.type,sample:0,defects:0,records:[],batches:new Set(),failed:0};g.sample+=i.sample;g.defects+=i.defects;g.records.push(i);g.batches.add(i.batch);if(i.disposition==='Fail')g.failed++;groups.set(i.type,g)}
  for(const c of db.complaints){if(!c.category||!activeComplaint(c))continue;const g=groups.get(c.category)||{type:c.category,sample:0,defects:0,records:[],batches:new Set(),failed:0};if(c.batch)g.batches.add(c.batch);g.complaints=(g.complaints||0)+1;groups.set(c.category,g)}
  const defects=[...groups.values()].map(g=>({...g,batches:[...g.batches],rate:mean(g.defects*100,g.sample)})).sort((a,b)=>(b.failed*3+b.defects)-(a.failed*3+a.defects));
  const focus=defect!=='Auto'&&groups.has(defect)?defect:db.incident.defectType&&groups.has(db.incident.defectType)?db.incident.defectType:defects[0]?.type||'Unclassified';
  const focusRows=db.inspections.filter(i=>i.type===focus);
  const score=b=>focusRows.filter(i=>i.batch===b.id).reduce((n,i)=>n+i.defects+(i.disposition==='Fail'?i.sample*.1:0),0)+db.complaints.filter(c=>c.batch===b.id&&c.category===focus&&reviewedComplaint(c)).length*10;
  const ref=referenceBatch!=='Auto'?db.batches.find(b=>b.id===referenceBatch):db.batches.find(b=>b.id===db.incident.referenceBatch)||[...db.batches].sort((a,b)=>score(b)-score(a))[0];
  if(!ref)throw new Error('No production batches available.');
  const exposure=db.batches.map(b=>{
    const records=focusRows.filter(i=>i.batch===b.id),complaints=db.complaints.filter(c=>c.batch===b.id&&c.category===focus&&activeComplaint(c));
    const failure=records.some(i=>i.disposition==='Fail'&&!(i.thresholdAssumed&&i.dispositionInferred)),screening=records.some(i=>i.disposition==='Fail'&&i.thresholdAssumed&&i.dispositionInferred),verifiedComplaint=complaints.some(reviewedComplaint),sameContext=!!b.sku&&!!ref.sku&&b.sku===ref.sku&&b.factory!=='Unspecified'&&b.factory===ref.factory,sharedMachine=!!ref.machine&&b.machine===ref.machine,sharedLine=!!ref.line&&b.line===ref.line,sharedFabric=!!ref.fabric&&b.fabric===ref.fabric,sharedThread=!!ref.thread&&b.thread===ref.thread,sharedTrim=!!ref.trim&&b.trim===ref.trim,sharedPacking=!!ref.packing&&b.packing===ref.packing;
    const category=focus.toLowerCase(),packingIssue=/pack|carton/.test(category),materialIssue=/shade|dye|fabric|color/.test(category),trimIssue=/trim|label|zip|button/.test(category);
    const linked=packingIssue?sharedPacking:materialIssue?sharedFabric:trimIssue?(sharedTrim||sharedThread):(sharedMachine||sharedLine||sharedFabric||sharedThread);
    const linkReason=packingIssue?'Shared packing lot; inspect before disposition':materialIssue?'Shared fabric lot; inspect before disposition':trimIssue?'Shared trim or thread lot; inspect before disposition':sharedMachine?'Shared machine group; inspect before disposition':sharedLine?'Shared production line; inspect before disposition':'Shared material lot; passing evidence must be checked';
    let scope='Unrelated',reason='No matching defect or meaningful production link';
    if(b.id===ref.id){scope=failure||verifiedComplaint?'Confirmed':screening||complaints.length?'Precautionary':'Reference';reason=failure?'Failed inspection on reference batch':verifiedComplaint?'Human-reviewed customer complaint':screening?'Screening rate exceeds assumed threshold; verify disposition':complaints.length?'Customer complaint awaits human review':'Selected reference batch; no confirmed failure'}
    else if((failure||verifiedComplaint)&&sameContext){scope='Confirmed';reason=failure?`Failed ${focus} inspection in the same product/factory context`:'Human-reviewed matching customer complaint'}
    else if(failure||verifiedComplaint){scope='Separate signal';reason='Same defect signal but different product or factory; investigate separately'}
    else if(screening&&sameContext){scope='Precautionary';reason='Elevated screening rate; approved disposition required'}
    else if(screening){scope='Separate signal';reason='Elevated screening rate in a different product or factory'}
    else if(complaints.length&&sameContext){scope='Precautionary';reason='Matching customer complaint awaits human review'}
    else if(complaints.length){scope='Separate signal';reason='Unreviewed complaint in a different product or factory; investigate separately'}
    else if(sameContext&&linked){scope='Precautionary';reason=linkReason}
    return {...b,scope,reason,records,complaints,links:{sharedMachine,sharedLine,sharedFabric,sharedThread,sharedTrim,sharedPacking}};
  });
  const confirmed=exposure.filter(b=>b.scope==='Confirmed'),precautionary=exposure.filter(b=>b.scope==='Precautionary');
  const focusSample=sum(focusRows,'sample'),focusDefects=sum(focusRows,'defects');
  const allSample=sum(db.inspections,'sample'),allDefects=sum(db.inspections,'defects');
  const knownStock=confirmed.filter(b=>b.inventory!==null),knownShipped=confirmed.filter(b=>b.shipped!==null);
  const openShipments=db.shipments.filter(s=>!['delivered','shipped','in transit'].includes(s.status.toLowerCase()));
  const scopeIds=new Set([...confirmed,...precautionary].map(b=>b.id));
  const scopeOrders=new Set([...confirmed,...precautionary].map(b=>b.order).filter(Boolean));
  const due=[...openShipments.filter(s=>scopeIds.has(s.batch)).map(s=>s.cutoff),...db.orders.filter(o=>scopeOrders.has(o.id)).map(o=>o.due)].filter(Boolean).sort()[0]||null;
  const costs=db.costInputs,actualInternal=sum(db.rework,'cost'),actualExternal=sum(db.complaints,'cost');
  const ledger=db.workspace?.costLedger||[],ledgerCost=k=>ledger.some(r=>r.category===k)?ledger.filter(r=>r.category===k).reduce((n,r)=>n+r.amount,0):null;
  const costRows=[['Prevention',costs.prevention??ledgerCost('prevention')],['Appraisal',costs.appraisal??ledgerCost('appraisal')],['Internal failure',costs.internal??ledgerCost('internal')??(db.rework.some(r=>r.cost!==null)?actualInternal:null)],['External failure',costs.external??ledgerCost('external')??(db.complaints.some(c=>c.cost!==null)?actualExternal:null)]];
  const knownCost=costRows.filter(([,v])=>v!==null).reduce((n,[,v])=>n+v,0);
  const confidence=focusSample>=400&&confirmed.length>=2?'Moderate':focusSample>=100?'Limited':'Low';
  const alertRecords=focusRows.filter(i=>i.disposition==='Fail').map(i=>i.id);
  const warnings=(db.warnings||[]).filter(w=>!(costRows.some(([,v])=>v!==null)&&w.startsWith('No complete cost data were supplied')));
  if(knownStock.length!==confirmed.length)warnings.push('Confirmed stock exposure is partial because inventory is missing for one or more batches.');
  if(precautionary.some(b=>b.inventory===null))warnings.push('Precautionary stock is incomplete; recovery options are unavailable until related inventory is supplied.');
  if(knownShipped.length!==confirmed.length)warnings.push('Shipped exposure is partial because shipment quantities are missing.');
  const gt=db.groundTruth;
  let validation=null;
  if(gt?.confirmed&&focus===db.incident.defectType&&ref.id===db.incident.referenceBatch){const expected=new Set(gt.confirmed),predicted=new Set(confirmed.map(b=>b.id)),tp=[...expected].filter(x=>predicted.has(x)).length,fp=[...predicted].filter(x=>!expected.has(x)).length,fn=[...expected].filter(x=>!predicted.has(x)).length;validation={precision:tp+fp?tp/(tp+fp):null,recall:tp+fn?tp/(tp+fn):null,missedUnits:exposure.filter(b=>expected.has(b.id)&&!predicted.has(b.id)).reduce((n,b)=>n+(b.units??0),0),falseHoldUnits:exposure.filter(b=>predicted.has(b.id)&&!expected.has(b.id)).reduce((n,b)=>n+(b.inventory??0),0)}}
  return {focus,reference:ref,defects,exposure,confirmed,precautionary,focusRows,focusSample,focusDefects,allSample,allDefects,confirmedStock:knownStock.length?sum(knownStock,'inventory'):null,confirmedShipped:knownShipped.length?sum(knownShipped,'shipped'):null,due,costRows,knownCost,costCoverage:costRows.filter(([,v])=>v!==null).length,confidence,alertRecords,warnings,validation};
}

export function recoveryOptions(db,analysis,inputs=db.recoveryInputs){
  const stock=analysis.confirmedStock,precautionStock=analysis.precautionary.reduce((n,b)=>n+(b.inventory??0),0);
  if(stock===null||stock<=0||[...analysis.confirmed,...analysis.precautionary].some(b=>b.inventory===null)||!analysis.focusSample)return [];
  const defectRate=analysis.focusDefects/analysis.focusSample;
  const inspectorCapacity=Math.min(inputs.inspectors,inputs.stations)*inputs.inspectRate*8;
  const reworkCapacity=inputs.reworkLines*inputs.reworkRate;
  const expectedRework=Math.ceil(stock*defectRate);
  const scenarios=[
    {name:'Inspect all related stock + targeted rework',inspectUnits:stock+precautionStock,reworkUnits:expectedRework,replacementUnits:0},
    {name:'Full-batch rework',inspectUnits:stock,reworkUnits:stock,replacementUnits:0},
    {name:'Sample related stock + targeted rework',inspectUnits:stock+Math.ceil(precautionStock*.1),reworkUnits:expectedRework,replacementUnits:0},
    {name:'Replacement production',inspectUnits:Math.ceil(stock*.1),reworkUnits:0,replacementUnits:stock},
    {name:'Split shipment — priority units first',inspectUnits:stock+Math.ceil(precautionStock*.1),reworkUnits:expectedRework,replacementUnits:0,split:true}
  ];
  return scenarios.map(({name,inspectUnits,reworkUnits,replacementUnits,split=false})=>{
    const inspectionHours=inspectUnits/inputs.inspectRate,inspectionDays=inspectUnits/inspectorCapacity,reworkDays=reworkUnits/reworkCapacity,productionDays=replacementUnits/1100,totalDays=Math.ceil((inspectionDays+reworkDays+productionDays+1)*10)/10;
    const complete=addDays(localDay(),totalDays),delay=analysis.due?Math.max(0,diffDays(complete,analysis.due)):null;
    const firstRelease=split?addDays(localDay(),Math.ceil((inspectionDays*.5+reworkDays*.5+.5)*10)/10):null;
    const cost=Math.round(inspectionHours*15+reworkUnits*2.6+replacementUnits*6+(delay??0)*900+(split?250:0));
    return {name,inspectUnits,reworkUnits,replacementUnits,inspectionHours,inspectionDays,reworkDays,productionDays,totalDays,complete,firstRelease,delay,cost,assumptions:'8-hour shifts; one inspector per station; $15/inspection hour; $2.60/rework unit; $6/replacement unit; $900/full-order delay day'+(split?'; $250 extra handling; first release covers priority units only':'')};
  });
}
export function deriveCost(db,analysis){
  const values=Object.fromEntries(analysis.costRows);
  const complete=analysis.costCoverage===4;
  const acceptedKnown=db.batches.every(b=>b.accepted!==null);
  const accepted=db.batches.reduce((n,b)=>n+(b.accepted??0),0);
  const failureCost=values['Internal failure']!==null&&values['External failure']!==null?values['Internal failure']+values['External failure']:null;
  const {recurrence,reduction}=db.costInputs;
  const prevention=values['Prevention'];
  const expectedLoss=failureCost!==null&&recurrence!==null?failureCost*recurrence/100:null;
  const avoided=expectedLoss!==null&&reduction!==null?expectedLoss*reduction/100:null;
  const roi=avoided!==null&&prevention!==null&&prevention>0?(avoided-prevention)/prevention*100:null;
  return {copqPerAccepted:failureCost!==null&&acceptedKnown&&accepted>0?failureCost/accepted:null,known:analysis.costCoverage?analysis.knownCost:null,complete:complete?analysis.knownCost:null,perAccepted:complete&&acceptedKnown&&accepted>0?analysis.knownCost/accepted:null,failureCost,expectedLoss,avoided,roi};
}
export function deriveEffectiveness(db,analysis,today=localDay()){
  const completed=db.actions.filter(a=>a.type.toLowerCase()==='corrective'&&a.status==='Done'&&a.completedAt&&a.evidence&&a.completedAt<=today).map(a=>a.completedAt);
  const implementedAt=completed.sort().at(-1)||null;
  const rows=analysis.focusRows;
  const dated=rows.filter(i=>i.date);
  const baseline=implementedAt?dated.filter(i=>i.date<=implementedAt):dated;
  const post=implementedAt?dated.filter(i=>i.date>implementedAt&&i.date<=today):[];
  const rate=items=>{const sample=sum(items,'sample');return sample?sum(items,'defects')/sample*100:null};
  const checks=Object.fromEntries([['d30',30],['d60',60],['d90',90]].map(([key,days])=>{const record=db.incident.verificationRecords?.[key]||{};const elapsed=implementedAt?dayDiff(today,implementedAt):null;const valid=!!db.incident.verification[key]&&!!record.date&&!!record.evidence&&elapsed>=days&&dayDiff(record.date,implementedAt)>=days&&record.date<=today;return [key,{...record,due:implementedAt?addDays(implementedAt,days):null,valid}]}));
  const baselineRate=rate(baseline),postRate=rate(post),allChecks=Object.values(checks).every(x=>x.valid);
  let decision='Not yet implemented';
  if(implementedAt){
    if(db.sideEffect)decision='New negative effect detected';
    else if(postRate===null||baselineRate===null||sum(post,'sample')<30)decision='Insufficient evidence';
    else if(postRate>=baselineRate)decision='Ineffective — reopen investigation';
    else decision=allChecks?'Effective and ready to standardize':'Partially effective — continue verification';
  }
  return {implementedAt,baseline,post,baselineRate,postRate,checks,allChecks,decision,postSample:sum(post,'sample')};
}
