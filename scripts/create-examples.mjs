import {writeFileSync,mkdirSync} from 'node:fs';
import XLSX from '../dist/vendor/xlsx.full.min.js';
mkdirSync('examples',{recursive:true});
const headers=['batch_id','style','factory_id','machine_group','production_qty','on_hand','shipped_units','inspection_date','inspection_stage','defect_type','sample_size','defective_quantity'];
const rows=[
['ZIP-701','JACKET-X','F-ZIP','MG-Z1',1000,600,400,'2026-10-12','Final random','Zip failure',100,9],
['ZIP-702','JACKET-X','F-ZIP','MG-Z2',800,800,0,'2026-10-12','Final random','Zip failure',100,1],
['ZIP-703','JACKET-X','F-ZIP','MG-Z1',500,500,0,'2026-10-13','Final random','Zip failure',100,7]
];
writeFileSync('examples/unseen-inspections.csv',[headers,...rows].map(r=>r.join(',')).join('\n')+'\n');
const wb=XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['batch_id','style','factory_id','machine_group','units','inventory','shipped'],['HOOD-21','HOODIE-Y','F-HOOD','MG-H1',700,500,200],['HOOD-22','HOODIE-Y','F-HOOD','MG-H2',650,650,0]]),'Batches');
XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['inspection_id','batch_id','inspection_stage','inspection_date','sample_size','defective_quantity','defect_type'],['Q-H1','HOOD-21','End-line','2026-10-12',100,10,'Puckering'],['Q-H2','HOOD-22','End-line','2026-10-12',100,1,'Puckering']]),'Inspections');
writeFileSync('examples/unseen-multisheet.xlsx',XLSX.write(wb,{type:'buffer',bookType:'xlsx'}));
console.log('Created independent CSV and XLSX examples.');
