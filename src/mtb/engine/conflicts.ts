import type { Conflict, Rules } from '../rules/rules.schema';
import type { NetZero } from './goals';

const SEVERITY_RANK: Record<Conflict['severity'], number> = { cancels: 0, trades: 1, mild: 2 };

/** Authored conflicts between the selected goals (05 §4), loudest first. Order within a pair does not matter. */
export function authoredConflicts(goalIds: string[], rules: Rules): Conflict[] {
  const picked = new Set(goalIds);
  return rules.conflicts
    .filter((c) => picked.has(c.goal_a) && picked.has(c.goal_b))
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
}

export interface ConflictReport {
  authored: Conflict[];
  /** The mechanical case: a field the selected goals push both ways until it nets to near zero. */
  mechanical: NetZero[];
}

export function conflictReport(goalIds: string[], rules: Rules, netZero: NetZero[]): ConflictReport {
  return { authored: authoredConflicts(goalIds, rules), mechanical: netZero };
}
