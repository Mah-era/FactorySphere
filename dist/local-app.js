import {seed} from './data.js';
import {normalizeDataset,deriveAnalysis,recoveryOptions,deriveCost,deriveEffectiveness,quantity} from './analysis-core.js';
import {readDataFiles,downloadFile} from './file-ingest.js';
import {loadDataset,saveDataset} from './local-store.js';
import {scheduleRecovery,governanceGates,actionBlockers,planningInputs,comparableEffect} from './intelligence.js';
import {shellPage,overviewPage,intelligencePanels,dataPage,customersPage,containmentPage} from './presentation.js';
import {handleWorkspaceForm,analyticalReport} from './workspace-actions.js';

const KEY='garment-quality-local-v2';
const $=s=>document.querySelector(s);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>n===null||n===undefined||!Number.isFinite(Number(n))?'—':Math.round(Number(n)).toLocaleString();
const pct=n=>n===null||n===undefined||!Number.isFinite(Number(n))?'—':(Math.round(Number(n)*10)/10)+'%';
const money=n=>n===null||n===undefined||!Number.isFinite(Number(n))?'—':'$'+Math.round(Number(n)).toLocaleString();
const money2=n=>n===null||n===undefined||!Number.isFinite(Number(n))?'—':'$'+Number(n).toFixed(2);
const today=()=>new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Dhaka'});
let db=normalizeDataset(seed,'Built-in synthetic case');
let loadToken=0;
let view='overview',focusDefect='Auto',referenceBatch='Auto',selectedBatch=db.batches[0]?.id,scopeFilter='All',factoryFilter='All',stageFilter='All',selectedRecovery='Inspect all related stock + targeted rework',manifest=[],selectedFixture='',notification='',loadState=null,storageWarning='';
const channel=typeof BroadcastChannel==='function'?new BroadcastChannel('garment-quality-local-sync'):null;
let writeQueue=Promise.resolve();
const revisionOf=x=>Number(x?.revision)||Date.parse(x?.updatedAt||x?.loadedAt||'')*1000||0;
async function latestSaved(){
  let indexed=null,local=null;
  try{indexed=await loadDataset()}catch{}
  try{local=JSON.parse(localStorage.getItem(KEY))}catch{}
  return revisionOf(local)>revisionOf(indexed)?local:indexed||local;
}
let pendingWrites=0;
function saveIndicator(text){const el=document.querySelector('#save-indicator');if(el)el.textContent=text}
const save=async()=>{
  db.updatedAt=new Date().toISOString();
  db.revision=Math.max(Date.now()*1000+Math.floor(Math.random()*1000),revisionOf(db)+1);
  const snapshot=structuredClone(db);
  let localStored=false;
  try{localStorage.setItem(KEY,JSON.stringify(snapshot));localStored=true}catch{}
  pendingWrites++;saveIndicator('Saving…');
  writeQueue=writeQueue.catch(()=>{}).then(async()=>{
    try{
      if(revisionOf(await latestSaved())>snapshot.revision)return;
      let stored=localStored;
      try{await saveDataset(snapshot);stored=true}catch{}
      storageWarning=stored?'':'Browser storage is unavailable. Export a workspace snapshot before leaving.';
      if(stored)channel?.postMessage({type:'dataset-updated'});
    }finally{pendingWrites--;saveIndicator(storageWarning?'Not saved':pendingWrites?'Saving…':'Saved locally')}
  });
  return writeQueue;
};
window.addEventListener('beforeunload',event=>{if(pendingWrites){event.preventDefault();event.returnValue=''}});

const model=()=>deriveAnalysis(db,{defect:focusDefect,referenceBatch});
const plansFor=a=>scheduleRecovery(db,a,recoveryOptions(db,a));
async function checkBuild(){
  if(loadState?.kind==='loading')return;
  try{const current=new URL(document.querySelector('script[src*="local-app.js"]').src).searchParams.get('v');const response=await fetch('./index.html',{cache:'no-store'});if(!response.ok)return;const latest=(await response.text()).match(/local-app\.js\?v=([^"'\s]+)/)?.[1];if(latest&&current&&latest!==current)location.reload()}catch{}
}
function closureGates(a){const required=db.actions.filter(x=>x.required),missing=required.filter(x=>x.status!=='Done'||!x.evidence),effect=deriveEffectiveness(db,a,today());return {effect,gates:[['Containment recorded',db.incident.hold||db.incident.shipmentBlock],['Cause evidence and reviewer',db.incident.causeConfirmed&&!!db.incident.causeEvidence&&!!db.incident.causeReviewer],['Management approval',db.incident.approval],['Required actions done with evidence',!missing.length&&required.length>0],['30/60/90 checks dated and evidenced',effect.allChecks],['Effectiveness shown by follow-up inspection',effect.decision==='Effective and ready to standardize'],...governanceGates(db),['Comparable before/after evidence',comparableEffect(db,a,effect).comparable]]}}
const status=(label,tone)=>`<span class="status ${tone||({Confirmed:'red',Precautionary:'amber','Separate signal':'blue',Unrelated:'gray',Reference:'blue',Fail:'red',Pass:'green',Done:'green',Open:'amber'}[label]||'gray')}"><span class="dot"></span>${esc(label)}</span>`;
const button=(text,action,style='')=>`<button class="btn ${style}" data-action="${action}">${text}</button>`;
const card=(title,desc,body,extra='')=>`<section class="card pad"><div class="card-head"><div><h2>${esc(title)}</h2>${desc?`<p>${esc(desc)}</p>`:''}</div>${extra}</div>${body}</section>`;
const metric=(title,value,sub,tone='')=>`<div class="card metric ${tone}"><div class="label">${esc(title)}</div><div class="value">${esc(value)}</div><div class="sub">${esc(sub)}</div></div>`;
const head=(kicker,title,subtitle,actions='')=>`<div class="page-head"><div><div class="eyebrow">${esc(kicker)}</div><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div><div class="head-actions">${actions}</div></div>`;
const option=(v,current,label=v)=>`<option value="${esc(v)}" ${v===current?'selected':''}>${esc(label)}</option>`;
const empty=(message)=>`<div class="empty">${esc(message)}</div>`;
const rowHtml=(cells)=>'<tr>'+cells.map(c=>'<td>'+c+'</td>').join('')+'</tr>';
function notice(text){notification=text;let el=$('.toast');if(el)el.remove();el=document.createElement('div');el.className='toast';el.textContent=text;document.body.append(el);setTimeout(()=>el.remove(),4300)}
function shell(page){$('#app').innerHTML=shellPage(db,view,page,model().focus);document.title=view[0].toUpperCase()+view.slice(1)+' · FactorySphere';document.querySelectorAll('.field').forEach((field,i)=>{const label=field.querySelector('label'),input=field.querySelector('input,select,textarea');if(label&&input){input.id||='field-'+i;label.htmlFor=input.id}})}
function focusBar(a){const types=a.defects.map(x=>x.type);return `<section class="card pad focus-bar"><div><div class="eyebrow">Analysis focus</div><p>Choose a defect and reference batch. The exposure engine recalculates every view.</p></div><div class="focus-controls"><div class="field"><label>Defect</label><select id="focus-defect">${option('Auto',focusDefect,'Auto · '+a.focus)}${types.map(t=>option(t,focusDefect)).join('')}</select></div><div class="field"><label>Reference batch</label><select id="focus-batch">${option('Auto',referenceBatch,'Auto · '+a.reference.id)}${db.batches.map(b=>option(b.id,referenceBatch)).join('')}</select></div></div></section>`}
function warningPanel(a){return a.warnings.length?`<div class="alert-banner"><div class="alert-icon">!</div><div><strong>Data completeness affects these results</strong><p>${a.warnings.map(esc).join(' · ')}</p></div></div>`:''}
function loadBanner(){
  if(loadState)return `<div class="alert-banner ${loadState.kind==='error'?'load-error':'load-progress'}" role="status"><div class="alert-icon">${loadState.kind==='error'?'!':'↻'}</div><div><strong>${esc(loadState.title)}</strong><p>${esc(loadState.message)}</p></div></div>`;
  if(storageWarning)return `<div class="alert-banner load-error" role="status"><div class="alert-icon">!</div><div><strong>Current data is not saved for reload</strong><p>${esc(storageWarning)}</p></div></div>`;
  return '';
}
function trace(a){const b=db.batches.find(x=>x.id===selectedBatch)||a.reference,scope=a.exposure.find(x=>x.id===b.id),records=db.inspections.filter(i=>i.batch===b.id),complaints=db.complaints.filter(c=>c.batch===b.id),shipments=db.shipments.filter(s=>s.batch===b.id),rolls=db.fabricRolls.filter(r=>r.batch===b.id),conditions=db.processConditions.filter(p=>p.batch===b.id);let html=head('Product genealogy','Traceability & exposure','Follow the active batch through its production inputs, inspection, inventory, shipment and customer signal.',button('Open dashboard','go-overview'));html+=focusBar(a);html+=`<section class="card pad" style="margin-bottom:17px"><div class="row"><div class="field" style="flex:1"><label>Batch</label><select id="trace-batch">${db.batches.map(x=>option(x.id,b.id)).join('')}</select></div><div class="field" style="flex:1"><label>Scope</label><div>${status(scope?.scope||'Unrelated')}</div></div></div><p class="note">${esc(scope?.reason||'')}</p></section>`;
  const nodes=[['Customer / order',db.orders.find(o=>o.id===b.order)?.customer||'Not supplied',b.order],['Product / SKU',db.products.find(p=>p.sku===b.sku)?.name||b.sku,b.sku],['Factory / line / shift',db.factories.find(f=>f.id===b.factory)?.name||b.factory,[b.line,b.shift].filter(Boolean).join(' · ')],['Fabric / dye lot',b.fabric,db.materials.find(m=>m.id===b.fabric)?.detail],['Thread / trim',b.thread,b.trim],['Cutting / sewing',[b.cutting,b.sewing].filter(Boolean).join(' → '),b.machine],['Team / operation',b.team,b.start&&b.end?b.start+'–'+b.end:''],['Finishing / packing',b.finishing,b.packing],['Stock / location',fmt(b.inventory)+' units',b.location],['Shipped',fmt(b.shipped)+' units',shipments.map(s=>s.id).join(', ')]];
  html+=`<div class="grid wide-left"><div class="grid">${card('Genealogy',b.id+' · '+(b.sku||'SKU unknown'),`<div class="genealogy">${nodes.map(([label,title,detail])=>`<div class="node-row"><div class="node"><small>${esc(label)}</small><strong>${esc(title||'Not supplied')}</strong><span class="note">${esc(detail||'')}</span></div></div>`).join('')}</div>`)}${card('Inspection evidence',records.length+' records',`<div class="table-wrap"><table><thead><tr><th>ID</th><th>Date / stage</th><th>Defect</th><th>Rate</th><th>Result</th></tr></thead><tbody>${records.map(i=>rowHtml([`<strong>${esc(i.id)}</strong>`,esc(i.date+' · '+i.stage),esc(i.type+' · '+i.location),pct(i.defects/i.sample*100),status(i.disposition)])).join('')}</tbody></table></div>${records.length?'':empty('No inspection records for this batch.')}`)}</div><div class="grid">${card('Inventory and shipments','Commercial destination and release state',`<p><strong>${fmt(b.inventory)}</strong> units in stock · <strong>${fmt(b.shipped)}</strong> shipped</p><p class="small">${esc(b.location||'Inventory location not supplied')}</p><div class="mini-list">${shipments.map(s=>`<div class="mini-item"><div class="mini-icon">▣</div><div><strong>${esc(s.id)} · ${fmt(s.units)} units</strong><p>${esc(s.status)} · ${esc(s.destination)} · cut-off ${esc(s.cutoff||'unknown')}</p></div></div>`).join('')||empty('No shipment rows supplied.')}</div>`)}${card('Inputs and process conditions','Material rolls, machines and records',`<div class="mini-list">${rolls.map(r=>`<div class="mini-item"><div class="mini-icon">▧</div><div><strong>${esc(r.id||'Roll')} · ${esc(r.lot||'')}</strong><p>${fmt(r.meters)} metres</p></div></div>`).join('')}${conditions.map(p=>`<div class="mini-item"><div class="mini-icon">⚙</div><div><strong>${esc(p.operation||'Operation')} · ${esc(p.machine||'')}</strong><p>${esc(p.tension||'Condition not supplied')} · ${esc(p.speed||'')} rpm</p></div></div>`).join('')||'<p class="note">No process condition records supplied.</p>'}</div>`)}${card('Customer feedback','Complaints linked to this batch',`<div class="mini-list">${complaints.map(c=>`<div class="mini-item"><div class="mini-icon">✉</div><div><strong>${esc(c.id)} · ${esc(c.category||'Unclassified')}</strong><p>${esc(c.text||'No description')} · ${esc(c.date)}</p></div></div>`).join('')||empty('No complaints linked to this batch.')}</div>`)}</div></div>`;
  return html;
}

function quality(a){
  const stages=[...new Set(db.inspections.map(i=>i.stage))],rows=db.inspections.filter(i=>stageFilter==='All'||i.stage===stageFilter);
  let html=head('Quality signals','Inspection & customer feedback','Stage results, defect evidence, and human-reviewed complaint signals.');
  html+=focusBar(a)+warningPanel(a);
  html+='<div class="grid cols-3">'+metric('Focused defect rate',pct(a.focusSample?a.focusDefects/a.focusSample*100:null),fmt(a.focusDefects)+' / '+fmt(a.focusSample)+' inspected','red')+metric('Failed / screening flags',fmt(a.focusRows.filter(i=>i.disposition==='Fail').length),a.focus+' inspections; screening assumptions need review','amber')+metric('Customer complaints',fmt(db.complaints.filter(c=>c.category===a.focus).length),'Matching classification','blue')+'</div>';
  html+=card('Inspection history','Filter by stage; review screening results with evidence','<div class="field narrow"><label>Stage</label><select id="stage-filter">'+option('All',stageFilter)+stages.map(s=>option(s,stageFilter)).join('')+'</select></div><div class="table-wrap"><table><thead><tr><th>Record</th><th>Batch / stage</th><th>Defect / location</th><th>Inspected</th><th>Defects</th><th>Rate</th><th>Result</th><th>Review with evidence</th></tr></thead><tbody>'+rows.map(i=>rowHtml([esc(i.id+' · '+(i.date||'date unknown')),esc(i.batch+' · '+i.stage),esc(i.type+' · '+i.location),fmt(i.sample),fmt(i.defects),pct(i.defects/i.sample*100),i.thresholdAssumed&&i.dispositionInferred?status('Screening '+i.disposition,'amber'):status(i.disposition),'<select aria-label="Reviewed result for '+esc(i.id)+'" data-review-result="'+esc(i.id)+'">'+['Unknown','Pass','Fail'].map(v=>option(v,i.disposition)).join('')+'</select><input aria-label="Approved threshold for '+esc(i.id)+'" type="number" min="0" max="100" step="any" placeholder="Threshold %" data-review-threshold="'+esc(i.id)+'" value="'+esc(i.thresholdAssumed?'':i.threshold)+'"><input aria-label="Evidence for '+esc(i.id)+'" placeholder="Evidence reference" data-review-evidence="'+esc(i.id)+'" value="'+esc(i.evidence)+'"><button class="btn" data-review-inspection="'+esc(i.id)+'">Review</button>'])).join('')+'</tbody></table></div>');
  html+=card('Customer complaints','Classification needs human review','<div class="table-wrap"><table><thead><tr><th>ID</th><th>Batch / customer</th><th>Description</th><th>Class</th><th>Review</th></tr></thead><tbody>'+db.complaints.map(c=>rowHtml([esc(c.id),esc(c.batch+' · '+c.customer),esc(c.text),esc(c.category||'Unclassified'),'<select data-complaint-review="'+esc(c.id)+'">'+['Pending review','Human reviewed','Rejected classification'].map(v=>option(v,c.decision)).join('')+'</select> <button class="btn" data-save-complaint="'+esc(c.id)+'">Save</button>'] )).join('')+'</tbody></table></div>'+(!db.complaints.length?empty('No customer complaints supplied.'):''));
  html+=card('Record a new inspection','Adds a record to the active local dataset','<form id="inspection-form" class="form-grid"><div class="field"><label>Batch</label><select name="batch" required>'+db.batches.map(b=>option(b.id,'')).join('')+'</select></div><div class="field"><label>Stage</label><select name="stage">'+['Incoming material','In-line','End-line','Finishing','Final random','Pre-shipment','Warehouse'].map(s=>option(s,'')).join('')+'</select></div><div class="field"><label>Defect type</label><input name="type" value="'+esc(a.focus)+'" required></div><div class="field"><label>Location</label><input name="location"></div><div class="field"><label>Inspected units</label><input name="sample" type="number" min="1" required></div><div class="field"><label>Defective units</label><input name="defects" type="number" min="0" required></div><div class="field"><label>Acceptance threshold %</label><input name="threshold" type="number" min="0" max="100" step="any" value="2.5" required></div><div class="field"><label>Inspector</label><input name="inspector"></div><div class="field"><label>Evidence reference</label><input name="evidence"></div><button class="btn primary" type="submit">Save inspection</button></form>');
  return html;
}
function investigation(a){
  const columns=['machine','line','fabric','thread','shift','team'];
  function compare(field){const groups=new Map();for(const i of a.focusRows){const b=db.batches.find(x=>x.id===i.batch);const k=b?.[field]||'Unknown';const g=groups.get(k)||{sample:0,defects:0,records:[]};g.sample+=i.sample;g.defects+=i.defects;g.records.push(i.id);groups.set(k,g)}return [...groups].sort((x,y)=>y[1].defects/y[1].sample-x[1].defects/x[1].sample).map(([k,v])=>rowHtml([esc(k),fmt(v.sample),fmt(v.defects),pct(v.defects/v.sample*100),esc(v.records.join(', '))])).join('')}
  let html=head('Root-cause workspace','Investigate the pattern','Comparisons show associations. A reviewer must confirm the cause with evidence.');
  html+=focusBar(a)+warningPanel(a);
  html+=card('Cause verification','A finding requires a reviewer and supporting record','<form id="cause-form" class="form-grid"><div class="field full"><label>Working or confirmed cause</label><textarea name="cause">'+esc(db.incident.cause)+'</textarea></div><div class="field"><label>Evidence IDs / references</label><input name="causeEvidence" value="'+esc(db.incident.causeEvidence)+'"></div><div class="field"><label>Responsible reviewer</label><input name="causeReviewer" value="'+esc(db.incident.causeReviewer)+'"></div><label class="checkline full"><input type="checkbox" name="causeConfirmed" '+(db.incident.causeConfirmed?'checked':'')+'> Cause confirmed after evidence review</label><button class="btn primary" type="submit">Save finding</button></form>');
  return html;
}
function recovery(a,options){
  let html=head('Capacity-constrained recovery','Recovery & delivery planner','Compare inspection, rework and replacement using the file’s stock and cut-off.');
  html+=warningPanel(a);
  html+=card('Capacity assumptions','Adjust to match available people and lines','<form id="capacity-form" class="form-grid">'+[['inspectors','Inspectors'],['stations','Inspection stations'],['inspectRate','Units per inspector-hour'],['reworkLines','Rework lines'],['reworkRate','Units per line-day']].map(([k,label])=>'<div class="field"><label>'+label+'</label><input type="number" min="1" name="'+k+'" value="'+esc(db.recoveryInputs[k])+'" required></div>').join('')+'<button class="btn primary" type="submit">Recalculate</button></form>');
  if(!options.length)html+=card('Planning unavailable','Complete confirmed and precautionary stock are required',empty('Confirm the affected stock and supply inventory quantities before planning recovery.'));
  return html;
}
function cost(a){
  const c=db.costInputs,economics=deriveCost(db,a);
  let html=head('Cost of poor quality','Quality cost & prevention value','Enter actual cost categories and assumptions to calculate financial outcomes.');
  html+=warningPanel(a);
  html+='<div class="grid cols-4">'+metric('Total cost of quality',money(economics.known),a.costCoverage+'/4 categories recorded','red')+metric('Cost per acceptable garment',money2(economics.perAccepted),'Requires complete costs and accepted units','blue')+metric('Expected avoided loss',money(economics.avoided),'Failure cost × recurrence × reduction','teal')+metric('Prevention ROI',pct(economics.roi),'Expected avoided loss less prevention cost','amber')+'</div>';
  html+=card('Cost categories','Unknown values stay blank; uploaded data never inherits demo costs','<form id="cost-form" class="form-grid">'+[['prevention','Prevention'],['appraisal','Appraisal'],['internal','Internal failure'],['external','External failure'],['recurrence','Recurrence probability %'],['reduction','Expected defect reduction %']].map(([k,label])=>'<div class="field"><label>'+label+'</label><input name="'+k+'" type="number" min="0" step="any" '+(['recurrence','reduction'].includes(k)?'max="100"':'')+' value="'+esc(c[k]??'')+'"></div>').join('')+'<button class="btn primary" type="submit">Update cost model</button></form><p class="note">Known sum can be partial. ROI uses internal and external failure costs, recurrence, reduction and prevention investment. It is withheld when any input is unknown.</p>');

  return html;
}
function capa(a){
  const {gates,effect}=closureGates(a);
  let html=head('Cross-functional execution','CAPA command center','Ownership, evidence, approval and verification gates control closure.');
  html+='<div class="grid cols-3">'+metric('Open actions',fmt(db.actions.filter(x=>x.status!=='Done').length),'All action types','amber')+metric('Overdue actions',fmt(db.actions.filter(x=>x.status!=='Done'&&x.due&&x.due<today()).length),'Compared with local date','red')+metric('Closure gates',gates.filter(x=>x[1]).length+'/'+gates.length,'Evidence required','teal')+'</div>';
  html+=card('Incident control','Record containment and approval','<form id="incident-form" class="form-grid"><div class="field"><label>Incident leader</label><input name="leader" value="'+esc(db.incident.leader)+'"></div><div class="field"><label>Severity</label><select name="severity">'+['Review','Low','Medium','High','Critical'].map(x=>option(x,db.incident.severity)).join('')+'</select></div><label class="checkline"><input type="checkbox" name="hold" '+(db.incident.hold?'checked':'')+'> Production / stock hold</label><label class="checkline"><input type="checkbox" name="shipmentBlock" '+(db.incident.shipmentBlock?'checked':'')+'> Shipment blocked</label><label class="checkline"><input type="checkbox" name="approval" '+(db.incident.approval?'checked':'')+'> Management approval recorded</label><button class="btn primary" type="submit">Save incident</button></form>');
  html+=card('Assigned actions','Edit status and evidence then save the row','<div class="table-wrap"><table><thead><tr><th>Action / owner</th><th>Due</th><th>Status</th><th>Completed</th><th>Evidence</th><th></th></tr></thead><tbody>'+db.actions.map(x=>'<tr><td><strong>'+esc(x.title)+'</strong><br>'+esc(x.owner+' · '+x.role)+'</td><td>'+esc(x.due||'—')+'</td><td><select data-action-status="'+esc(x.id)+'">'+['Open','In progress','Done'].map(s=>option(s,x.status)).join('')+'</select></td><td><input type="date" max="'+today()+'" data-action-completed="'+esc(x.id)+'" value="'+esc(x.completedAt||'')+'"></td><td><input data-action-evidence="'+esc(x.id)+'" value="'+esc(x.evidence)+'"></td><td><button class="btn" data-save-action="'+esc(x.id)+'">Save</button></td></tr>').join('')+'</tbody></table></div>');
  html+=card('Add action','A named owner and evidence are required for closure','<form id="action-form" class="form-grid"><div class="field full"><label>Action</label><input name="title" required></div><div class="field"><label>Type</label><select name="type">'+['Containment','Investigation','Corrective','Preventive'].map(x=>option(x,'')).join('')+'</select></div><div class="field"><label>Owner</label><input name="owner" required></div><div class="field"><label>Due date</label><input type="date" name="due"></div><button class="btn primary" type="submit">Add action</button></form>');
  html+=card('Closure decision','All gates must pass before closure','<p class="small">Effectiveness: '+esc(effect.decision)+'</p>'+gates.map(([label,pass])=>'<div class="checkline">'+status(pass?'Pass':'Missing',pass?'green':'amber')+' '+esc(label)+'</div>').join('')+'<div class="divider"></div>'+button(db.incident.closed?'Reopen case':'Close case',db.incident.closed?'reopen':'close',db.incident.closed?'':'primary'));
  if(db.audit.length)html+=card('Audit trail','Local event history','<div class="timeline">'+db.audit.slice(-12).reverse().map(x=>'<div class="timeline-item"><strong>'+esc(x.event||x.action||'Update')+'</strong><p>'+esc(x.date||x.at||'')+' · '+esc(x.actor||'Local user')+'</p></div>').join('')+'</div>');
  return html;
}
function learning(a){
  const effect=deriveEffectiveness(db,a,today());
  const latest=effect.post.map(i=>i.date).sort().at(-1);
  const recurrenceDays=effect.implementedAt&&latest&&effect.post.every(i=>i.disposition!=='Fail')?Math.max(0,Math.floor((new Date(latest+'T12:00:00Z')-new Date(effect.implementedAt+'T12:00:00Z'))/86400000)):null;
  let html=head('Learning & verification','Effectiveness verification','Compare inspection evidence before and after a documented corrective action.');
  html+='<div class="grid cols-3">'+metric('Baseline rate',pct(effect.baselineRate),fmt(effect.baseline.reduce((n,i)=>n+i.sample,0))+' inspected before implementation','red')+metric('Post-action rate',pct(effect.postRate),effect.implementedAt?fmt(effect.postSample)+' inspected after '+effect.implementedAt:'No evidenced corrective action date','teal')+metric('Observed recurrence-free days',recurrenceDays===null?'—':String(recurrenceDays),latest?'Through '+latest:'Requires dated follow-up inspections','blue')+'</div>';
  html+=card('Effectiveness decision','Indicative comparison; the reviewer confirms final disposition','<p><strong>'+esc(effect.decision)+'</strong></p>'+(db.postRate!==null?'<p class="note">Uploaded post-rate assumption: '+pct(db.postRate)+'. It is not counted as observed evidence.</p>':''));
  const checks=[['d30','30-day check'],['d60','60-day check'],['d90','90-day check']];
  html+=card('30 / 60 / 90-day verification','Each check needs its own eligible date and evidence reference','<form id="verify-form" class="form-grid">'+checks.map(([k,label])=>{const record=db.incident.verificationRecords[k],check=effect.checks[k];return '<div class="field full"><label class="checkline"><input type="checkbox" name="'+k+'" '+(db.incident.verification[k]?'checked':'')+'> '+label+' · due '+esc(check.due||'after implementation')+' · '+(check.valid?'verified':'pending')+'</label></div><div class="field"><label>Check date</label><input type="date" name="'+k+'Date" max="'+today()+'" value="'+esc(record.date)+'"></div><div class="field"><label>Evidence reference</label><input name="'+k+'Evidence" value="'+esc(record.evidence)+'"></div>'}).join('')+'<div class="field full"><label>Overall verification notes</label><input name="verificationEvidence" value="'+esc(db.verificationEvidence)+'"></div><div class="field full"><label>New negative effect, if any</label><input name="sideEffect" value="'+esc(db.sideEffect)+'"></div><button class="btn primary" type="submit">Save verification</button></form>');
  if(a.validation)html+=card('Known-answer validation','Available for unedited synthetic cases with ground truth','<div class="matrix">'+[['Trace precision',pct(a.validation.precision*100)],['Trace recall',pct(a.validation.recall*100)],['Missed affected units',fmt(a.validation.missedUnits)],['False hold units',fmt(a.validation.falseHoldUnits)]].map(([k,v])=>'<div class="cell"><small>'+esc(k)+'</small><strong>'+esc(v)+'</strong></div>').join('')+'</div>');
  html+=card('Case lessons','Keep failed assumptions and revised practices visible','<div class="mini-list">'+db.lessons.map(l=>'<div class="mini-item"><div class="mini-icon">✦</div><div><strong>'+esc(l.title)+'</strong><p>'+esc(l.text)+'</p></div></div>').join('')+'</div><form id="lesson-form" class="form-grid"><div class="field"><label>Lesson title</label><input name="title" required></div><div class="field full"><label>What changed or failed?</label><textarea name="text" required></textarea></div><button class="btn primary" type="submit">Save lesson</button></form>');
  return html;
}
function audit(event){if(db.incident.closed&&event!=='Case closed'&&event!=='Case reopened'){db.incident.closed=false;db.incident.stage='Reopened';db.audit.push({event:'Case reopened after evidence or decision changed',date:new Date().toISOString(),actor:'Local user'})}db.audit.push({event,date:new Date().toISOString(),actor:'Local user'});save()}
function invalidateGroundTruth(){if(db.groundTruth){db.groundTruth=null;db.groundTruthCleared=true;db.warnings.push('Known-answer validation was cleared after local evidence changed.')}}
function csvCell(v){const raw=String(v??''),safe=typeof v==='string'&&/^[\s]*[=+\-@]/.test(raw)?"'"+raw:raw;return '"'+safe.replace(/"/g,'""')+'"'}
function reportData(a,options){
  const selected=options.find(x=>x.name===selectedRecovery)||options[0],effect=deriveEffectiveness(db,a,today()),economics=deriveCost(db,a);
  return {generated:new Date().toISOString(),source:db.sourceName,scenario:db.scenario?.title,focus:a.focus,reference:a.reference.id,confidence:a.confidence,confirmed:a.confirmed.map(b=>b.id),precautionary:a.precautionary.map(b=>b.id),confirmedStock:a.confirmedStock,confirmedShipped:a.confirmedShipped,focusDefectRate:a.focusSample?a.focusDefects/a.focusSample*100:null,costKnown:economics.known,costCoverage:a.costCoverage,costPerAccepted:economics.perAccepted,expectedFailureLoss:economics.expectedLoss,expectedAvoidedLoss:economics.avoided,preventionRoi:economics.roi,effectivenessDecision:effect.decision,implementationDate:effect.implementedAt,baselineRate:effect.baselineRate,postRate:effect.postRate,cutoff:a.due,recoveryName:selected?.name||null,recoveryCompletion:selected?.complete||null,recoveryDelay:selected?.delay??null,recoveryCost:selected?.cost??null,recoveryInspectUnits:selected?.inspectUnits??null,recovery:selected||null,warnings:a.warnings,exposure:a.exposure.map(b=>({batch:b.id,sku:b.sku,factory:b.factory,line:b.line,machine:b.machine,fabric:b.fabric,thread:b.thread,inventory:b.inventory,shipped:b.shipped,scope:b.scope,reason:b.reason})),inspections:db.inspections.map(i=>({id:i.id,batch:i.batch,date:i.date,stage:i.stage,type:i.type,sample:i.sample,defects:i.defects,threshold:i.threshold,thresholdSource:i.thresholdAssumed?'Assumed screening':'Supplied',disposition:i.thresholdAssumed&&i.dispositionInferred?'Screening '+i.disposition:i.disposition})),actions:db.actions.map(x=>({id:x.id,title:x.title,owner:x.owner,status:x.status,completedAt:x.completedAt,evidence:x.evidence})),costCategories:a.costRows.map(([category,amount])=>({category,amount})),recoveryAlternatives:options.map(x=>({name:x.name,inspectUnits:x.inspectUnits,reworkUnits:x.reworkUnits,replacementUnits:x.replacementUnits,firstRelease:x.firstRelease,complete:x.complete,delay:x.delay,cost:x.cost})),verificationChecks:Object.entries(effect.checks).map(([period,x])=>({period,due:x.due,date:x.date,evidence:x.evidence,valid:x.valid})),audit:db.audit.map(x=>({event:x.event||x.action,date:x.date||x.at,actor:x.actor||'Local user'}))};
}
function downloadReport(type){
  const a=model(),options=plansFor(a),r=reportData(a,options),stem='factorysphere-'+today();
  for(const row of r.inspections){const source=db.inspections.find(i=>i.id===row.id);row.threshold=source?.threshold??null;row.thresholdSource=source?.thresholdAssumed?'Screening assumption':'Supplied or reviewed';row.reviewStatus=source?.dispositionInferred?'Inferred':'Reviewed or supplied';if(source?.thresholdAssumed&&source?.dispositionInferred)row.disposition='Screening '+source.disposition}
  if(type==='csv'){
    const rows=[['Section','ID','Field','Value']];
    for(const [k,v] of Object.entries(r))if(!Array.isArray(v)&&typeof v!=='object')rows.push(['Summary','',k,v]);
    for(const b of r.exposure)for(const [k,v] of Object.entries(b))rows.push(['Exposure',b.batch,k,v]);
    for(const i of r.inspections)for(const [k,v] of Object.entries(i))rows.push(['Inspection',i.id,k,v]);
    for(const x of r.actions)for(const [k,v] of Object.entries(x))rows.push(['CAPA',x.id,k,v]);
    for(const x of r.costCategories)rows.push(['Cost',x.category,'amount',x.amount]);
    for(const x of r.recoveryAlternatives)for(const [k,v] of Object.entries(x))rows.push(['Recovery',x.name,k,v]);
    for(const x of r.verificationChecks)for(const [k,v] of Object.entries(x))rows.push(['Verification',x.period,k,v]);
    const extended=analyticalReport(db,a,options);for(const key of ['signals','containment','hypotheses','fiveWhys','governanceGates','planningAssumptions','comparableEffectiveness'])rows.push(['Intelligence','',key,JSON.stringify(extended[key])]);
    for(const x of r.audit)for(const [k,v] of Object.entries(x))rows.push(['Audit',x.date,k,v]);
    downloadFile(stem+'.csv','\ufeff'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n'),'text/csv;charset=utf-8');return;
  }
  const summary=[['Source',r.source],['Scenario',r.scenario],['Defect focus',r.focus],['Reference batch',r.reference],['Confirmed batches',r.confirmed.join(', ')||'None'],['Precautionary batches',r.precautionary.join(', ')||'None'],['Confirmed stock',fmt(r.confirmedStock)],['Confirmed shipped',fmt(r.confirmedShipped)],['Defect rate',pct(r.focusDefectRate)],['Known quality cost',money(r.costKnown)],['Cost coverage',r.costCoverage+'/4'],['Effectiveness decision',r.effectivenessDecision],['Implementation date',r.implementationDate||'Unavailable'],['Observed post-action rate',pct(r.postRate)],['Shipment cut-off',r.cutoff||'Unavailable'],['Selected recovery',r.recovery?.name||'Unavailable'],['Recovery completion',r.recovery?.complete||'Unavailable'],['Estimated delay',r.recovery?.delay==null?'Unavailable':r.recovery.delay+' days']];
  summary.push(['Total quality cost per acceptable garment',money2(r.costPerAccepted)],['Expected failure loss',money(r.expectedFailureLoss)],['Expected avoided loss',money(r.expectedAvoidedLoss)],['Prevention ROI',pct(r.preventionRoi)]);
  let doc='<!doctype html><html><head><meta charset="utf-8"><title>FactorySphere decision report</title><style>body{font:14px Arial,sans-serif;color:#20333d;max-width:1100px;margin:36px auto;padding:0 20px}h1{font-size:28px}h2{margin-top:32px}table{border-collapse:collapse;width:100%}th,td{border-bottom:1px solid #dce5e7;padding:9px;text-align:left;vertical-align:top}th{background:#eff5f4}small{color:#617580}p{line-height:1.5}@media print{body{margin:0}}</style></head><body><h1>FactorySphere · Quality decision report</h1><small>Generated '+esc(r.generated)+' · Local file analysis</small><h2>Outcome</h2><table>'+summary.map(x=>'<tr><th>'+esc(x[0])+'</th><td>'+esc(x[1])+'</td></tr>').join('')+'</table><h2>Exposure and rationale</h2><table><tr><th>Batch</th><th>Scope</th><th>Stock</th><th>Shipped</th><th>Reason</th></tr>'+r.exposure.map(b=>'<tr><td>'+esc(b.batch)+'</td><td>'+esc(b.scope)+'</td><td>'+fmt(b.inventory)+'</td><td>'+fmt(b.shipped)+'</td><td>'+esc(b.reason)+'</td></tr>').join('')+'</table><h2>Inspection evidence</h2><table><tr><th>ID</th><th>Batch</th><th>Stage</th><th>Defect</th><th>Sample</th><th>Defects</th><th>Result</th></tr>'+r.inspections.map(i=>'<tr>'+[i.id,i.batch,i.stage,i.type,fmt(i.sample),fmt(i.defects),i.disposition].map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>').join('')+'</table><h2>CAPA actions</h2><table><tr><th>Action</th><th>Owner</th><th>Status</th><th>Evidence</th></tr>'+r.actions.map(x=>'<tr>'+[x.title,x.owner,x.status,x.evidence||'Missing'].map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>').join('')+'</table><h2>Cost categories</h2><table><tr><th>Category</th><th>Amount</th></tr>'+r.costCategories.map(x=>'<tr><td>'+esc(x.category)+'</td><td>'+esc(money(x.amount))+'</td></tr>').join('')+'</table><h2>Recovery alternatives</h2><table><tr><th>Option</th><th>Inspect</th><th>Rework</th><th>Full completion</th><th>First release</th><th>Delay</th><th>Cost</th></tr>'+r.recoveryAlternatives.map(x=>'<tr>'+[x.name,fmt(x.inspectUnits),fmt(x.reworkUnits),x.complete,x.firstRelease||'—',x.delay==null?'—':x.delay+' days',money(x.cost)].map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>').join('')+'</table><h2>Verification checks</h2><table><tr><th>Period</th><th>Due</th><th>Checked</th><th>Evidence</th><th>Valid</th></tr>'+r.verificationChecks.map(x=>'<tr>'+[x.period,x.due||'—',x.date||'—',x.evidence||'—',x.valid?'Yes':'No'].map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>').join('')+'</table><h2>Audit trail</h2><table><tr><th>When</th><th>Event</th><th>Actor</th></tr>'+r.audit.map(x=>'<tr>'+[x.date,x.event,x.actor].map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>').join('')+'</table><h2>Data limits</h2><p>'+esc(r.warnings.join(' ')||'No normalization warnings.')+'</p></body></html>';
  doc=doc.replace('</body>',analyticalReport(db,a,options,true)+'</body>');
  downloadFile(stem+'.html',doc,'text/html;charset=utf-8');
}
function render(){
  const a=model(),options=plansFor(a);
  const pages={overview:()=>overviewPage(db,a,options,{focusDefect,referenceBatch,factoryFilter,scopeFilter,selectedRecovery,selectedBatch}),trace:()=>trace(a),quality:()=>quality(a),investigate:()=>investigation(a),recovery:()=>recovery(a,options),cost:()=>cost(a),capa:()=>capa(a),learning:()=>learning(a)};
  const state={focusDefect,referenceBatch,factoryFilter,scopeFilter,selectedRecovery,selectedBatch};
  let page=view==='overview'?overviewPage(db,a,options,state):view==='data'?dataPage(db,a,manifest,selectedFixture):view==='customers'?customersPage(db):view==='containment'?containmentPage(db,a,options):(pages[view]||pages.overview)();
  if(!['overview','data','customers','containment'].includes(view)){const extension=intelligencePanels(view,db,a,options,state);page=page.replace(focusBar(a),'');const end=page.indexOf('</div></div>')+12;page=view==='recovery'?page.slice(0,end)+focusBar(a)+page.slice(end)+extension:page.slice(0,end)+focusBar(a)+extension+page.slice(end)}
  shell(loadBanner()+page);saveIndicator(storageWarning?'Not saved':pendingWrites?'Saving…':'Saved locally');
  try{sessionStorage.setItem(KEY+'-view',JSON.stringify({source:db.sourceName,loadedAt:db.loadedAt,view,focusDefect,referenceBatch,factoryFilter,scopeFilter,stageFilter,selectedBatch,selectedRecovery}))}catch{}
  if(notification){notice(notification);notification=''}
}
function resetViews(){window.scrollTo(0,0);history.replaceState(null,'','#overview');focusDefect='Auto';referenceBatch='Auto';selectedBatch=db.batches[0]?.id;scopeFilter='All';factoryFilter='All';stageFilter='All';selectedRecovery=db.incident.selectedScenario||'Inspect all related stock + targeted rework';view='overview'}
async function syncFromOtherTab(){
  if(loadState?.kind==='loading')return;
  const saved=await latestSaved();
  if(!saved)return;
  if(revisionOf(saved)<=revisionOf(db))return;
  try{db=normalizeDataset(saved,saved.sourceName||'Stored file')}catch{return}
  loadToken++;
  selectedFixture=/^\d{2}-.*\.json$/.test(db.sourceName)?db.sourceName:'';
  resetViews();loadState=null;notification='Updated from another local tab';render();
}
async function loadFixture(){
  const file=selectedFixture||$('#fixture-select')?.value;if(!file)return;
  const token=++loadToken;
  selectedFixture=file;
  loadState={kind:'loading',title:'Loading '+file,message:'The current results remain visible until this file has been parsed and analyzed.'};render();
  try{
    const response=await fetch('./test-files/'+encodeURIComponent(file),{cache:'no-store'});
    if(!response.ok)throw new Error('HTTP '+response.status);
    const next=normalizeDataset(await response.json(),file);
    scheduleRecovery(next,deriveAnalysis(next),recoveryOptions(next,deriveAnalysis(next)));
    if(token!==loadToken)return;
    next.sourceName=file;next.loadedAt=new Date().toISOString();
    db=next;await save();resetViews();loadState=null;notification='Loaded '+(db.scenario?.title||file);render();
  }catch(err){
    if(token!==loadToken)return;
    loadState={kind:'error',title:'The selected case did not load',message:'The displayed results still belong to '+db.sourceName+'. Check that the local server is running, then try again. '+err.message};
    render();
  }
}
async function importFiles(files){
  const token=++loadToken;
  const names=[...files].map(f=>f.name).join(' + ');
  loadState={kind:'loading',title:'Analyzing '+names,message:'The current results remain visible until the upload passes validation.'};render();
  try{
    const next=await readDataFiles(files);
    scheduleRecovery(next,deriveAnalysis(next),recoveryOptions(next,deriveAnalysis(next)));
    if(token!==loadToken)return;
    next.sourceName=names;next.loadedAt=new Date().toISOString();
    db=next;selectedFixture='';await save();resetViews();loadState=null;notification='Analyzed '+db.sourceName;render();
  }catch(err){
    if(token!==loadToken)return;
    loadState={kind:'error',title:'The selected file was not analyzed',message:'The displayed results still belong to '+db.sourceName+'. '+err.message};
    render();
  }
}
document.addEventListener('click',async e=>{
  if(e.target.closest('#menu')){const open=$('#sidebar').classList.toggle('open');$('#menu').setAttribute('aria-expanded',String(open));$('#menu').setAttribute('aria-label',open?'Close menu':'Open menu');return}
  if(e.target.closest('#close-menu')){$('#sidebar').classList.remove('open');$('#menu').setAttribute('aria-expanded','false');$('#menu').setAttribute('aria-label','Open menu');return}
  const batch=e.target.closest('[data-batch]');if(batch)selectedBatch=batch.dataset.batch;
  const target=e.target.closest('[data-view]');if(target){view=target.dataset.view;history.replaceState(null,'','#'+view);render();window.scrollTo(0,0);return}
  const defect=e.target.closest('[data-focus-type]');if(defect){focusDefect=defect.dataset.focusType;render();return}
  const plan=e.target.closest('[data-plan]');if(plan){selectedRecovery=plan.dataset.plan;db.incident.selectedScenario=selectedRecovery;audit('Recovery option selected');render();return}
  const review=e.target.closest('[data-review-inspection]');if(review){const id=review.dataset.reviewInspection,i=db.inspections.find(x=>x.id===id);if(i){const suffix='"'+CSS.escape(id)+'"',result=document.querySelector('[data-review-result='+suffix+']').value,rawThreshold=document.querySelector('[data-review-threshold='+suffix+']').value.trim(),evidence=document.querySelector('[data-review-evidence='+suffix+']').value.trim(),threshold=rawThreshold===''?null:Number(rawThreshold);if(result==='Unknown'||!evidence||threshold!==null&&(!Number.isFinite(threshold)||threshold<0||threshold>100)){notice('Choose Pass or Fail, provide evidence, and use a threshold from 0 to 100 if entered.');return}invalidateGroundTruth();i.disposition=result;i.dispositionInferred=false;i.evidence=evidence;if(threshold!==null){i.threshold=threshold;i.thresholdAssumed=false}audit('Inspection '+id+' reviewed');render();notice('Inspection result reviewed')}return}
  const saveComplaint=e.target.closest('[data-save-complaint]');if(saveComplaint){const id=saveComplaint.dataset.saveComplaint,c=db.complaints.find(x=>x.id===id);if(c){const decision=document.querySelector('[data-complaint-review="'+CSS.escape(id)+'"]').value;if(c.decision!==decision)invalidateGroundTruth();c.decision=decision;audit('Complaint '+id+' review updated');render();notice('Complaint review saved')}return}
  const saveAction=e.target.closest('[data-save-action]');if(saveAction){const id=saveAction.dataset.saveAction,x=db.actions.find(x=>x.id===id);if(x){const statusValue=document.querySelector('[data-action-status="'+CSS.escape(id)+'"]').value,completedValue=document.querySelector('[data-action-completed="'+CSS.escape(id)+'"]').value;if(statusValue==='Done'&&!completedValue){notice('Set the actual completion date before marking this action Done.');return}if(completedValue>today()){notice('Action completion cannot be in the future.');return}if(statusValue==='Done'&&actionBlockers(db,x).length){notice('Complete dependencies with evidence first: '+actionBlockers(db,x).join(', '));return}if(statusValue==='Done'&&!document.querySelector('[data-action-evidence="'+CSS.escape(id)+'"]').value.trim()){notice('Completion requires evidence.');return}x.status=statusValue;x.evidence=document.querySelector('[data-action-evidence="'+CSS.escape(id)+'"]').value.trim();x.completedAt=statusValue==='Done'?completedValue:'';audit('Action '+id+' updated');notice('Action saved');render()}return}
  const action=e.target.closest('[data-action]')?.dataset.action;
  if(!action)return;
  try{
    if(action==='attach-evidence'){const recordId=$('#evidence-link')?.value.trim(),reviewer=$('#evidence-reviewer')?.value.trim(),valid=[db.incident.id,...db.inspections.map(i=>i.id),...db.actions.map(i=>i.id),...db.complaints.map(i=>i.id)];if(!valid.includes(recordId)||!reviewer){notice('Choose an existing record ID and name a reviewer.');return}let input=document.createElement('input');input.id='evidence-input';input.type='file';input.accept='.png,.jpg,.jpeg,.webp,.pdf';input.dataset.recordId=recordId;input.dataset.reviewer=reviewer;input.hidden=true;document.body.append(input);input.click()}
    else if(action==='snapshot'){downloadFile('factorysphere-workspace-'+today()+'.json',JSON.stringify(db,null,2),'application/json')}
    else if(action==='report-json'){downloadFile('factorysphere-analysis-'+today()+'.json',JSON.stringify(analyticalReport(db,model(),plansFor(model())),null,2),'application/json')}
    else if(action==='upload'){let input=$('#file-input');if(!input){input=document.createElement('input');input.id='file-input';input.type='file';input.accept='.json,.csv,.tsv,.xlsx,.xls';input.multiple=true;input.hidden=true;document.body.append(input)}input.click()}
    else if(action==='report-html')downloadReport('html');
    else if(action==='report-csv')downloadReport('csv');
    else if(action==='enterprise-demo'){selectedFixture='enterprise-demonstration.json';await loadFixture()}
    else if(action==='load-fixture')await loadFixture();
    else if(action==='clear-filters'){scopeFilter='All';factoryFilter='All';render()}
    else if(action==='go-overview'){view='overview';render()}
    else if(action==='close'){const {gates}=closureGates(model());const missing=gates.filter(([,pass])=>!pass).map(([label])=>label);if(missing.length){notice('Closure blocked: '+missing.join('; ')+'.');return}db.incident.closed=true;db.incident.stage='Closed';audit('Case closed');render()}
    else if(action==='reopen'){db.incident.closed=false;db.incident.stage='Reopened';audit('Case reopened');render()}
  }catch(err){notice(err.message)}
});
document.addEventListener('change',async e=>{
  if(e.target.id==='evidence-input'&&e.target.files.length){const input=e.target,file=input.files[0],sourceRevision=db.revision,sourceLoadedAt=db.loadedAt;try{if(!['image/png','image/jpeg','image/webp','application/pdf'].includes(file.type)||file.size>2*1024*1024)throw new Error('Use PNG, JPEG, WebP or PDF up to 2 MB.');const dataUrl=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Evidence file could not be read.'));reader.readAsDataURL(file)});if(db.revision!==sourceRevision||db.loadedAt!==sourceLoadedAt)throw new Error('The active data changed during upload. Attach the evidence again.');const records=db.workspace.evidenceFiles||[];if(records.reduce((n,r)=>n+(r.size||r.dataUrl.length*.75),0)+file.size>20*1024*1024)throw new Error('Combined evidence exceeds 20 MB.');const id='EV-'+Date.now();records.push({id,recordId:input.dataset.recordId,reviewer:input.dataset.reviewer,name:file.name,type:file.type,size:file.size,dataUrl});db.workspace.evidenceFiles=records;audit('Evidence '+id+' attached to '+input.dataset.recordId);render();notice('Evidence attached. Reference '+id+' in your review.')}catch(err){notice(err.message)}finally{input.remove()}return}

  if(e.target.id==='file-input'&&e.target.files.length){try{await importFiles(e.target.files)}catch(err){notice(err.message)}finally{if(e.target.isConnected)e.target.value=''}}
  if(e.target.id==='focus-defect'){focusDefect=e.target.value;render()}
  if(e.target.id==='focus-batch'){referenceBatch=e.target.value;render()}
  if(e.target.id==='trace-batch'){selectedBatch=e.target.value;render()}
  if(e.target.id==='factory-filter'){factoryFilter=e.target.value;render()}
  if(e.target.id==='scope-filter'){scopeFilter=e.target.value;render()}
  if(e.target.id==='stage-filter'){stageFilter=e.target.value;render()}
  if(e.target.id==='fixture-select'){selectedFixture=e.target.value;render()}
});
document.addEventListener('submit',e=>{
  const form=e.target;if(!form.id)return;e.preventDefault();try{if(handleWorkspaceForm(form,db,{audit,invalidateGroundTruth})){render();notice('Workspace updated');return}}catch(err){notice(err.message);return}const f=new FormData(form),v=k=>String(f.get(k)??'').trim();
  if(form.id==='inspection-form'){const sample=Number(v('sample')),defects=Number(v('defects'));if(defects>sample){notice('Defects cannot exceed inspected units.');return}const threshold=Number(v('threshold'));invalidateGroundTruth();db.inspections.push({id:'INS-LOCAL-'+Date.now(),batch:v('batch'),stage:v('stage'),type:v('type'),location:v('location'),date:today(),sample,defects,threshold,inspector:v('inspector'),evidence:v('evidence'),operation:'',severity:'Major',disposition:defects/sample*100>threshold?'Fail':'Pass',notes:''});audit('Inspection added');render();notice('Inspection added')}
  else if(form.id==='cause-form'){db.incident.cause=v('cause');db.incident.causeEvidence=v('causeEvidence');db.incident.causeReviewer=v('causeReviewer');db.incident.causeConfirmed=!!f.get('causeConfirmed')&&!!db.incident.cause&&!!db.incident.causeEvidence&&!!db.incident.causeReviewer;audit('Cause finding updated');render();notice(db.incident.causeConfirmed?'Cause confirmed with evidence':'Working hypothesis saved')}
  else if(form.id==='capacity-form'){const next=Object.fromEntries(Object.keys(db.recoveryInputs).map(k=>[k,Number(v(k))]));if(Object.values(next).some(x=>!Number.isFinite(x)||x<=0)||['inspectors','stations','reworkLines'].some(k=>!Number.isInteger(next[k]))){notice('Capacity must be positive; people, stations and lines must be whole numbers.');return}Object.assign(db.recoveryInputs,next);audit('Recovery capacity updated');render();notice('Recovery plan recalculated')}
  else if(form.id==='cost-form'){const next=Object.fromEntries(Object.keys(db.costInputs).map(k=>[k,v(k)===''?null:Number(v(k))]));if(Object.values(next).some(x=>x!==null&&(!Number.isFinite(x)||x<0))||['recurrence','reduction'].some(k=>next[k]!==null&&next[k]>100)){notice('Costs must be nonnegative and percentages must be from 0 to 100.');return}Object.assign(db.costInputs,next);audit('Cost assumptions updated');render();notice('Cost model updated')}
  else if(form.id==='incident-form'){for(const k of ['leader','severity'])db.incident[k]=v(k);for(const k of ['hold','shipmentBlock','approval'])db.incident[k]=!!f.get(k);audit('Incident controls updated');render();notice('Incident saved')}
  else if(form.id==='action-form'){db.actions.push({id:'ACT-LOCAL-'+Date.now(),title:v('title'),type:v('type'),owner:v('owner'),role:'',due:v('due'),status:'Open',completedAt:'',evidence:'',required:true});audit('CAPA action added');render();notice('Action added')}
  else if(form.id==='verify-form'){const effect=deriveEffectiveness(db,model(),today());for(const k of ['d30','d60','d90'])if(f.get(k)){const checkDate=v(k+'Date'),evidence=v(k+'Evidence'),due=effect.checks[k].due;if(!due||!checkDate||!evidence||checkDate<due||checkDate>today()){notice(k.slice(1)+'-day check needs an eligible date and its own evidence reference.');return}}for(const k of ['d30','d60','d90']){db.incident.verification[k]=!!f.get(k);db.incident.verificationRecords[k]={date:v(k+'Date'),evidence:v(k+'Evidence')}}db.verificationEvidence=v('verificationEvidence');db.sideEffect=v('sideEffect');audit('Verification updated');render();notice('Verification saved')}
  else if(form.id==='lesson-form'){db.lessons.push({id:'LES-LOCAL-'+Date.now(),title:v('title'),text:v('text'),case:db.incident.id,date:today()});audit('Lesson added');render();notice('Lesson saved')}
});
async function boot(){
  const saved=await latestSaved();
  if(saved){try{db=normalizeDataset(saved,saved.sourceName||'Stored file')}catch{storageWarning='Saved data could not be read; the built-in example is displayed.'}}
  selectedBatch=db.batches[0]?.id;
  const requestedView=location.hash.slice(1);if(['overview','trace','quality','investigate','recovery','cost','capa','learning','data','customers','containment'].includes(requestedView))view=requestedView;
  selectedFixture=/^\d{2}-.*\.json$/.test(db.sourceName)?db.sourceName:'';
  selectedRecovery=db.incident.selectedScenario||'Inspect all related stock + targeted rework';
  try{const state=JSON.parse(sessionStorage.getItem(KEY+'-view'));if(state?.source===db.sourceName&&state.loadedAt===db.loadedAt){focusDefect=state.focusDefect||'Auto';referenceBatch=state.referenceBatch||'Auto';factoryFilter=state.factoryFilter||'All';scopeFilter=state.scopeFilter||'All';stageFilter=state.stageFilter||'All';selectedBatch=state.selectedBatch||selectedBatch}}catch{}
  render();
  try{
    const response=await fetch('./test-files/index.json',{cache:'no-store'});
    if(!response.ok)throw new Error('HTTP '+response.status);
    const list=await response.json();
    manifest=Array.isArray(list)?list:list.scenarios||[];
    render();
  }catch{
    loadState={kind:'error',title:'Scenario library is unavailable',message:'Scenario files could not be fetched. Your active data remains available. Check the connection and reload.'};
    render();
  }
}
if(channel)channel.onmessage=e=>{if(e.data?.type==='dataset-updated')syncFromOtherTab()};
else window.addEventListener('storage',e=>{if(e.key===KEY)syncFromOtherTab()});
window.addEventListener('hashchange',()=>{const next=location.hash.slice(1);if(['overview','trace','quality','investigate','recovery','cost','capa','learning','data','customers','containment'].includes(next)){view=next;render();window.scrollTo(0,0)}});
boot();
document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkBuild()});
window.addEventListener('focus',checkBuild);
setInterval(checkBuild,30000);
