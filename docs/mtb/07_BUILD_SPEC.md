# 07_BUILD_SPEC.md

Version 0.2
Stage 7: application build
Executor: Claude Code
Depends on: `00_STATE.md`, `01_SCHEMA.md` **v0.3**, `05_RULES_ENGINE.md`, `mtb-setup-triage-prototype.html`
Inputs: the harvest JSON files as they currently stand

## Changes in 0.2

Claude Code's build plan was reviewed and its integration decisions are accepted. This version records them as decisions rather than deviations, corrects the schema inferences it had to make because v0.3 was not in the repo, and adds the one requirement the plan did not address: **a rider in Gauteng must be able to find their bike and their specific parts, or be told clearly that they are not there yet and ask for them.**

## The governing constraint

**The dataset is sparse and will stay sparse.** Right now: FOX only, no RockShox dampers, 33 of 34 adjuster counts null, air spring coverage at 8% of chassis and travel combinations, `basis` null on every pressure chart, no frames, no tyres.

Handling absent data honestly is the product's core behaviour, not its error path. The app must always answer one of three ways and never confuse them:

1. **Published.** Read from a manufacturer document. Say the number.
2. **Derived.** Computed from a model with real inputs. Say the number and say it is derived.
3. **Unknown.** Say so, say what would settle it, and still give whatever help is possible without it.

## Decisions accepted from the build plan

| Area | Decision |
|---|---|
| Host | A route at `/mtb-dashboard` in the existing Trail Brew app (Vite, React 18, react-router, Tailwind, Firebase auth). Web only for now. Trail Brew is a PWA, so installable on iOS without a native build. |
| Engine isolation | `src/mtb/engine/` and `src/mtb/data/` stay free of React and DOM code so a native client can reuse them later |
| TypeScript | Strict, scoped to `src/mtb/` only. Rest of the app stays JS. |
| Rendering | Inline SVG |
| Storage | IndexedDB for the session log, localStorage for preferences, keys namespaced `mtbTriage:<uid>:*`. Never `bikeTrackerData` or `bikeServiceHistory`, which `src/utils/migrate.js` deletes. |
| Data location | On device. Never Firestore in v1. |
| Now values | **The rider's own current settings, saved per bike.** Starting values fill these only when published or derived. Otherwise the field reads "not known, enter your current" and every change is relative to it. This replaces the prototype's computed baseline and is the better design. |
| Starting formulas | The prototype's tyre and shock pressure formulas are **not used**. They were placeholders. Fork pressure for EVOL 36 and 38 is published, with a `basis: null` disclosure. |
| Net-zero rule | Flag when `|net| <= max(1 unit, 10% of the sum of |delta|)` |
| Rules seed | `rules.json` at `version: "0.1-seed"` containing only what `05_RULES_ENGINE.md` states: 8 validated goals, 6 conflicts, coefficients, ordering, diagnostics, sag method. Proposed goals out. Symptoms, causes, preconditions empty for the chat session to author. |
| Theme | Prototype layout and section order in the Trail Brew `brew-*` theme |

**One decision to revisit: the sign-in gate.** Requiring sign-in for the whole tool limits reach with the riders this is for. Preferred: Bench runs signed-out with in-memory state, and sign-in is required only to save a bike to Garage or persist the log. If that is not simple in the existing auth pattern, keep the gate and note it in `00_STATE.md`.

## Schema v0.3, which was not in the repo

`01_SCHEMA.md` v0.3 goes into `docs/mtb/` and the Zod schemas are built from it. The inferred additions marked `// inferred: schema v0.3 not supplied` were close but incomplete. The full list of v0.3 additions:

| Table | Field | What it does |
|---|---|---|
| `damper.adjusters.*` | `count_basis` | `stated_total`, `functional_total`, `physical_count`, or null. **A `count` without a `count_basis` is held back at ingest.** GRIP2 `hsc.count = 16` is `functional_total`. |
| `damper.adjusters.*` | `usable_range` | Where the manufacturer says the adjuster actually does something |
| `damper.adjusters.*` | `sub_adjuster` | A finer adjustment nested inside a parent position. FIT4 Open Mode Adjust. Offered only when the parent is in `within_position`. |
| any record | `fields_pending` | Declares which nulls are known gaps with a known source. **Coverage must distinguish a pending field from a bare null.** |
| `air_spring` | `tier_applies_to` | Which fork tiers share this spring. Absent means all tiers. |
| `air_spring` | `pressure_min_psi` | Floor for clamping |
| `pressure_chart` | `point_type` | `curve` or `bracket`. Absent is treated as `curve` and coverage says so. |
| `pressure_chart` | `applies_to_travel_mm` | One published table often covers several travels |
| `setting_chart` | whole table | Manufacturer recommended settings by weight. Fields: `damper_id`, `adjuster`, `unit`, `points`, `basis`, `point_type`. **`unit` is required** and is stored as the source states it. Zero records today. |
| `tyre_pressure_model` | whole table | Defined, zero records, not implemented in v1 |
| `sag_target_pct` | rule change | `a <= b`, so `[30, 30]` passes |

## Findability: the requirement the plan did not cover

A rider must be able to get from "I have a bike" to a Bench screen that reflects their hardware, through the shortest path the data allows, and must never hit a dead end without being told why and offered a way to ask.

### Garage flow, degrading at each step

```
1. Search bike        brand -> model -> year -> size
                      auto-fills stock fork and shock from frame.stock_*_unit_id
                      NOT AVAILABLE TODAY: zero frames. Show the search, return
                      "no bikes yet", fall through.

2. Search component   brand -> model -> travel or size -> tier
                      from fork_units and shock_units

3. Match identifier   part number or model code typed from the sticker on the
                      fork leg or shock body. Exact match on
                      fork_unit.part_number / shock_unit.part_number, then
                      prefix match. Today almost all part numbers are null, so
                      this returns nothing and says why.

4. Manual             pick chassis, damper and air spring separately.
                      Always available. This is what Garage does today.

5. Not here           "We do not have this yet." Offer Request.
```

Every step that returns nothing says which harvest would fill it, in rider language. "RockShox forks are being added" is fine. A silent empty list is not.

### Request affordance

A rider who cannot find their bike or part can submit a request: brand, model, year, and free text, plus which step they reached. Stored locally under `mtbTriage:<uid>:requests` and exportable as JSON. **This is the harvest priority list.** It replaces desk guesses about which SA bikes matter with what riders actually ask for.

### Coverage is user-facing

The Coverage screen is not dev-only. Riders see what the dataset contains: which brands, how many forks and shocks, what is pending. It is the honest answer to "why is my bike not here" and it carries the Request affordance. A developer detail view behind `import.meta.env.DEV` can show the full `coverage.json`.

### Data readiness gates

Which harvest stage makes which Garage feature meaningful. Ship every feature now with honest empty states; these gates say when each stops being empty.

| Feature | Meaningful after |
|---|---|
| Component search, FOX Factory and Performance | Now |
| Component search, FOX Rhythm | 02b objective C |
| Component search, RockShox | 02b |
| Component search, X-Fusion, SR Suntour, Marzocchi, RockShox Recon and 35 Silver | 02 batch 2. **This is most SA bikes under R40k and is the reach unlock.** |
| Identifier match | 02b, once `part_number` and `model_code` are captured |
| Bike search | 03 |
| Tyre starting pressures | 04 |

## Data layer

### Ingest

`src/mtb/scripts/ingest.ts` reads `src/mtb/data/raw`, validates against the Zod schemas, resolves foreign keys, derives lever counts from `positions.length`, and emits `index.json`, `coverage.json` and an exclusions list to `src/mtb/data/build`.

**Validation failures never crash the build.** Excluded records are listed with a reason. The data is hand-assembled and will contain mistakes.

`coverage.json` reports, per table: record count, fields populated, pending fields (from `fields_pending`), bare nulls, dangling foreign keys, and the list of fork and shock units that can actually be shown. It names every data flag: FLOAT X lever not modelled, pound-to-kilogram converted charts, DHX `lsr: null`, `[30, 30]` sag, estimated downgrades.

Chained into `prebuild` and `pretest`.

### Starting value resolution order

The single most important piece of logic. Follow it exactly.

```
1. setting_chart for this damper and adjuster   -> published
2. pressure_chart for this air spring           -> published
3. model with real inputs                       -> derived
4. unknown                                      -> unknown, never a guess
```

Where a chart covers the field, **the model must not run.** `curve` interpolates linearly. `bracket` returns the band value and never interpolates across a boundary. With today's data the prototype's `count x 0.7` rebound and click-midpoint compression have no count to work from and return unknown, which is correct.

## Engine

Pure TypeScript in `src/mtb/engine/`. No React, no DOM.

### Capability

| Adjuster | Resolves to |
|---|---|
| `type: "clicks"` | counted |
| `type: "sweep"` or `"lever"` | coarse. Moves toward a named position, carries the coarse note, never shows a click count. Lever count from `positions.length`. |
| `type: "lockout"` or `null` | absent, with a reason that names the hardware. "No high speed compression adjuster on the GRIP (3-Position Micro Adjust) damper." |
| spacers | counted, bounded by `spacer_max`, unbounded when null |
| `shock_psi`, `shock_spacers` on a coil shock | absent, "coil shock, spring rate not modelled in v1" |
| `flip_chip` | absent until frames exist |
| `sub_adjuster` | offered only when the parent is in `within_position` |

**Unbounded counted** (`type: "clicks"`, `count: null`) is 33 of 34 adjusters today, so it is the common case. Offer the change, render no denominator, clamp only at zero and at the rider's own entry, disclose once per screen: "adjustment headroom for this damper is not published."

Clamps use only component bounds: `pressure_max_psi`, `pressure_min_psi`, `spacer_max`, a `count` with a `count_basis`. No hard-coded psi or tyre limits anywhere. A clamp that binds is disclosed on the row.

### Goals, conflicts, attributes, ordering, hardtails

As specified in `05_RULES_ENGINE.md`, with the net-zero rule above. Attributes ship `fit_basis: "expert_prior"` with the disclosure on the radar and at most one decimal in the legend. Rebound is stored as clicks from fully closed; a positive `fork_lsr` delta reads "open, faster", never "slower".

Hardtail branch implemented and fixture-tested per the `more_pop` hardtail recipe in 05, even though no real hardtail frame exists yet.

### Prototype bugs, fixed

Weight edits recompute starting values and clear staged goals. The lockout compression row is hidden from the readout. Shock lockout goes through capability. All six authored conflicts are used. Reset does not delete the saved log.

### Session log stores the label

`{ goal_ids, deltas: field -> { from, to }, verdict, note }` plus the resulting settings. Recording only the end state throws away what stage 6 needs.

## Structure

```
src/mtb/data/raw/*.json          harvest JSON, verbatim, read only
src/mtb/data/schema/*.ts         zod, from 01_SCHEMA.md v0.3
src/mtb/data/build/              ingest output
src/mtb/scripts/ingest.ts
src/mtb/engine/{capability,baseline,goals,conflicts,attributes,ordering}.ts
src/mtb/rules/rules.json + rules.schema.ts
src/mtb/search/                  bike, component and identifier search, pure TS
src/mtb/storage/                 IndexedDB and localStorage adapters behind an interface, in-memory for tests
src/mtb/screens/{MtbDashboard,Garage,Bench,SessionLog,Method,Coverage}.tsx
src/mtb/components/{BikeDiagram,Radar,Readout,GoalToggles,ConflictList,ChangeList,RuledOut,PreconditionsBanner,ProvenanceTag,BikeSearch,RequestForm}.tsx
src/mtb/tests/*.test.ts + fixtures/
docs/mtb/                        00_STATE, 01_SCHEMA v0.3, 02_REPORT, 02B, 03, 05, 07, prototype
```

Existing files touched: `src/App.jsx` route, `src/components/layout/Sidebar.jsx` link with the `Gauge` icon, `package.json` for `zod`, `typescript`, `tsx` and the `mtb:ingest` script, new `tsconfig.json` scoped to `src/mtb`, and `tailwind.config.js` content widened to `ts,tsx`.

## Tests

Vitest. The ten from `05_RULES_ENGINE.md` section 10, the five from the sparse-data case, and four for findability.

| Case | Expected |
|---|---|
| Unbounded count | Change offered, no denominator, no maximum clamp, headroom disclosed once |
| No charts | Falls to model or unknown, labelled derived, never published |
| `setting_chart` fixture present | Model does not run for that adjuster |
| `bracket` chart | Band value, no interpolation across the boundary |
| Malformed raw record | Excluded with a reason, build succeeds, named in coverage |
| `count` without `count_basis` | Held back at ingest, named in coverage |
| Bike search with zero frames | Returns empty with a reason naming stage 3, falls through to component search |
| Identifier match | Exact `part_number` hit resolves to the unit; prefix hit returns candidates; no hit says why |
| Request submission | Stored under the namespaced key, exportable, records the step reached |

Fixture tests on invented components (36 Rhythm GRIP, 36 GRIP X2, RS 35 Motion Control, hardtail) are acceptable now and get replaced by real records as harvest stages land. Note which tests are fixture-backed in the test names.

## Execution order

1. Copy docs into `docs/mtb/`, including `01_SCHEMA.md` **v0.3**. Copy raw data. Screenshot the prototype at desktop and mobile width with Playwright as the visual reference.
2. Zod schemas from v0.3. Ingest script. Run it and **show the coverage report before continuing.**
3. Engine modules with unit tests alongside. Search modules with tests.
4. Seed `rules.json`.
5. Screens: Bench first, then Garage with the degrading search and Request form, then Coverage as user-facing, then Session log and Method.
6. Route, sidebar link, sign-in decision.
7. Verify. Update `docs/mtb/00_STATE.md`. Commit and push.

Stop for review after step 2 and after step 4.

## Verification

- `npm run mtb:ingest` completes on current data and `coverage.json` lists the showable units and every data flag.
- `npm test` passes: the MTB tests and the existing four test files.
- `npm run build` passes.
- In Playwright with a mocked auth user: GRIP fork plus `less_harsh` rules out `hsc` naming GRIP; DPS plus `pedal_efficiency` shows a coarse lever step; `more_pop` plus `high_speed_stability` shows the conflict and the near-zero flag; bike search returns the stage 3 empty state; identifier search with a nonsense string says why it found nothing; a Request round-trips through storage.
- Bench screenshot alongside the prototype screenshots.

## Not in v1

Accounts beyond existing auth, Firestore sync, computed magnitudes from leverage curves, e-MTB, coil spring rate recommendation, per-frame silhouettes, tyre pressure model, symptom path, social features.

## Definition of done

- Builds and runs at `/mtb-dashboard`.
- Ingest handles the sparse dataset without crashing and emits coverage.
- Bench matches the prototype's behaviour with real data behind it.
- Garage degrades honestly through all five steps and never dead-ends without a reason and a Request.
- All tests pass.
- Every figure a rider sees is published, derived or unknown, and the three are visually distinct.
- `00_STATE.md` updated.
