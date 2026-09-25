import type { Rules } from '../rules/rules.schema';
import type { SettingField } from './types';

export type OrderGroupId = Rules['ordering'][number]['group'];

/**
 * 05 §7: tyre, spring rate, ramp, rebound, compression, geometry. The order in which a change to one
 * invalidates your read on the next. Within a group, the order the fields are listed in rules.json.
 */
export function fieldRank(rules: Rules, field: SettingField): number {
  let i = 0;
  for (const g of rules.ordering) {
    for (const f of g.fields) {
      if (f === field) return i;
      i++;
    }
  }
  return Number.MAX_SAFE_INTEGER;
}

export function fieldGroup(rules: Rules, field: SettingField): OrderGroupId {
  return rules.ordering.find((g) => g.fields.includes(field))?.group ?? 'geometry';
}

export function sortByOrdering<T extends { field: SettingField }>(rules: Rules, items: T[]): T[] {
  return [...items].sort((a, b) => fieldRank(rules, a.field) - fieldRank(rules, b.field));
}
