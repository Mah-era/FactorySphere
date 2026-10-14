const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const quote=x=>'"'+String(x??'').replaceAll('"','""')+'"';

export function validateScenario(payload,base){
  const data=payload?.data??payload;
  if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('Expected a scenario JSON object.');
  if(payload.format&&payload.format!=='garment-quality-scenario-v1')throw new Error('Unsupported scenario format.');
  for(const key of ['factories','products','orders','materials','batches','inspections','complaints','shipments','actions','interventions','lessons']){
    if(!Array.isArray(data[key]))throw new Error(`Missing ${key} array.`);
  }
  if(!data.incident||typeof data.incident!=='object'||!data.incident.verification)throw new Error('Missing incident or verification state.');
  if(!data.batches.length)throw new Error('At least one batch is required.');
  const batchIds=new Set(data.batches.map(b=>b.id));
  if(batchIds.size!==data.batches.length)throw new Error('Duplicate batch IDs.');
  for(const b of data.batches){
    if(!b.id||!b.sku||!b.order||!b.factory||!b.machine||!Number.isFinite(Number(b.units))||!Number.isFinite(Number(b.inventory))||!Number.isFinite(Number(b.shipped)))throw new Error(`Invalid batch ${b.id||'(unknown)'}.`);
    if(Number(b.inventory)+Number(b.shipped)!==Number(b.units))throw new Error(`Batch ${b.id} stock and shipped units do not reconcile.`);
  }
  for(const i of data.inspections){if(!batchIds.has(i.batch)||!Number.isFinite(Number(i.sample))||Number(i.sample)<=0||!Number.isFinite(Number(i.defects))||Number(i.defects)<0||Number(i.defects)>Number(i.sample))throw new Error(`Invalid inspection ${i.id||'(unknown)'}.`)}
  for(const c of data.complaints)if(!batchIds.has(c.batch))throw new Error(`Complaint ${c.id||'(unknown)'} has an unknown batch.`);
  for(const s of data.shipments)if(!batchIds.has(s.batch))throw new Error(`Shipment ${s.id||'(unknown)'} has an unknown batch.`);
  const allowed=['factories','products','orders','materials','batches','processConditions','fabricRolls','rework','groundTruth','inspections','complaints','shipments','incident','actions','interventions','lessons','scenario','costInputs','recoveryInputs','audit','postRate','verificationEvidence','sideEffect'];
  const clean=structuredClone(base);
  for(const key of allowed)if(Object.hasOwn(data,key))clean[key]=structuredClone(data[key]);
  clean.scenario=payload.scenario??data.scenario??{title:'Uploaded scenario',description:'Imported JSON case',focus:'Review exposure and quality signals'};
  return clean;
}

function csvRows(text){
  const rows=[];let row=[],cell='',quoted=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(ch==='"'&&quoted&&text[i+1]==='"'){cell+='"';i++}
    else if(ch==='"')quoted=!quoted;
    else if(ch===','&&!quoted){row.push(cell);cell=''}
    else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cell);cell='';if(row.some(x=>x.trim()))rows.push(row);row=[]}
    else cell+=ch;
  }
  if(quoted)throw new Error('CSV has an unclosed quoted value.');
  row.push(cell);if(row.some(x=>x.trim()))rows.push(row);
  return rows;
}

export function parseInspectionCsv(text,db){
  const rows=csvRows(text);if(rows.length<2)throw new Error('CSV needs a header and at least one inspection.');
  const headers=rows.shift().map(x=>x.trim().toLowerCase().replace(/^\ufeff/,''));
  for(const field of ['batch','stage','type','location','sample','defects','inspector'])if(!headers.includes(field))throw new Error(`Missing CSV column: ${field}.`);
  const batchIds=new Set(db.batches.map(b=>b.id)),seen=new Set(db.inspections.map(i=>i.id));
  const output=[];
  for(const [index,values] of rows.entries()){
    const r=Object.fromEntries(headers.map((h,i)=>[h,(values[i]??'').trim()]));
    if(!batchIds.has(r.batch))throw new Error(`Row ${index+2}: unknown batch ${r.batch}.`);
    const sample=Number(r.sample),defects=Number(r.defects);
    if(!Number.isInteger(sample)||sample<=0||!Number.isInteger(defects)||defects<0||defects>sample)throw new Error(`Row ${index+2}: invalid sample or defects.`);
    let id=r.id||`UPL-${Date.now()}-${index+1}`;
    if(seen.has(id))throw new Error(`Row ${index+2}: duplicate inspection ID ${id}.`);seen.add(id);
    const threshold=Number(r.threshold||2.5);
    output.push({id,batch:r.batch,stage:r.stage,type:r.type,location:r.location,sample,defects,inspector:r.inspector,date:r.date||new Date().toISOString().slice(0,10),severity:r.severity||'Major',threshold,operation:r.operation||'Imported inspection',disposition:defects/sample*100>threshold?'Fail':'Pass',evidence:r.evidence||'CSV import',notes:r.notes||''});
  }
  return output;
}

export function reportData(db,exposure,filters,recovery){
  const batches=exposure.filter(b=>(filters.factory==='All'||b.factory===filters.factory)&&(filters.scope==='All'||b.scope===filters.scope));
  const ids=new Set(batches.map(b=>b.id));
  const inspections=db.inspections.filter(i=>ids.has(i.batch)&&(filters.defect==='All'||i.type===filters.defect));
  const sample=inspections.reduce((n,i)=>n+i.sample,0),defects=inspections.reduce((n,i)=>n+i.defects,0);
  const confirmed=batches.filter(b=>b.scope==='Confirmed');
  const costs=db.costInputs||{prevention:1900,appraisal:3200,internal:5480,external:4240};
  return {scenario:db.scenario?.title||'Baseline seam failure',filters,batches,inspections,sample,defects,confirmedStock:confirmed.reduce((n,b)=>n+b.inventory,0),shipped:confirmed.reduce((n,b)=>n+b.shipped,0),openActions:db.actions.filter(a=>a.status!=='Done').length,costs,totalCost:['prevention','appraisal','internal','external'].reduce((n,key)=>n+Number(costs[key]||0),0),recovery,incident:db.incident,actions:db.actions};
}

export function reportHtml(r){
  const date=new Date().toISOString().slice(0,10);
  const table=(heads,rows)=>'<table><thead><tr>'+heads.map(h=>'<th>'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(c=>'<td>'+esc(c)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
  let html='<!doctype html><html lang="en"><meta charset="utf-8"><title>Garment Quality Report · '+esc(r.scenario)+'</title><style>body{font:14px Arial,sans-serif;max-width:1100px;margin:38px auto;color:#203342}h1,h2{color:#143446}h1{font-size:28px}h2{font-size:18px;margin-top:32px}p{line-height:1.5}.eyebrow{text-transform:uppercase;letter-spacing:.12em;color:#608482;font-size:11px;font-weight:bold}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.metric{padding:16px;background:#edf5f2;border-radius:8px}.metric b{display:block;font-size:20px;margin-top:5px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{padding:9px;text-align:left;border-bottom:1px solid #dce6e6}th{background:#e8f0ed}.note{color:#62727b;font-size:11px}@media print{body{margin:12mm}.no-print{display:none}}</style>';
  html+='<body><p class="eyebrow">Garment Quality Intelligence · '+date+'</p><h1>Quality decision report</h1><p><b>Scenario:</b> '+esc(r.scenario)+'<br><b>Incident:</b> '+esc(r.incident.id)+' · '+esc(r.incident.stage)+'<br><b>Filters:</b> factory '+esc(r.filters.factory)+', scope '+esc(r.filters.scope)+', defect '+esc(r.filters.defect)+'</p><button class="no-print" onclick="window.print()">Print / Save as PDF</button>';
  html+='<div class="metrics"><div class="metric">Confirmed stock<b>'+r.confirmedStock.toLocaleString()+'</b></div><div class="metric">Already shipped<b>'+r.shipped.toLocaleString()+'</b></div><div class="metric">Defects / 100<b>'+(r.sample?(r.defects/r.sample*100).toFixed(1)+'%':'—')+'</b></div><div class="metric">Quality cost<b>$'+Math.round(r.totalCost).toLocaleString()+'</b></div></div>';
  html+='<h2>Exposure and genealogy</h2>'+table(['Batch','SKU','Factory / line','Reason','Stock','Shipped','Scope'],r.batches.map(b=>[b.id,b.sku,b.factory+' / '+b.line,b.reason,b.inventory,b.shipped,b.scope]));
  html+='<h2>Inspection evidence</h2>'+table(['Record','Batch','Stage','Defect','Defects / sample','Disposition'],r.inspections.map(i=>[i.id,i.batch,i.stage,i.type,i.defects+' / '+i.sample,i.disposition]));
  html+='<h2>Recovery decision</h2><p>'+esc(r.recovery.name)+' · '+esc(r.recovery.date)+' estimated completion · '+r.recovery.inspectionHours.toFixed(1)+' inspector-hours · $'+Math.round(r.recovery.cost).toLocaleString()+' estimated recovery cost.</p>';
  html+='<h2>CAPA action register</h2>'+table(['Action','Owner','Due','Status','Evidence'],r.actions.map(a=>[a.id+' '+a.title,a.owner,a.due,a.status,a.evidence||'Missing']));
  html+='<p class="note">Synthetic demonstration report. Rates, recovery estimates and cost assumptions require operational review before use in live decisions.</p></body></html>';
  return html;
}

export function reportCsv(r){
  const rows=[['section','metric','value'],['summary','scenario',r.scenario],['summary','incident',r.incident.id],['summary','confirmed_stock',r.confirmedStock],['summary','already_shipped',r.shipped],['summary','inspection_sample',r.sample],['summary','defective_units',r.defects],['summary','quality_cost',r.totalCost],['recovery','plan',r.recovery.name],['recovery','completion',r.recovery.date],['recovery','estimated_cost',r.recovery.cost]];
  for(const b of r.batches)rows.push(['batch',b.id,`${b.scope}; ${b.sku}; ${b.factory}/${b.line}; stock ${b.inventory}; shipped ${b.shipped}`]);
  for(const i of r.inspections)rows.push(['inspection',i.id,`${i.batch}; ${i.type}; ${i.defects}/${i.sample}; ${i.disposition}`]);
  for(const a of r.actions)rows.push(['capa_action',a.id,`${a.status}; ${a.owner}; ${a.evidence||'evidence missing'}`]);
  return rows.map(row=>row.map(quote).join(',')).join('\r\n')+'\r\n';
}

export function downloadText(filename,content,type){
  const url=URL.createObjectURL(new Blob([content],{type}));
  const link=document.createElement('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
