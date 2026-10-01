import raw from './rules.json';
import { Rules } from './rules.schema';

/** Validated at import: a malformed rules file fails loudly in dev and in tests, never silently. */
export const RULES: Rules = Rules.parse(raw);
