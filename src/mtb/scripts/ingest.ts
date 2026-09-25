/**
 * Build-time ingest: src/mtb/data/raw -> src/mtb/data/build.
 * Run with `npm run mtb:ingest`. Chained into predev, prebuild and pretest.
 * Never exits non-zero on bad data: bad records are excluded and reported.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TABLES, TABLE_NAMES } from '../data/schema/tables';
import { ingest } from '../data/ingest/ingest';
import { renderCoverageReport } from '../data/ingest/report';
import type { RawTables } from '../data/ingest/types';

const here = dirname(fileURLToPath(import.meta.url));
const rawDir = join(here, '../data/raw');
const buildDir = join(here, '../data/build');

const raw: RawTables = {};
for (const table of TABLE_NAMES) {
  const path = join(rawDir, TABLES[table].file);
  if (!existsSync(path)) continue;
  try {
    raw[table] = JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    // A file that is not valid JSON is reported as a non-array, not a crash.
    raw[table] = { parse_error: String(err) };
  }
}

const { index, coverage } = ingest(raw);
mkdirSync(buildDir, { recursive: true });
writeFileSync(join(buildDir, 'index.json'), JSON.stringify(index));
writeFileSync(join(buildDir, 'coverage.json'), JSON.stringify(coverage, null, 2));
writeFileSync(join(buildDir, 'exclusions.json'), JSON.stringify(coverage.exclusions, null, 2));
writeFileSync(join(buildDir, 'coverage.md'), renderCoverageReport(coverage));

const valid = Object.values(coverage.tables).reduce((n, t) => n + t.valid, 0);
console.log(
  `mtb:ingest ${valid} valid records, ${coverage.exclusions.length} excluded, ` +
    `${coverage.annotations.length} field changes, ${coverage.flags.length} flags. ` +
    `Showable: ${coverage.showable.fork_units.length} forks, ${coverage.showable.shock_units.length} shocks.`,
);
