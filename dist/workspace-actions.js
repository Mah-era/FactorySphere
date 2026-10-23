import {PLANNING_DEFAULTS,planningInputs,signalRegister,profileData,costSensitivity,governanceGates,comparableEffect,day} from './intelligence.js';
import {deriveEffectiveness} from './analysis-core.js';
import {e} from './presentation.js';
import {criticalReview} from './decision-review.js';

const ids=s=>String(s||'').split(',').map(s=>s.trim()).filter(Boolean);
const required=(values,keys)=>{for(const key of keys)if(!String(values[key]??'').trim())throw new Error(key+' is required.');};
const dateValid=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
export function applyWorkspaceCommand(db,command,values){
  const w=db.workspace||(db.workspace={});
  if(command==='planning-form'){
    const next={};
    for(const key of Object.keys(PLANNING_DEFAULTS)){const raw=values[key],v=Number(raw);if(raw===undefined||raw===''||!Number.isFinite(v)||v<0)throw new Error('Supply a valid nonnegative value for '+key);next[key]=v;}
    for(const key of ['shiftHours','reinspectionRate','packingRate','replacementRate','alternateRate','skillAvailability','machineAvailability','samplePercent','priorityPercent'])if(next[key]<=0)throw new Error(key+' must be greater than zero.');
    for(const key of ['skillAvailability','machineAvailability','samplePercent','priorityPercent','handlingRisk','falseNegative','falsePositive'])if(next[key]>100)throw new Error(key+' cannot exceed 100%.');
    if(next.shiftHours>24||![5,6,7].includes(next.workingDays))throw new Error('Use at most 24 hours per day and 5, 6 or 7 workdays per week.');
    w.planning=next;return 'Planning constraints updated';
  }
  if(command==='hypothesis-form'){
    required(values,['hypothesis','test','reviewer']);
    if(['Supported','Rejected'].includes(values.status))required(values,['evidence']);
    if(!['Machine','Method','Material','People','Measurement','Environment','Design'].includes(values.category))throw new Error('Select a valid cause category.');
    if(!['Untested','Supported','Rejected','Inconclusive'].includes(values.status))throw new Error('Select a valid finding.');
    (w.hypotheses??=[]).push({id:'HYP-'+Date.now(),...values,date:day()});return 'Investigation hypothesis recorded';
  }
  if(command==='whys-form'){w.whys=Array.from({length:5},(_,i)=>values['why'+i]||'');return 'Five Whys chain updated';}
  if(command==='economics-form'){
    const count=Number(values.incidentsPerYear);
    if(values.incidentsPerYear!==''&&(!Number.isFinite(count)||count<=0))throw new Error('Comparable incidents per year must be positive or blank.');
    w.economics={incidentsPerYear:values.incidentsPerYear===''?null:count};return 'Economic planning horizon updated';
  }
  if(command==='ledger-form'){
    required(values,['category','amount','description']);
    const amount=Number(values.amount);if(!Number.isFinite(amount)||amount<0)throw new Error('Cost must be nonnegative.');
    if(!['prevention','appraisal','internal','external'].includes(values.category))throw new Error('Invalid cost category.');
    (w.costLedger??=[]).push({...values,id:'COST-'+Date.now(),amount});return 'Attributed quality cost recorded';
  }
  if(command==='intervention-form'){
    required(values,['name','cost','days','reduction','confidence','resources','safety','sustainability']);
    for(const k of ['cost','days','reduction','confidence']){const n=Number(values[k]);if(!Number.isFinite(n)||n<0||(['reduction','confidence'].includes(k)&&n>100))throw new Error('Invalid intervention '+k);values[k]=n;}
    db.interventions.push(values);return 'Corrective-action alternative added';
  }
  if(command==='containment-update-form'){
    const record=(w.containment||[]).find(r=>r.id===values.id);if(!record)throw new Error('Select an existing commitment.');
    if(values.status==='Complete')required(values,['evidence']);
    Object.assign(record,{status:values.status,evidence:values.evidence,updatedAt:new Date().toISOString()});return 'Containment commitment updated';
  }
  if(command==='raci-form'){
    required(values,['id','accountable','verifier']);
    const action=db.actions.find(a=>a.id===values.id);if(!action)throw new Error('Select an existing action.');
    const dependencies=ids(values.dependsOn);
    if(dependencies.some(id=>!db.actions.some(a=>a.id===id)))throw new Error('Dependencies must refer to existing action IDs.');
    const next=db.actions.map(a=>a.id===action.id?{...a,dependsOn:dependencies.join(', ')}:a);
    function cycle(id,path=new Set()){if(path.has(id))return true;const item=next.find(a=>a.id===id);return ids(item?.dependsOn).some(dep=>cycle(dep,new Set([...path,id])));}
    if(cycle(action.id))throw new Error('Action dependencies cannot contain a cycle.');
    Object.assign(action,{accountable:values.accountable,consulted:values.consulted||'',informed:values.informed||'',verifier:values.verifier,dependsOn:dependencies.join(', ')});return 'RACI and action dependencies updated';
  }
  if(command==='governance-form'){
    if(values.approvalDate&&(!dateValid(values.approvalDate)||values.approvalDate>day()))throw new Error('Approval date must be valid and cannot be in the future.');
    if(values.verificationDecision==='Accepted')required(values,['verifier','comparisonEvidence']);
    if(values.verifier&&values.verifier===db.incident.causeReviewer)throw new Error('Choose an effectiveness reviewer other than the cause reviewer.');
    w.governance={...values};return 'Approval and independent review record updated';
  }
  if(command==='containment-form'){
    required(values,['action','batches','owner','due']);
    if(!dateValid(values.due))throw new Error('Supply a valid containment deadline.');
    if(ids(values.batches).some(id=>!db.batches.some(b=>b.id===id)))throw new Error('Containment must reference existing batch IDs.');
    if(values.status==='Complete')required(values,['evidence']);
    (w.containment??=[]).push({id:'CNT-'+Date.now(),...values,recordedAt:new Date().toISOString()});return 'Containment commitment recorded';
  }
  if(command.startsWith('feedback-')){
    required(values,['category','reviewer','reviewEvidence']);
    const complaint=db.complaints.find(c=>c.id===command.slice(9));if(!complaint)throw new Error('Complaint not found.');
    if(!['Pending review','Human reviewed','Rejected classification'].includes(values.decision))throw new Error('Invalid complaint decision.');
    Object.assign(complaint,values);return 'Complaint '+complaint.id+' classification and evidence reviewed';
  }
  return null;
}
export function handleWorkspaceForm(form,db,{audit,invalidateGroundTruth}){
  const values=Object.fromEntries([...new FormData(form)].map(([k,v])=>[k,String(v).trim()]));
  const event=applyWorkspaceCommand(db,form.id,values);
  if(!event)return false;
  if(form.id.startsWith('feedback-'))invalidateGroundTruth();
  audit(event);return true;
}
export function analyticalReport(db,a,plans,html=false){
  const signals=signalRegister(db,a),effect=deriveEffectiveness(db,a),sensitivity=costSensitivity(db,a),review=criticalReview(db,a,plans);
  const data={product:'FactorySphere',version:3,criticalReview:review,generated:new Date().toISOString(),source:db.sourceName,focus:a.focus,referenceBatch:a.reference.id,metrics:{sample:a.focusSample,defective:a.focusDefects,rate:a.focusSample?a.focusDefects/a.focusSample*100:null,knownQualityCost:a.knownCost,costCategoriesSupplied:a.costCoverage,strictCopq:sensitivity.failure},costLedger:db.workspace?.costLedger||[],dataQuality:profileData(db),signals:signals.signals,controlCohort:signals.cohort,statisticalLimits:signals.control,exposure:a.exposure.map(({records,complaints,...b})=>b),planningAssumptions:planningInputs(db),recoveryPlans:plans,costSensitivity:sensitivity,containment:db.workspace?.containment||[],hypotheses:db.workspace?.hypotheses||[],fiveWhys:db.workspace?.whys||[],actions:db.actions,governance:db.workspace?.governance||{},governanceGates:governanceGates(db),effectiveness:effect,comparableEffectiveness:comparableEffect(db,a,effect),complaints:db.complaints,audit:db.audit,warnings:a.warnings};
  if(!html)return data;
  const t=(title,headers,rows)=>`<h2>${e(title)}</h2><table><thead><tr>${headers.map(v=>'<th>'+e(v)+'</th>').join('')}</tr></thead><tbody>${rows.map(row=>'<tr>'+row.map(v=>'<td>'+e(v??'Not supplied')+'</td>').join('')+'</tr>').join('')}</tbody></table>`;
  const criticalAppendix='<h2>Critical decision review</h2><p>'+e(review.scope)+' '+e(review.method)+'</p>'
    +t('Evidence challenges',['Priority','Finding','Observed evidence','Why it matters','Verify next','Record IDs'],review.findings.map(f=>[f.priority,f.title,f.observation,f.implication,f.next,f.evidence.join(', ')]))
    +t('Common-mix comparisons',['Factor','High / low groups','Raw gap pp','Adjusted gap pp','Shared strata','Coverage high / low %','Ranking reversal'],review.mixComparisons.map(c=>[c.dimension,c.available?c.high.label+' / '+c.low.label:'Insufficient groups',c.rawGap,c.adjustedGap,c.sharedStrata,c.available?c.highCoverage+' / '+c.lowCoverage:'Unavailable',c.reversal?'Yes':'No']))
    +'<p>Direct standardization uses pooled sample weights across shared, fully identified product/stage/context strata. This is descriptive; selected extremes, unmeasured confounding and non-independent samples limit inference. No causal effect or statistical significance is established.</p>'
    +t('Shared comparison strata',['Factor','Controls','High sample','High defects','Low sample','Low defects','Evidence'],review.mixComparisons.flatMap(c=>(c.strata||[]).map(s=>[c.dimension,s.values.join(' / '),s.high.sample,s.high.defects,s.low.sample,s.low.defects,[...s.high.records,...s.low.records].join(', ')])))
    +t('Recovery dominance review',['Strategy','Assessable','Undominated','Dominated by'],review.recovery.plans.map(p=>[p.name,p.assessed?'Yes':'No',p.efficient?'Yes':'No',p.dominatedBy.join('; ')]))
    +'<p>Criteria: '+e(review.recovery.criteria.map(c=>c.direction+' '+c.field).join('; '))+'. Conditional on planning estimates; non-modeled constraints and required approvals remain separate.</p>'
    +t('Prevention investment stress test',['Recurrence probability %','Achieved reduction %','Net expected benefit USD'],review.prevention.points.map(p=>[p.probability,p.effectiveness,p.net]))
    +'<p>One comparable future incident: net benefit = failure cost × recurrence × reduction − prevention investment. This grid is a stress test, not a probability forecast.</p>';
  return criticalAppendix+'<h2>Decision intelligence appendix</h2><p>FactorySphere 3.0 · All calculations use the active source. Planning costs are USD. Risk assumptions are estimates.</p>'+t('Explainable alerts',['Signal','Location','Evidence','Verification'],data.signals.map(s=>[s.title,s.where,s.records.join(', '),s.next]))+t('Planning assumptions',['Parameter','Value'],Object.entries(data.planningAssumptions))+t('Cost sensitivity',['Recurrence probability %','Avoided loss USD','Net benefit USD'],sensitivity.points.map(p=>[p.probability,p.avoided.toFixed(2),p.net.toFixed(2)]))+t('Containment commitments',['Action','Batches','Owner','Deadline','Status','Evidence'],data.containment.map(r=>[r.action,r.batches,r.owner,r.due,r.status,r.evidence]))+t('Investigation hypotheses',['Category','Hypothesis','Test','Finding','Reviewer','Evidence'],data.hypotheses.map(r=>[r.category,r.hypothesis,r.test,r.status,r.reviewer,r.evidence]))+t('Five Whys',['Step','Explanation'],data.fiveWhys.map((v,i)=>[i+1,v]))+t('Governance checks',['Gate','Status'],data.governanceGates.map(([l,p])=>[l,p?'Complete':'Missing']))+t('RACI & dependencies',['Action','Responsible','Accountable','Consulted','Informed','Verifier','Dependencies'],db.actions.map(a=>[a.id,a.owner,a.accountable,a.consulted,a.informed,a.verifier,a.dependsOn]))+'<p>Comparable effectiveness cohort: same SKU, factory, line and overlapping inspection stages. Reduction: '+e(data.comparableEffectiveness.reduction===null?'insufficient evidence':data.comparableEffectiveness.reduction.toFixed(1)+'%')+'. Human verification and complexity review are required.</p>';
}
