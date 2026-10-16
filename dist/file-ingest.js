import {normalizeDataset} from './analysis-core.js';

const normalized=s=>String(s).toLowerCase().replace(/[^a-z0-9]/g,'');
function parseDelimited(text,delimiter){
  const rows=[];let row=[],cell='',quoted=false;
  text=text.replace(/^\ufeff/,'');
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(c==='"'&&quoted&&text[i+1]==='"'){cell+='"';i++}
    else if(c==='"')quoted=!quoted;
    else if(c===delimiter&&!quoted){row.push(cell);cell=''}
    else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);cell='';if(row.some(x=>x.trim()))rows.push(row);row=[]}
    else cell+=c;
  }
  if(quoted)throw new Error('A quoted value is not closed.');
  row.push(cell);if(row.some(x=>x.trim()))rows.push(row);
  if(rows.length<2)throw new Error('Tabular files need a header and at least one data row.');
  const header=rows.shift().map(x=>x.trim());
  return rows.map((cells,index)=>{const item={};header.forEach((h,j)=>{item[h]=cells[j]??''});item.__row=index+2;return item});
}
function classify(name,rows){
  const n=normalized(name),h=new Set(Object.keys(rows[0]||{}).map(normalized));
  // A complete inspection signature is stronger than an incidental filename
  // such as factory-review.csv, material-check.csv or customer-returns.csv.
  if(['sample','inspected','inspectionquantity','samplesize','sampledunits'].some(k=>h.has(k))&&['defects','defective','defectivequantity','defectqty','defectcount'].some(k=>h.has(k)))return 'inspections';
  if(n.includes('inspection'))return 'inspections';
  if(n.includes('complaint')||n.includes('return'))return 'complaints';
  if(n.includes('shipment')||n.includes('shipping'))return 'shipments';
  if(n.includes('action')||n.includes('capa'))return 'actions';
  if(n.includes('rework'))return 'rework';
  if(n.includes('cost'))return 'costs';
  if(n.includes('quality'))return 'inspections';
  if(n.includes('order'))return 'orders';
  if(n.includes('product')||n.includes('style'))return 'products';
  if(n.includes('factory'))return 'factories';
  if(n.includes('material')||n.includes('fabric')||n.includes('thread'))return 'materials';
  if(n.includes('batch')||n.includes('production'))return 'batches';
  if(h.has('batch')||h.has('batchid'))return 'batches';
  throw new Error(`Could not identify ${name}. Use a recognizable sheet/file name or inspection sample and defects columns.`);
}
function addRows(target,name,rows){const type=classify(name,rows);if(type==='costs'){const headers=Object.keys(rows[0]||{}).map(normalized);if(headers.some(h=>['category','costcategory','type'].includes(h))&&headers.some(h=>['amount','cost','value'].includes(h))){for(const row of rows){const fields=Object.fromEntries(Object.entries(row).map(([k,v])=>[normalized(k),v])),category=String(fields.category??fields.costcategory??fields.type??'').toLowerCase(),rawAmount=fields.amount??fields.cost??fields.value;if(rawAmount===undefined||rawAmount===null||String(rawAmount).trim()==='')continue;const amount=Number(String(rawAmount).replace(/[$,%\s,]/g,''));if(!Number.isFinite(amount)||amount<0)throw new Error('Cost amount must be a nonnegative number in '+name);const field=/prevention/.test(category)?'prevention':/appraisal|inspection/.test(category)?'appraisal':/internal/.test(category)?'internal':/external/.test(category)?'external':/recurrence/.test(category)?'recurrence':/reduction/.test(category)?'reduction':null;if(field){if(!['recurrence','reduction'].includes(field)){target.costEntries??=[];target.costEntries.push({id:String(fields.id||fields.costid||'COST-'+(target.costEntries.length+1)),category:field,amount,order:String(fields.order||fields.orderid||''),factory:String(fields.factory||fields.factoryid||''),supplier:String(fields.supplier||''),defect:String(fields.defect||fields.defecttype||''),description:String(fields.description||'Imported cost')})}target.costs??={};target.costs[field]=['recurrence','reduction'].includes(field)?amount:(Number(target.costs[field]||0)+amount)}}}else target.costs={...(target.costs||{}),...rows[0]};return}target[type]??=[];target[type].push(...rows)}

export async function readDataFiles(fileList){
  const files=[...fileList];if(!files.length)throw new Error('Choose a file first.');
  const size=files.reduce((n,f)=>n+f.size,0);const limit=files.length===1&&files[0].name.toLowerCase().endsWith('.json')?50:20;if(size>limit*1024*1024)throw new Error('The selected files exceed '+limit+' MB.');
  if(files.length===1&&files[0].name.toLowerCase().endsWith('.json')){
    let data;try{data=JSON.parse(await files[0].text())}catch{throw new Error('This JSON file could not be parsed.')}
    return normalizeDataset(data,files[0].name);
  }
  if(files.some(f=>f.name.toLowerCase().endsWith('.json')))throw new Error('Upload JSON by itself, or combine CSV/TSV/Excel files.');
  const merged={};
  for(const file of files){
    const name=file.name.toLowerCase();
    if(name.endsWith('.csv')||name.endsWith('.tsv')){const rows=parseDelimited(await file.text(),name.endsWith('.tsv')?'\t':',');addRows(merged,file.name,rows)}
    else if(name.endsWith('.xlsx')||name.endsWith('.xls')){
      if(!window.XLSX)throw new Error('The local Excel parser is unavailable.');
      let workbook;try{workbook=window.XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:true})}catch{throw new Error(`${file.name} could not be read as an Excel workbook.`)}
      for(const sheet of workbook.SheetNames){const rows=window.XLSX.utils.sheet_to_json(workbook.Sheets[sheet],{defval:'',raw:true});if(rows.length)addRows(merged,sheet,rows)}
    }else throw new Error(`Unsupported file: ${file.name}. Use JSON, CSV, TSV, XLSX or XLS.`);
  }
  if(!merged.inspections?.length)throw new Error('No inspection data found. Supply an inspections file or sheet with sample and defects columns.');
  return normalizeDataset(merged,files.map(f=>f.name).join(' + '));
}

export function downloadFile(filename,content,mime){const url=URL.createObjectURL(new Blob([content],{type:mime}));const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}
