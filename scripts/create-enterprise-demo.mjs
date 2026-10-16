import {writeFile} from 'node:fs/promises';
import {seed} from '../dist/data.js';
const data=structuredClone(seed);
data.scenario={title:'Multi-factory quality operations',description:'Synthetic demonstration: 4 factories, 54 batches, changing seam performance, material controls and customer signals. All records are illustrative.',focus:'Contain current seam exceptions and verify recovery capacity.'};
data.factories.push({id:'F-03',name:'Narayanganj Manufacturing'},{id:'F-04',name:'Chattogram Apparel'});
data.products.push({sku:'KN-450',name:'Performance Knit Polo',style:'Knit polo',complexity:1.2});
const start=new Date('2026-08-20T12:00:00Z');
for(let k=0;k<48;k++){
  const date=new Date(start);date.setUTCDate(date.getUTCDate()+k);const iso=date.toISOString().slice(0,10);
  const id='B-'+(2001+k),factory=k<24?'F-01':k<32?'F-02':k<40?'F-03':'F-04',sku=k<24?'ST-204':k<32?'TS-118':k<40?'TR-330':'KN-450';
  const line=k<24?'L-04':'L-'+String(10+Math.floor(k/8)).padStart(2,'0');
  const machine=k<24?'MG-7':'MG-'+(20+Math.floor(k/8));
  const sample=150+(k%4)*50,defects=k<24?(k>18?10+k%4:1+k%3):(k%7===0?9:1+k%3),type=k<24?'Open seam':['Shade variation','Measurement deviation','Puckering'][Math.floor((k-24)/8)];
  data.batches.push({id,order:'PO-H'+Math.floor(k/8),sku,factory,line,machine,team:'Team '+String.fromCharCode(65+k%6),shift:k%3?'Day':'Night',fabric:'FAB-'+(700+Math.floor(k/6)),thread:'THR-'+(100+k%4),trim:'TRM-033',cutting:'CUT-'+(500+k),sewing:'SEW-'+(500+k),finishing:'FIN-'+(500+k),packing:'PK-'+(500+k),start:iso,end:iso,units:1200,accepted:1200-defects*3,inventory:k<32?0:900,shipped:k<32?1200:300,location:k<32?'Customer warehouse':'Factory finished goods',status:k<32?'Delivered':'Available',firstPass:100-defects/sample*100});
  data.inspections.push({id:'INS-H'+k,batch:id,stage:'Final random',date:iso,sample,defects,type,location:k<24?'Side seam':'Body panel',severity:k%11?'Major':'Critical',threshold:2.5,inspector:'QA '+(k%4+1),operation:k<24?'Side seam sewing':'Final assembly',disposition:defects/sample*100>2.5?'Fail':'Pass',evidence:'Synthetic inspection register H'+k});
  data.shipments.push({id:'SHP-H'+k,batch:id,units:k<32?1200:300,date:iso,status:'Delivered',destination:k%2?'United Kingdom':'Germany',cutoff:iso});
}
data.groundTruth=null;
data.workspace={planning:{shiftHours:8,workingDays:6,inspectionCost:15,holdingCost:.02,machineAvailability:85,skillAvailability:90},hypotheses:[{id:'HYP-DEMO',category:'Machine',hypothesis:'Tension drift after setup is associated with seam failures.',test:'Compare MG-7 with MG-3 using the same fabric and stage; inspect setup logs.',status:'Untested',reviewer:'Factory quality manager',evidence:'INS-611, INS-604, INS-613',date:'2026-10-15'}],whys:['The side seam opens under light pull.','Stitch formation is inconsistent after setup.','Machine tension drift is suspected; testing is still required.','',''],containment:[{id:'CNT-DEMO',action:'Quarantine stock',batches:'B-1042, B-1044',owner:'M. Rahman',due:'2026-10-15',status:'In progress',evidence:'Hold register H-1042'}],governance:{approver:'',approvalEvidence:'',verifier:'Customer quality manager'}};
await writeFile(new URL('../dist/test-files/enterprise-demonstration.json',import.meta.url),JSON.stringify({format:'garment-quality-scenario-v1',data},null,2)+'\n');
console.log(`Created illustrative enterprise demonstration: ${data.batches.length} batches, ${data.inspections.length} inspections.`);
