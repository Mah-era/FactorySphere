import {seed} from '../dist/data.js';
import {validateScenario,parseInspectionCsv,reportCsv,reportHtml} from '../dist/file-tools.js';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';

const root=new URL('../dist/test-files/',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('index.json',root),'utf8'));
if(manifest.length!==20)throw new Error(`Expected 20 scenarios, found ${manifest.length}`);
const names=new Set();
for(const item of manifest){
  if(names.has(item.id))throw new Error(`Duplicate scenario ${item.id}`);names.add(item.id);
  const payload=JSON.parse(await readFile(new URL(item.file,root),'utf8'));
  const data=validateScenario(payload,seed);
  if(data.scenario.id!==item.id)throw new Error(`${item.file}: metadata mismatch`);
  if(!data.batches.length||!data.inspections.length)throw new Error(`${item.file}: insufficient records`);
}
const csv=await readFile(new URL('inspection-template.csv',root),'utf8');
if(parseInspectionCsv(csv,seed).length!==1)throw new Error('CSV template did not import');
const report={scenario:'Test',filters:{factory:'All',scope:'All',defect:'All'},batches:[],inspections:[],sample:0,defects:0,confirmedStock:0,shipped:0,openActions:0,costs:{},totalCost:0,recovery:{name:'Test',date:'2026-10-14',inspectionHours:0,cost:0},incident:seed.incident,actions:[]};
if(!reportHtml(report).includes('Quality decision report')||!reportCsv(report).includes('"summary","scenario","Test"'))throw new Error('Report output invalid');
console.log(`Validated ${manifest.length} scenario JSON files, CSV upload template and both report formats.`);
