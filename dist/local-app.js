import {seed} from './data.js';
import {normalizeDataset,deriveAnalysis,recoveryOptions,deriveCost,deriveEffectiveness,quantity} from './analysis-core.js';
import {readDataFiles,downloadFile} from './file-ingest.js';
import {loadDataset,saveDataset} from './local-store.js';

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
const save=async()=>{
  db.updatedAt=new Date().toISOString();
  db.revision=Math.max(Date.now()*1000+Math.floor(Math.random()*1000),revisionOf(db)+1);
  const snapshot=structuredClone(db);
  writeQueue=writeQueue.catch(()=>{}).then(async()=>{
    if(revisionOf(await latestSaved())>snapshot.revision)return;
    let stored=false;
    try{await saveDataset(snapshot);stored=true}catch{}
    try{localStorage.setItem(KEY,JSON.stringify(snapshot));stored=true}catch{}
    storageWarning=stored?'':'Browser storage is unavailable. Results are current, but upload this file again after a reload.';
    if(stored)channel?.postMessage({type:'dataset-updated'});
  });
  return writeQueue;
};
const model=()=>deriveAnalysis(db,{defect:focusDefect,referenceBatch});
async function checkBuild(){
  if(loadState?.kind==='loading')return;
  try{const current=new URL(document.querySelector('script[src*="local-app.js"]').src).searchParams.get('v');const response=await fetch('./index.html',{cache:'no-store'});if(!response.ok)return;const latest=(await response.text()).match(/local-app\.js\?v=(\d+)/)?.[1];if(latest&&current&&latest!==current)location.reload()}catch{}
}
function closureGates(a){const required=db.actions.filter(x=>x.required),missing=required.filter(x=>x.status!=='Done'||!x.evidence),effect=deriveEffectiveness(db,a,today());return {effect,gates:[['Containment recorded',db.incident.hold||db.incident.shipmentBlock],['Cause evidence and reviewer',db.incident.causeConfirmed&&!!db.incident.causeEvidence&&!!db.incident.causeReviewer],['Management approval',db.incident.approval],['Required actions done with evidence',!missing.length&&required.length>0],['30/60/90 checks dated and evidenced',effect.allChecks],['Effectiveness shown by follow-up inspection',effect.decision==='Effective and ready to standardize']]}}
const status=(label,tone)=>`<span class="status ${tone||({Confirmed:'red',Precautionary:'amber','Separate signal':'blue',Unrelated:'gray',Reference:'blue',Fail:'red',Pass:'green',Done:'green',Open:'amber'}[label]||'gray')}"><span class="dot"></span>${esc(label)}</span>`;
const button=(text,action,style='')=>`<button class="btn ${style}" data-action="${action}">${text}</button>`;
const card=(title,desc,body,extra='')=>`<section class="card pad"><div class="card-head"><div><h2>${esc(title)}</h2>${desc?`<p>${esc(desc)}</p>`:''}</div>${extra}</div>${body}</section>`;
const metric=(title,value,sub,tone='')=>`<div class="card metric ${tone}"><div class="label">${esc(title)}</div><div class="value">${esc(value)}</div><div class="sub">${esc(sub)}</div></div>`;
const head=(kicker,title,subtitle,actions='')=>`<div class="page-head"><div><div class="eyebrow">${esc(kicker)}</div><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div><div class="head-actions">${actions}</div></div>`;
const option=(v,current,label=v)=>`<option value="${esc(v)}" ${v===current?'selected':''}>${esc(label)}</option>`;
const empty=(message)=>`<div class="empty">${esc(message)}</div>`;
const rowHtml=(cells)=>'<tr>'+cells.map(c=>'<td>'+c+'</td>').join('')+'</tr>';
function notice(text){notification=text;let el=$('.toast');if(el)el.remove();el=document.createElement('div');el.className='toast';el.textContent=text;document.body.append(el);setTimeout(()=>el.remove(),4300)}
function shell(page){
  const nav=[['overview','◫','Overview'],['trace','◇','Traceability'],['quality','◉','Quality signals'],['investigate','⌕','Investigation'],['recovery','▤','Recovery planner'],['cost','◈','Cost intelligence'],['capa','☑','CAPA command'],['learning','✦','Learning & verification']];
  $('#app').innerHTML=`<div class="shell"><aside class="sidebar" id="sidebar"><button class="sidebar-close" id="close-menu" aria-label="Close menu">×</button><div class="brand"><div class="brand-mark">⌁</div><div><strong>GARMENT<br>INTELLIGENCE</strong><small>LOCAL QUALITY OS</small></div></div><div class="side-label">Workspace</div><nav class="nav">${nav.map(([id,icon,label])=>`<button data-view="${id}" class="${view===id?'active':''}"><span class="ico">${icon}</span>${label}</button>`).join('')}</nav><div class="side-case"><span class="eyebrow">Active data</span><strong>${esc(db.scenario?.title||db.sourceName)}</strong><small>${db.batches.length} batches · ${db.inspections.length} inspections · ${db.complaints.length} complaints</small><div style="margin-top:12px">${status(db.incident.stage||'Assessment','blue')}</div></div></aside><main class="main"><header class="topbar"><div class="row"><button class="mobile-menu" id="menu" aria-label="Open menu" aria-controls="sidebar" aria-expanded="false">☰</button><span class="crumb">LOCAL WORKSPACE / <b>${esc(nav.find(n=>n[0]===view)?.[2])}</b></span></div><div class="top-right"><span class="top-pill">● &nbsp; LOCAL BROWSER DATA</span><span class="top-pill">${esc(today())}</span><span class="avatar">QI</span></div></header><div class="content">${page}</div></main></div>`;
  document.title=`${nav.find(n=>n[0]===view)?.[2]} · FactorySphere`;
}
function focusBar(a){const types=a.defects.map(x=>x.type);return `<section class="card pad focus-bar"><div><div class="eyebrow">Analysis focus</div><p>Choose a defect and reference batch. The exposure engine recalculates every view.</p></div><div class="focus-controls"><div class="field"><label>Defect</label><select id="focus-defect">${option('Auto',focusDefect,'Auto · '+a.focus)}${types.map(t=>option(t,focusDefect)).join('')}</select></div><div class="field"><label>Reference batch</label><select id="focus-batch">${option('Auto',referenceBatch,'Auto · '+a.reference.id)}${db.batches.map(b=>option(b.id,referenceBatch)).join('')}</select></div></div></section>`}
function warningPanel(a){return a.warnings.length?`<div class="alert-banner"><div class="alert-icon">!</div><div><strong>Data completeness affects these results</strong><p>${a.warnings.map(esc).join(' · ')}</p></div></div>`:''}
function loadBanner(){
  if(loadState)return `<div class="alert-banner ${loadState.kind==='error'?'load-error':'load-progress'}" role="status"><div class="alert-icon">${loadState.kind==='error'?'!':'↻'}</div><div><strong>${esc(loadState.title)}</strong><p>${esc(loadState.message)}</p></div></div>`;
  if(storageWarning)return `<div class="alert-banner load-error" role="status"><div class="alert-icon">!</div><div><strong>Current data is not saved for reload</strong><p>${esc(storageWarning)}</p></div></div>`;
  return '';
}
function trend(rows){
  const byDate=new Map();
  for(const i of rows){if(!i.date)continue;const x=byDate.get(i.date)||{sample:0,defects:0};x.sample+=i.sample;x.defects+=i.defects;byDate.set(i.date,x)}
  const values=[...byDate].sort(([x],[y])=>x.localeCompare(y)).map(([date,v])=>({date,rate:v.defects/v.sample*100}));
  if(!values.length)return empty('No dated matching inspection history. Add inspection dates to show a trend.');
  const dated=rows.filter(i=>i.date),totalSample=dated.reduce((n,i)=>n+i.sample,0),threshold=dated.reduce((n,i)=>n+i.threshold*i.sample,0)/totalSample;
  const max=Math.max(6,threshold*1.2,...values.map(v=>v.rate)),coords=values.map((v,i)=>({x:35+i*510/Math.max(1,values.length-1),y:145-v.rate/max*110}));
  const svg='<svg class="chart" viewBox="0 0 580 185" role="img" aria-label="Volume-adjusted inspection trend"><line class="gridline" x1="35" y1="145" x2="550" y2="145"/><line class="threshold" x1="35" y1="'+(145-threshold/max*110)+'" x2="550" y2="'+(145-threshold/max*110)+'"/><polyline class="line" points="'+coords.map(p=>p.x+','+p.y).join(' ')+'"/>'+coords.map((p,i)=>'<circle cx="'+p.x+'" cy="'+p.y+'" r="4"/><text x="'+(p.x-13)+'" y="169">'+esc(values[i].date.slice(5))+'</text>').join('')+'</svg>';
  return svg+'<p class="note">Orange line: '+pct(threshold)+' weighted screening/acceptance threshold'+(dated.some(i=>i.thresholdAssumed)?' (includes the disclosed 2.5% screening assumption)':'')+'. Each point divides defects by inspected units on that date.</p>';
}
function pareto(a){const max=Math.max(1,...a.defects.map(x=>x.defects));return `<div class="bar-list">${a.defects.slice(0,8).map(x=>`<button class="pareto-row" data-focus-type="${esc(x.type)}"><span>${esc(x.type)}</span><div class="progress"><span style="width:${x.defects/max*100}%"></span></div><b>${x.defects}</b></button>`).join('')}</div><p class="note">Click a defect to make it the analysis focus.</p>`}
function qcd(a,options){const totalUnits=db.batches.reduce((n,b)=>n+(b.units??0),0),fpyRows=db.batches.filter(b=>b.firstPass!==null&&b.units!==null),fpyUnits=fpyRows.reduce((n,b)=>n+b.units,0),fpy=fpyUnits?fpyRows.reduce((n,b)=>n+b.firstPass*b.units,0)/fpyUnits:null,reworkUnits=db.rework.reduce((n,r)=>n+r.units,0),completed=db.actions.filter(x=>x.status==='Done').length;const selected=options.find(x=>x.name===selectedRecovery)||options[0];const rows=[['Quality','Defects / hundred units',pct(a.allSample?a.allDefects/a.allSample*100:null),'All inspections'],['Quality','First-pass yield',pct(fpy),'Only batches with supplied FPY'],['Quality','Rework rate',pct(totalUnits&&db.rework.length?reworkUnits/totalUnits*100:null),db.rework.length?'Recorded rework units / produced units':'No rework records supplied'],['Cost','Quality cost',money(a.costCoverage?a.knownCost:null),`${a.costCoverage}/4 categories available`],['Delivery','Recovery lead time',selected?selected.totalDays+' days':'—','Capacity-based estimate'],['Delivery','Shipment delay',!selected||selected.delay===null?'—':selected.delay?selected.delay+' days':'On time',a.due?'Cut-off '+a.due:'No cut-off supplied'],['Execution','CAPA completion',db.actions.length?pct(completed/db.actions.length*100):'—','Actions marked done'],['Execution','Evidence-complete actions',`${db.actions.filter(x=>x.status==='Done'&&x.evidence).length}/${completed}`,'Completed actions with evidence']];return `<div class="table-wrap"><table><thead><tr><th>Dimension</th><th>Measure</th><th>Result</th><th>Basis</th></tr></thead><tbody>${rows.map(r=>rowHtml([`<strong>${r[0]}</strong>`,esc(r[1]),`<strong>${esc(r[2])}</strong>`,`<span class="muted">${esc(r[3])}</span>`])).join('')}</tbody></table></div>`}
function outcome(a,options){
  const selected=options.find(x=>x.name===selectedRecovery)||options[0];
  const pending=db.complaints.filter(c=>c.category===a.focus&&/pending review/i.test(c.decision));
  let statement=`${a.confirmed.length} confirmed batch${a.confirmed.length===1?'':'es'} for ${a.focus}; ${a.precautionary.length} precautionary batch${a.precautionary.length===1?'':'es'}.`;
  if(!a.confirmed.length)statement=`No confirmed ${a.focus} exposure in the current file. ${pending.length?'Review the customer complaint before release.':'Review the reference batch and inspection evidence.'}`;
  const precautionStock=a.precautionary.reduce((n,b)=>n+(b.inventory??0),0),precautionShipped=a.precautionary.reduce((n,b)=>n+(b.shipped??0),0);
  let detail=a.confirmed.length?`${fmt(a.confirmedStock)} known stock units and ${fmt(a.confirmedShipped)} known shipped units are linked to confirmed scope.`:'No stock or shipped units are confirmed affected yet.';
  if(a.precautionary.length)detail+=` Precautionary scope includes ${fmt(precautionStock)} stock and ${fmt(precautionShipped)} shipped units; these are not declared defective.`;
  const next=a.alertRecords.length?`Verify ${a.alertRecords.slice(0,4).join(', ')} and compare ${a.reference.machine||'the relevant operation'} with a passing batch.`:pending.length?`Have a reviewer verify complaint ${pending.slice(0,3).map(c=>c.id).join(', ')} against the shipment and batch record.`:'Trace the customer report to shipment and batch records, then inspect a comparable sample.';
  const recovery=selected?selected.name+' · '+selected.complete:a.confirmedShipped>0?'No stock to inspect; assess customer response and replacement.':!a.confirmed.length?'Await confirmed scope before planning stock recovery.':'Stock quantity is missing; supply inventory to calculate recovery.';
  return `<div class="outcome-panel"><div class="eyebrow">Current outcome · ${esc(a.confidence)} confidence</div><h2>${esc(statement)}</h2><p>${esc(detail)}</p><div class="divider"></div><div class="outcome-cols"><div><small>Recommended verification</small><strong>${esc(next)}</strong></div><div><small>Recovery decision</small><strong>${esc(recovery)}</strong></div></div></div>`;
}
function dashboard(a,options){
  const actions=`<button class="btn primary" data-action="upload">↑ Upload files</button><input id="file-input" type="file" accept=".json,.csv,.tsv,.xlsx,.xls" multiple hidden><button class="btn" data-action="report-html">↓ Download report</button><button class="btn" data-action="report-csv">↓ Export CSV</button>`;
  const loadedWhen=new Date(db.loadedAt).toLocaleString('en-GB',{timeZone:'Asia/Dhaka',dateStyle:'medium',timeStyle:'short'});
  let html=head('Local analysis','Quality command center','The selected file drives the focus, exposure, cost, delivery, and action results.',actions);
  html+=`<section class="card pad scenario-card"><div><div class="eyebrow">Current source · loaded ${esc(loadedWhen)}</div><h2>${esc(db.scenario?.title||db.sourceName)}</h2><p>${esc(db.sourceName)} · ${esc(db.scenario?.description||'Analysis from uploaded file')}</p><small>${db.batches.length} batches · ${db.inspections.length} inspections · ${fmt(a.allSample)} inspected · ${fmt(a.allDefects)} defects · ${db.complaints.length} complaints</small></div><div class="scenario-picker"><div class="field"><label>Try a built-in case</label><select id="fixture-select">${option('',selectedFixture,'Choose a case')}${manifest.map(m=>option(m.file,selectedFixture,m.id.slice(0,2)+' · '+m.title)).join('')}</select></div><button class="btn lime" data-action="load-fixture" ${selectedFixture?'':'disabled'}>Load case</button><a class="btn" href="./test-files/scenarios.zip" download>↓ 20 case files</a></div></section>`;
  html+=focusBar(a)+warningPanel(a)+outcome(a,options);
  html+=`<div class="filter-bar"><div><span class="eyebrow">Dashboard filters</span><p>Filters change the displayed records and sampled rate.</p></div><div class="filter-controls"><div class="field"><label>Factory</label><select id="factory-filter">${option('All',factoryFilter)}${[...new Set(db.batches.map(b=>b.factory))].map(f=>option(f,factoryFilter)).join('')}</select></div><div class="field"><label>Scope</label><select id="scope-filter">${['All','Confirmed','Precautionary','Separate signal','Reference','Unrelated'].map(s=>option(s,scopeFilter)).join('')}</select></div>${button('Clear filters','clear-filters')}</div></div>`;
  const visible=a.exposure.filter(b=>(factoryFilter==='All'||b.factory===factoryFilter)&&(scopeFilter==='All'||b.scope===scopeFilter));
  const ids=new Set(visible.map(b=>b.id)),inspectionRows=db.inspections.filter(i=>ids.has(i.batch)&&i.type===a.focus);
  const sample=inspectionRows.reduce((n,i)=>n+i.sample,0),defects=inspectionRows.reduce((n,i)=>n+i.defects,0),stock=visible.filter(b=>b.scope==='Confirmed').reduce((n,b)=>n+(b.inventory??0),0),shipped=visible.filter(b=>b.scope==='Confirmed').reduce((n,b)=>n+(b.shipped??0),0);
  const activePlan=options.find(x=>x.name===selectedRecovery)||options[0];
  html+=`<div class="grid cols-4">${metric('Confirmed stock',fmt(stock)+' units',visible.filter(b=>b.scope==='Confirmed').length+' displayed batches','red')}${metric('Already shipped',fmt(shipped)+' units','Confirmed scope only','amber')}${metric(a.focus+' / hundred',pct(sample?defects/sample*100:null),fmt(defects)+' / '+fmt(sample)+' inspected','teal')}${metric('Quality cost',money(a.costCoverage?a.knownCost:null),a.costCoverage+'/4 categories supplied','blue')}</div>`;
  html+=`<div class="grid wide-left" style="margin-top:17px"><div class="grid">`;
  html+=card('Inspection trend','Volume-adjusted '+a.focus+' rate for displayed batches',trend(inspectionRows));
  html+=card('Batch exposure','Click a row to inspect its records',`<div class="table-wrap"><table><thead><tr><th>Batch / SKU</th><th>Factory · line</th><th>Why it appears</th><th>Stock</th><th>Shipped</th><th>Scope</th></tr></thead><tbody>${visible.map(b=>`<tr class="clickable" data-batch="${esc(b.id)}" data-view="trace"><td><strong>${esc(b.id)}</strong><br><span class="muted">${esc(b.sku||'SKU not supplied')}</span></td><td>${esc(b.factory)} · ${esc(b.line||'—')}</td><td>${esc(b.reason)}</td><td>${fmt(b.inventory)}</td><td>${fmt(b.shipped)}</td><td>${status(b.scope)}</td></tr>`).join('')}</tbody></table></div>${visible.length?'':empty('No batches match the filters.')}`);
  html+=card('QCD and execution','Metrics are calculated from the active file',qcd(a,options));
  html+='</div><div class="grid">';
  html+=card('Defect Pareto','Click a category to change the analysis focus',pareto(a));
  let warning=`<div class="mini-list"><div class="mini-item"><div class="mini-icon">↗</div><div><strong>What changed</strong><p>${esc(a.focus)}: ${pct(a.focusSample?a.focusDefects/a.focusSample*100:null)} across ${fmt(a.focusSample)} inspected units.</p></div></div><div class="mini-item"><div class="mini-icon">⌖</div><div><strong>Where and records</strong><p>${esc(a.confirmed.length?'Confirmed: '+a.confirmed.map(b=>b.id).join(', '):a.precautionary.length?'Precautionary: '+a.precautionary.map(b=>b.id).join(', '):'No connected batches')} · ${esc(a.alertRecords.slice(0,5).join(', ')||'No failing inspection IDs')}</p></div></div><div class="mini-item"><div class="mini-icon">?</div><div><strong>Uncertainty</strong><p>${esc(a.confidence)} pattern confidence. Related batches require verification; root cause remains a human decision.</p></div></div></div>`;
  html+=card('Early warning','Evidence, affected production and next verification',warning);
  html+=card('Recovery and delivery','Calculated from stock, capacity and due dates',activePlan?`<div class="decision-grid"><div><small>Plan</small><strong>${esc(activePlan.name)}</strong></div><div><small>Full completion</small><strong>${esc(activePlan.complete)}</strong></div><div><small>Inspection hours</small><strong>${fmt(activePlan.inspectionHours)}</strong></div><div><small>Delay</small><strong>${activePlan.delay===null?'No due date':activePlan.delay?activePlan.delay+' days':'On time'}</strong></div></div><div class="divider"></div><button class="btn" data-view="recovery">Compare recovery →</button>`:empty(a.confirmedShipped>0?'No confirmed stock remains. Assess customer response and replacement.':'Confirm affected stock and its inventory before planning recovery.'));
  html+=card('File support','Import a similar dataset and rerun all outcomes',`<p class="small">Upload one scenario JSON file, one flat inspection CSV/TSV/Excel file, or several related tables. Excel sheets or filenames such as <b>Inspections</b>, <b>Batches</b>, <b>Shipments</b>, and <b>Complaints</b> are recognized.</p><p class="small">Required inspection columns: <b>batch, sample, defects, type</b>. Production, inventory, shipment, cost and action fields improve the analysis.</p><a class="btn" href="./test-files/inspection-template.csv" download>↓ CSV template</a>`);
  html+='</div></div>';
  return html;
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
  html+='<div class="grid cols-2">'+card('Machine comparison','Focused defect: '+a.focus,'<div class="table-wrap"><table><thead><tr><th>Machine</th><th>Sample</th><th>Defects</th><th>Rate</th><th>Evidence</th></tr></thead><tbody>'+compare('machine')+'</tbody></table></div>')+card('Material-lot comparison','Check passing controls before assigning cause','<div class="table-wrap"><table><thead><tr><th>Fabric lot</th><th>Sample</th><th>Defects</th><th>Rate</th><th>Evidence</th></tr></thead><tbody>'+compare('fabric')+'</tbody></table></div>')+'</div>';
  html+=card('Other comparisons','Line, thread, shift and team',columns.slice(1).map(k=>'<details><summary>'+esc(k[0].toUpperCase()+k.slice(1))+'</summary><div class="table-wrap"><table><thead><tr><th>'+esc(k)+'</th><th>Sample</th><th>Defects</th><th>Rate</th><th>Evidence</th></tr></thead><tbody>'+compare(k)+'</tbody></table></div></details>').join(''));
  html+=card('Cause verification','A finding requires a reviewer and supporting record','<form id="cause-form" class="form-grid"><div class="field full"><label>Working or confirmed cause</label><textarea name="cause">'+esc(db.incident.cause)+'</textarea></div><div class="field"><label>Evidence IDs / references</label><input name="causeEvidence" value="'+esc(db.incident.causeEvidence)+'"></div><div class="field"><label>Responsible reviewer</label><input name="causeReviewer" value="'+esc(db.incident.causeReviewer)+'"></div><label class="checkline full"><input type="checkbox" name="causeConfirmed" '+(db.incident.causeConfirmed?'checked':'')+'> Cause confirmed after evidence review</label><button class="btn primary" type="submit">Save finding</button></form>');
  return html;
}
function recovery(a,options){
  let html=head('Capacity-constrained recovery','Recovery & delivery planner','Compare inspection, rework and replacement using the file’s stock and cut-off.');
  html+=warningPanel(a);
  html+=card('Capacity assumptions','Adjust to match available people and lines','<form id="capacity-form" class="form-grid">'+[['inspectors','Inspectors'],['stations','Inspection stations'],['inspectRate','Units per inspector-hour'],['reworkLines','Rework lines'],['reworkRate','Units per line-day']].map(([k,label])=>'<div class="field"><label>'+label+'</label><input type="number" min="1" name="'+k+'" value="'+esc(db.recoveryInputs[k])+'" required></div>').join('')+'<button class="btn primary" type="submit">Recalculate</button></form>');
  html+=!options.length?card('Planning unavailable','Confirmed stock is required',empty(a.confirmedShipped>0?'No confirmed stock remains to inspect. Assess customer response and replacement separately.':'Confirm affected stock and add its inventory quantity to plan recovery.')):'<div class="grid cols-2">'+options.map(o=>'<button type="button" class="option '+(o.name===selectedRecovery?'selected':'')+'" data-plan="'+esc(o.name)+'"><h3>'+esc(o.name)+'</h3><p>'+fmt(o.inspectUnits)+' to inspect · '+fmt(o.reworkUnits)+' to rework · '+fmt(o.replacementUnits)+' replacements</p><div class="option-stats"><span>Inspection <b>'+fmt(o.inspectionHours)+' h</b></span><span>Full completion <b>'+esc(o.complete)+'</b></span>'+(o.firstRelease?'<span>Priority release <b>'+esc(o.firstRelease)+'</b></span>':'')+'<span>Delay <b>'+(o.delay===null?'Unknown':o.delay+' days')+'</b></span><span>Incremental <b>'+money(o.cost)+'</b></span></div></button>').join('')+'</div>';
  const chosen=options.find(o=>o.name===selectedRecovery)||options[0];
  if(chosen)html+=card('Selected sequence','Estimated stages under the stated capacity','<div class="steps">'+[['Inspection',chosen.inspectionDays],['Rework',chosen.reworkDays],['Replacement',chosen.productionDays],['Release, packing and shipment',1]].filter(x=>x[1]>0).map(x=>'<span class="step">'+esc(x[0])+' · '+Math.ceil(x[1]*10)/10+' d</span>').join('<span class="step-arrow">→</span>')+'</div>'+(chosen.firstRelease?'<p class="small">Priority units first release: '+esc(chosen.firstRelease)+'. Full order completion: '+esc(chosen.complete)+'.</p>':'')+'<p class="note">'+esc(chosen.assumptions)+'. Shipment cut-off: '+esc(a.due||'not supplied')+'. Estimates are scenario comparisons, not a minute-by-minute shop-floor schedule.</p>');
  return html;
}
function cost(a){
  const c=db.costInputs,economics=deriveCost(db,a);
  let html=head('Cost of poor quality','Quality cost & prevention value','Enter actual cost categories and assumptions to calculate financial outcomes.');
  html+=warningPanel(a);
  html+='<div class="grid cols-4">'+metric('Known COPQ',money(economics.known),a.costCoverage+'/4 categories recorded','red')+metric('Cost per acceptable garment',money2(economics.perAccepted),'Requires complete costs and accepted units','blue')+metric('Expected avoided loss',money(economics.avoided),'Failure cost × recurrence × reduction','teal')+metric('Prevention ROI',pct(economics.roi),'Expected avoided loss less prevention cost','amber')+'</div>';
  html+=card('Cost categories','Unknown values stay blank; uploaded data never inherits demo costs','<form id="cost-form" class="form-grid">'+[['prevention','Prevention'],['appraisal','Appraisal'],['internal','Internal failure'],['external','External failure'],['recurrence','Recurrence probability %'],['reduction','Expected defect reduction %']].map(([k,label])=>'<div class="field"><label>'+label+'</label><input name="'+k+'" type="number" min="0" step="any" '+(['recurrence','reduction'].includes(k)?'max="100"':'')+' value="'+esc(c[k]??'')+'"></div>').join('')+'<button class="btn primary" type="submit">Update cost model</button></form><p class="note">Known sum can be partial. ROI uses internal and external failure costs, recurrence, reduction and prevention investment. It is withheld when any input is unknown.</p>');
  if(db.interventions.length)html+=card('Corrective action alternatives','Uploaded interventions and their stated assumptions','<div class="table-wrap"><table><thead><tr><th>Option</th><th>Cost</th><th>Days</th><th>Reduction</th><th>Confidence</th><th>Delivery</th></tr></thead><tbody>'+db.interventions.map(x=>rowHtml([esc(x.name),money(x.cost),fmt(x.days),pct(x.reduction),pct(x.confidence),esc(x.delivery)])).join('')+'</tbody></table></div>');
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
  return {generated:new Date().toISOString(),source:db.sourceName,scenario:db.scenario?.title,focus:a.focus,reference:a.reference.id,confidence:a.confidence,confirmed:a.confirmed.map(b=>b.id),precautionary:a.precautionary.map(b=>b.id),confirmedStock:a.confirmedStock,confirmedShipped:a.confirmedShipped,focusDefectRate:a.focusSample?a.focusDefects/a.focusSample*100:null,costKnown:economics.known,costCoverage:a.costCoverage,costPerAccepted:economics.perAccepted,expectedFailureLoss:economics.expectedLoss,expectedAvoidedLoss:economics.avoided,preventionRoi:economics.roi,effectivenessDecision:effect.decision,implementationDate:effect.implementedAt,baselineRate:effect.baselineRate,postRate:effect.postRate,cutoff:a.due,recoveryName:selected?.name||null,recoveryCompletion:selected?.complete||null,recoveryDelay:selected?.delay??null,recoveryCost:selected?.cost??null,recoveryInspectUnits:selected?.inspectUnits??null,recovery:selected||null,warnings:a.warnings,exposure:a.exposure.map(b=>({batch:b.id,sku:b.sku,factory:b.factory,line:b.line,machine:b.machine,fabric:b.fabric,thread:b.thread,inventory:b.inventory,shipped:b.shipped,scope:b.scope,reason:b.reason})),inspections:db.inspections.map(i=>({id:i.id,batch:i.batch,date:i.date,stage:i.stage,type:i.type,sample:i.sample,defects:i.defects,disposition:i.disposition})),actions:db.actions.map(x=>({id:x.id,title:x.title,owner:x.owner,status:x.status,completedAt:x.completedAt,evidence:x.evidence})),costCategories:a.costRows.map(([category,amount])=>({category,amount})),recoveryAlternatives:options.map(x=>({name:x.name,inspectUnits:x.inspectUnits,reworkUnits:x.reworkUnits,replacementUnits:x.replacementUnits,firstRelease:x.firstRelease,complete:x.complete,delay:x.delay,cost:x.cost})),verificationChecks:Object.entries(effect.checks).map(([period,x])=>({period,due:x.due,date:x.date,evidence:x.evidence,valid:x.valid})),audit:db.audit.map(x=>({event:x.event||x.action,date:x.date||x.at,actor:x.actor||'Local user'}))};
}
function downloadReport(type){
  const a=model(),options=recoveryOptions(db,a),r=reportData(a,options),stem='factorysphere-'+today();
  for(const row of r.inspections){const source=db.inspections.find(i=>i.id===row.id);row.threshold=source?.threshold??null;row.thresholdSource=source?.thresholdAssumed?'Screening assumption':'Supplied or reviewed';row.reviewStatus=source?.dispositionInferred?'Inferred':'Reviewed or supplied';if(source?.thresholdAssumed&&source?.dispositionInferred)row.disposition='Screening '+row.disposition}
  if(type==='csv'){
    const rows=[['Section','ID','Field','Value']];
    for(const [k,v] of Object.entries(r))if(!Array.isArray(v)&&typeof v!=='object')rows.push(['Summary','',k,v]);
    for(const b of r.exposure)for(const [k,v] of Object.entries(b))rows.push(['Exposure',b.batch,k,v]);
    for(const i of r.inspections)for(const [k,v] of Object.entries(i))rows.push(['Inspection',i.id,k,v]);
    for(const x of r.actions)for(const [k,v] of Object.entries(x))rows.push(['CAPA',x.id,k,v]);
    for(const x of r.costCategories)rows.push(['Cost',x.category,'amount',x.amount]);
    for(const x of r.recoveryAlternatives)for(const [k,v] of Object.entries(x))rows.push(['Recovery',x.name,k,v]);
    for(const x of r.verificationChecks)for(const [k,v] of Object.entries(x))rows.push(['Verification',x.period,k,v]);
    for(const x of r.audit)for(const [k,v] of Object.entries(x))rows.push(['Audit',x.date,k,v]);
    downloadFile(stem+'.csv','\ufeff'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n'),'text/csv;charset=utf-8');return;
  }
  const summary=[['Source',r.source],['Scenario',r.scenario],['Defect focus',r.focus],['Reference batch',r.reference],['Confirmed batches',r.confirmed.join(', ')||'None'],['Precautionary batches',r.precautionary.join(', ')||'None'],['Confirmed stock',fmt(r.confirmedStock)],['Confirmed shipped',fmt(r.confirmedShipped)],['Defect rate',pct(r.focusDefectRate)],['Known quality cost',money(r.costKnown)],['Cost coverage',r.costCoverage+'/4'],['Effectiveness decision',r.effectivenessDecision],['Implementation date',r.implementationDate||'Unavailable'],['Observed post-action rate',pct(r.postRate)],['Shipment cut-off',r.cutoff||'Unavailable'],['Selected recovery',r.recovery?.name||'Unavailable'],['Recovery completion',r.recovery?.complete||'Unavailable'],['Estimated delay',r.recovery?.delay==null?'Unavailable':r.recovery.delay+' days']];
  summary.push(['Cost per acceptable garment',money2(r.costPerAccepted)],['Expected failure loss',money(r.expectedFailureLoss)],['Expected avoided loss',money(r.expectedAvoidedLoss)],['Prevention ROI',pct(r.preventionRoi)]);
  const doc='<!doctype html><html><head><meta charset="utf-8"><title>Garment quality report</title><style>body{font:14px Arial,sans-serif;color:#20333d;max-width:1100px;margin:36px auto;padding:0 20px}h1{font-size:28px}h2{margin-top:32px}table{border-collapse:collapse;width:100%}th,td{border-bottom:1px solid #dce5e7;padding:9px;text-align:left;vertical-align:top}th{background:#eff5f4}small{color:#617580}p{line-height:1.5}@media print{body{margin:0}}</style></head><body><h1>Garment quality analysis</h1><small>Generated '+esc(r.generated)+' · Local file analysis</small><h2>Outcome</h2><table>'+summary.map(x=>'<tr><th>'+esc(x[0])+'</th><td>'+esc(x[1])+'</td></tr>').join('')+'</table><h2>Exposure and rationale</h2><table><tr><th>Batch</th><th>Scope</th><th>Stock</th><th>Shipped</th><th>Reason</th></tr>'+r.exposure.map(b=>'<tr><td>'+esc(b.batch)+'</td><td>'+esc(b.scope)+'</td><td>'+fmt(b.inventory)+'</td><td>'+fmt(b.shipped)+'</td><td>'+esc(b.reason)+'</td></tr>').join('')+'</table><h2>Inspection evidence</h2><table><tr><th>ID</th><th>Batch</th><th>Stage</th><th>Defect</th><th>Sample</th><th>Defects</th><th>Result</th></tr>'+r.inspections.map(i=>'<tr>'+[i.id,i.batch,i.stage,i.type,fmt(i.sample),fmt(i.defects),i.disposition].map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>').join('')+'</table><h2>CAPA actions</h2><table><tr><th>Action</th><th>Owner</th><th>Status</th><th>Evidence</th></tr>'+r.actions.map(x=>'<tr>'+[x.title,x.owner,x.status,x.evidence||'Missing'].map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>').join('')+'</table><h2>Cost categories</h2><table><tr><th>Category</th><th>Amount</th></tr>'+r.costCategories.map(x=>'<tr><td>'+esc(x.category)+'</td><td>'+esc(money(x.amount))+'</td></tr>').join('')+'</table><h2>Recovery alternatives</h2><table><tr><th>Option</th><th>Inspect</th><th>Rework</th><th>Full completion</th><th>First release</th><th>Delay</th><th>Cost</th></tr>'+r.recoveryAlternatives.map(x=>'<tr>'+[x.name,fmt(x.inspectUnits),fmt(x.reworkUnits),x.complete,x.firstRelease||'—',x.delay==null?'—':x.delay+' days',money(x.cost)].map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>').join('')+'</table><h2>Verification checks</h2><table><tr><th>Period</th><th>Due</th><th>Checked</th><th>Evidence</th><th>Valid</th></tr>'+r.verificationChecks.map(x=>'<tr>'+[x.period,x.due||'—',x.date||'—',x.evidence||'—',x.valid?'Yes':'No'].map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>').join('')+'</table><h2>Audit trail</h2><table><tr><th>When</th><th>Event</th><th>Actor</th></tr>'+r.audit.map(x=>'<tr>'+[x.date,x.event,x.actor].map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>').join('')+'</table><h2>Data limits</h2><p>'+esc(r.warnings.join(' ')||'No normalization warnings.')+'</p></body></html>';
  downloadFile(stem+'.html',doc,'text/html;charset=utf-8');
}
function render(){
  const a=model(),options=recoveryOptions(db,a);
  const pages={overview:()=>dashboard(a,options),trace:()=>trace(a),quality:()=>quality(a),investigate:()=>investigation(a),recovery:()=>recovery(a,options),cost:()=>cost(a),capa:()=>capa(a),learning:()=>learning(a)};
  shell(loadBanner()+(pages[view]||pages.overview)());
  if(notification){notice(notification);notification=''}
}
function resetViews(){focusDefect='Auto';referenceBatch='Auto';selectedBatch=db.batches[0]?.id;scopeFilter='All';factoryFilter='All';stageFilter='All';selectedRecovery=db.incident.selectedScenario||'Inspect all related stock + targeted rework';view='overview'}
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
  const file=$('#fixture-select')?.value||selectedFixture;if(!file)return;
  const token=++loadToken;
  selectedFixture=file;
  loadState={kind:'loading',title:'Loading '+file,message:'The current results remain visible until this file has been parsed and analyzed.'};render();
  try{
    const response=await fetch('./test-files/'+encodeURIComponent(file),{cache:'no-store'});
    if(!response.ok)throw new Error('HTTP '+response.status);
    const next=normalizeDataset(await response.json(),file);
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
  const target=e.target.closest('[data-view]');if(target){view=target.dataset.view;render();return}
  const defect=e.target.closest('[data-focus-type]');if(defect){focusDefect=defect.dataset.focusType;render();return}
  const plan=e.target.closest('[data-plan]');if(plan){selectedRecovery=plan.dataset.plan;db.incident.selectedScenario=selectedRecovery;audit('Recovery option selected');render();return}
  const review=e.target.closest('[data-review-inspection]');if(review){const id=review.dataset.reviewInspection,i=db.inspections.find(x=>x.id===id);if(i){const suffix='"'+CSS.escape(id)+'"',result=document.querySelector('[data-review-result='+suffix+']').value,rawThreshold=document.querySelector('[data-review-threshold='+suffix+']').value.trim(),evidence=document.querySelector('[data-review-evidence='+suffix+']').value.trim(),threshold=rawThreshold===''?null:Number(rawThreshold);if(result==='Unknown'||!evidence||threshold!==null&&(!Number.isFinite(threshold)||threshold<0||threshold>100)){notice('Choose Pass or Fail, provide evidence, and use a threshold from 0 to 100 if entered.');return}invalidateGroundTruth();i.disposition=result;i.dispositionInferred=false;i.evidence=evidence;if(threshold!==null){i.threshold=threshold;i.thresholdAssumed=false}audit('Inspection '+id+' reviewed');render();notice('Inspection result reviewed')}return}
  const saveComplaint=e.target.closest('[data-save-complaint]');if(saveComplaint){const id=saveComplaint.dataset.saveComplaint,c=db.complaints.find(x=>x.id===id);if(c){const decision=document.querySelector('[data-complaint-review="'+CSS.escape(id)+'"]').value;if(c.decision!==decision)invalidateGroundTruth();c.decision=decision;audit('Complaint '+id+' review updated');render();notice('Complaint review saved')}return}
  const saveAction=e.target.closest('[data-save-action]');if(saveAction){const id=saveAction.dataset.saveAction,x=db.actions.find(x=>x.id===id);if(x){const statusValue=document.querySelector('[data-action-status="'+CSS.escape(id)+'"]').value,completedValue=document.querySelector('[data-action-completed="'+CSS.escape(id)+'"]').value;if(statusValue==='Done'&&!completedValue){notice('Set the actual completion date before marking this action Done.');return}if(completedValue>today()){notice('Action completion cannot be in the future.');return}x.status=statusValue;x.evidence=document.querySelector('[data-action-evidence="'+CSS.escape(id)+'"]').value.trim();x.completedAt=statusValue==='Done'?completedValue:'';audit('Action '+id+' updated');notice('Action saved');render()}return}
  const action=e.target.closest('[data-action]')?.dataset.action;
  if(!action)return;
  try{
    if(action==='upload'){let input=$('#file-input');if(!input){input=document.createElement('input');input.id='file-input';input.type='file';input.accept='.json,.csv,.tsv,.xlsx,.xls';input.multiple=true;input.hidden=true;document.body.append(input)}input.click()}
    else if(action==='report-html')downloadReport('html');
    else if(action==='report-csv')downloadReport('csv');
    else if(action==='load-fixture')await loadFixture();
    else if(action==='clear-filters'){scopeFilter='All';factoryFilter='All';render()}
    else if(action==='go-overview'){view='overview';render()}
    else if(action==='close'){const {gates}=closureGates(model());const missing=gates.filter(([,pass])=>!pass).map(([label])=>label);if(missing.length){notice('Closure blocked: '+missing.join('; ')+'.');return}db.incident.closed=true;db.incident.stage='Closed';audit('Case closed');render()}
    else if(action==='reopen'){db.incident.closed=false;db.incident.stage='Reopened';audit('Case reopened');render()}
  }catch(err){notice(err.message)}
});
document.addEventListener('change',async e=>{
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
  const form=e.target;if(!form.id)return;e.preventDefault();const f=new FormData(form),v=k=>String(f.get(k)??'').trim();
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
  selectedFixture=/^\d{2}-.*\.json$/.test(db.sourceName)?db.sourceName:'';
  selectedRecovery=db.incident.selectedScenario||'Inspect all related stock + targeted rework';
  render();
  try{
    const response=await fetch('./test-files/index.json',{cache:'no-store'});
    if(!response.ok)throw new Error('HTTP '+response.status);
    const list=await response.json();
    manifest=Array.isArray(list)?list:list.scenarios||[];
    render();
  }catch{
    loadState={kind:'error',title:'Local case files are unavailable',message:'The local server is not responding. Previously loaded results are still on screen. Start the local service, then reload this page.'};
    render();
  }
}
if(channel)channel.onmessage=e=>{if(e.data?.type==='dataset-updated')syncFromOtherTab()};
else window.addEventListener('storage',e=>{if(e.key===KEY)syncFromOtherTab()});
boot();
document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkBuild()});
window.addEventListener('focus',checkBuild);
setInterval(checkBuild,30000);
