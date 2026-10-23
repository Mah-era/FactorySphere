import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {seed} from '../dist/data.js';
import {normalizeDataset,deriveAnalysis,recoveryOptions} from '../dist/analysis-core.js';
import {scheduleRecovery} from '../dist/intelligence.js';
import {visualSpecs,standaloneSvg,chartCsv,visualReport,visualLibrary} from '../dist/visualizations.js';

const db=normalizeDataset(seed),a=deriveAnalysis(db),plans=scheduleRecovery(db,a,recoveryOptions(db,a));
const specs=visualSpecs(db,a,plans),get=id=>specs.find(s=>s.id===id);
assert.equal(specs.length,50);assert.equal(new Set(specs.map(s=>s.id)).size,50);
assert.equal(get('complaint-categories').rows.reduce((n,r)=>n+r.value,0),3);
assert.equal(get('complaint-cost').rows.find(r=>r.label==='Northline Retail').value,1860);
assert.equal(get('cost-waterfall').rows.reduce((n,r)=>n+r.value,0),14820);
assert.equal(get('action-owner').rows.reduce((n,r)=>n+r.value,0),4);
assert.equal(get('ledger-factory').rows.length,0);
assert.equal(get('recovery-frontier').rows.length,7);
assert.equal(get('exposure-stock').rows.reduce((n,r)=>n+r.inventory,0),11200);
assert(get('machine-rates').rows.every(r=>r.low<=r.value&&r.high>=r.value));
assert(standaloneSvg(get('recovery-frontier')).includes(plans[0].name.replace(/&/g,'&amp;')));
const hostile={...get('complaint-cost'),source:'<script>alert(1)</script>',rows:[{label:'=CMD("bad")',value:2}]};
assert(!standaloneSvg(hostile).includes('<script>'));assert(chartCsv(hostile).includes("'=CMD"));
const minimal=normalizeDataset({inspections:[{batch:'N',sample:10,defects:1,type:'Seam'}]});
const ma=deriveAnalysis(minimal),ms=visualSpecs(minimal,ma,[]);
assert.equal(ms.find(s=>s.id==='exposure-stock').rows.length,0);
assert.equal(ms.find(s=>s.id==='complaint-trend').rows.length,0);
assert(standaloneSvg(ms.find(s=>s.id==='cutoff-release')).includes('Unavailable from the active data'));
assert(!visualLibrary(db,a,plans,'','cost').includes('data-visual-id="machine-rates"'));
const manifest=JSON.parse(readFileSync(new URL('../dist/test-files/index.json',import.meta.url)));
for(const item of [...manifest,{file:'enterprise-demonstration.json'}]){
  const d=normalizeDataset(JSON.parse(readFileSync(new URL('../dist/test-files/'+item.file,import.meta.url)))),analysis=deriveAnalysis(d),p=scheduleRecovery(d,analysis,recoveryOptions(d,analysis));
  for(const spec of visualSpecs(d,analysis,p)){
    const svg=standaloneSvg(spec);assert(!/NaN|Infinity|undefined/.test(svg),item.file+': '+spec.id);assert(svg.includes('xmlns="http://www.w3.org/2000/svg"'));assert(chartCsv(spec).includes('Source'));
  }
  const report=visualReport(d,analysis,p);assert.equal((report.match(/data-visual-id=/g)||[]).length,50);assert(!report.includes('data-chart-svg='));
}
console.log('Passed 50 visual outputs: independent aggregates, interval bounds, missing-data behavior, filtered library, escaped SVG/CSV exports, and 20 scenarios + extended demonstration.');
