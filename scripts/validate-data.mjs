import {seed} from '../dist/data.js';

const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const ids=(items,name)=>{const list=items.map(x=>x.id);assert(new Set(list).size===list.length,`Duplicate ${name} ID`);return new Set(list)};
const batchIds=ids(seed.batches,'batch'),orderIds=ids(seed.orders,'order'),skuIds=new Set(seed.products.map(x=>x.sku)),materialIds=ids(seed.materials,'material');
ids(seed.inspections,'inspection');ids(seed.complaints,'complaint');ids(seed.shipments,'shipment');ids(seed.actions,'action');
for(const b of seed.batches){
  assert(orderIds.has(b.order),`${b.id}: unknown order`);
  assert(skuIds.has(b.sku),`${b.id}: unknown SKU`);
  for(const field of ['fabric','thread','trim'])assert(materialIds.has(b[field]),`${b.id}: unknown ${field}`);
  assert(b.inventory+b.shipped===b.units,`${b.id}: stock and shipped units do not reconcile`);
}
for(const i of seed.inspections){assert(batchIds.has(i.batch),`${i.id}: unknown batch`);assert(i.defects<=i.sample&&i.sample>0,`${i.id}: invalid sample`)}
for(const c of seed.complaints)assert(batchIds.has(c.batch),`${c.id}: unknown batch`);
for(const s of seed.shipments)assert(batchIds.has(s.batch),`${s.id}: unknown batch`);
for(const r of seed.fabricRolls)assert(batchIds.has(r.batch)&&materialIds.has(r.lot),`${r.id}: invalid roll linkage`);
for(const r of seed.rework)assert(batchIds.has(r.batch),`${r.id}: unknown rework batch`);
const selected=id=>seed.batches.find(x=>x.id===id);
assert(selected('B-1042').fabric===selected('B-1043').fabric,'Shared-fabric control missing');
assert(selected('B-1042').thread===selected('B-1043').thread,'Shared-thread control missing');
assert(selected('B-1042').machine!==selected('B-1043').machine,'Different-machine control missing');
assert(selected('B-1042').machine===selected('B-1044').machine,'Repeat-machine signal missing');
assert(selected('B-1042').fabric!==selected('B-1044').fabric,'Different-fabric case missing');
assert(seed.groundTruth.confirmed.every(x=>batchIds.has(x)),'Invalid confirmed ground truth');
assert(seed.groundTruth.precautionary.every(x=>batchIds.has(x)),'Invalid precautionary ground truth');
console.log(`Validated ${seed.batches.length} batches, ${seed.inspections.length} inspections, ${seed.complaints.length} complaints, ${seed.shipments.length} shipments and planted relationships.`);
