import {normalizeDataset,deriveAnalysis,recoveryOptions,deriveCost} from './analysis-core.js';
import {scheduleRecovery} from './intelligence.js';

function finiteTree(value){
  if(typeof value==='number'&&!Number.isFinite(value))throw new Error('The supplied values exceed the supported calculation range. Reduce the quantities or assumptions.');
  if(value&&typeof value==='object')for(const child of Object.values(value))finiteTree(child);
}

// Run before committing edits, imports or saved state. Invalid derived results
// must never become the active persisted workspace.
export function validateDecisionState(candidate,context={}){
  finiteTree(candidate);
  const normalized=normalizeDataset(candidate,candidate.sourceName);
  const analysis=deriveAnalysis(normalized,context);
  const plans=scheduleRecovery(normalized,analysis,recoveryOptions(normalized,analysis));
  const cost=deriveCost(normalized,analysis);
  finiteTree({analysis,plans,cost});
  const frequency=normalized.workspace?.economics?.incidentsPerYear;
  if(frequency!=null&&cost.avoided!=null)finiteTree(frequency*cost.avoided);
  return normalized;
}
