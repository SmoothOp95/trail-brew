# 00_STATE.md

MTB Setup Triage Dashboard: project state

Last updated: 2026-10-01 (Claude Code, 02C engine step and gap-free component picker)
Update protocol: **every session reads this file first and updates it last.** If you finish a session without updating this file, the next session starts from stale numbers and repeats work.

## What this project is

A setup triage dashboard for mountain bikers, scoped to the South African market, shipping as a web app and an iOS app from a shared codebase.

The core idea, and the thing no existing tool does: **hardware-gated recommendations.** Before suggesting any change, the tool confirms the adjuster physically exists on the rider's damper. Telling a GRIP Sweep-Adjust owner to back off high speed compression is worse than useless, because that dial does not exist on the fork.

Primary entry point is goals, not symptoms. The rider says what they want from the bike and the engine works out which settings to change.

## Pipeline

| Stage | File | Status |
|---|---|---|
| 0 | `mtb-setup-triage-prototype.html` | Complete. Design reference, signed off. |
| 1 | `01_SCHEMA.md` | v0.3.2. Bands, coil charts and the pending damper rule added from 02C section 10. |
| 2 | `02_HARVEST_SUSPENSION.md` | FOX batch 1 complete. RockShox not started. |
| 2b | `02B_HARVEST_ROCKSHOX.md` | Revised 2026-09-28 to produce the 15 damper ids 02C reserves. Not yet run. Next Chrome task. |
| 2c | `02C_ROCKSHOX_FRONT_SPEC_2023.md` | Transcribed 2026-09-28; engine side built 2026-10-01. All 153 RockShox fork units are selectable with pending dampers. |
| 3 | `03_HARVEST_BIKES_SA.md` | Written, blocked on 2b. |
| 4 | Kinematics and tyres | Not written. Target list should come from stage 3's report. |
| 5 | `05_RULES_ENGINE.md` | Written. `src/mtb/rules/rules.json` seeded at 0.1-seed by Claude Code (05 content only). Chat session still authors the full file. |
| 6 | Validation | Not written. Basis revised, see below. |
| 7 | `07_BUILD_SPEC.md` | v0.2. Steps 1 to 6 done and verified on branch `claude/magical-rubin-hjaalu` (PR SmoothOp95/trail-brew#31). The dashboard is live at `/mtb-dashboard` with a sidebar link 'MTB Setup Dashboard'. |

## Dataset inventory, after 02C (2026-09-28)

| File | Records | Notes |
|---|---|---|
| `chassis.json` | 17 | 13 RockShox (3 new: BoXXer, Judy, Recon), 4 FOX |
| `dampers.json` | 13 | All FOX. RockShox dampers still pending 02b |
| `air_springs.json` | 86 | 84 RockShox (13 coil), 2 FOX. Plus 1 FOX Rhythm estimate in the overlay |
| `pressure_charts.json` | 73 | 71 RockShox, all bands. 2 FOX |
| `fork_units.json` | 156 | 153 RockShox on reserved damper ids, 3 FOX. Plus the Rhythm estimate |
| `shock_units.json` | 4 | FOX only. RockShox rear needs the companion rear suspension spec |

**02C corrections to batch 1 records** (source: RockShox GEN.00000000007168 Rev D):

- `rockshox_debonair_plus_pike_140`: spacer_factory 1 → 0, spacer_max 6 → 5 (p19)
- `rockshox_debonair_plus_lyrik_150`: spacer_factory 1 → 0 (p18)
- `rockshox_debonair_plus_zeb_160`: spacer_max 4 → 5 (p25)
- `rockshox_sid_2023`: max_rotor_mm 200 → 220 (p23)
- `rockshox_pike_2023` and `rockshox_lyrik_2023`: offsets [37, 44, 51] → [37, 44] (p19, p18)
- `rockshox_yari_2023`: offsets → [37, 42, 44, 46, 51], travel → 100-180 in 10s (p23-24)
- `rockshox_reba_2022`: travel [80, 100, 110, 120] → [100, 110, 120] (80 is Reba 26, out of scope) (p19)
- `rockshox_35_2020`: year_range → [2020, 2023]
- The three existing RockShox pressure charts were re-expressed as bands. They agree with their old boundary points.

**Pending damper rule** (02C section 10) is built end to end, 2026-10-01:
- Ingest keeps the units.
- The engine resolves their four adjusters to `pending`: neither offered nor ruled out. One notice per screen.
- Pressure bands show as a range for the rider's weight. Once the rider enters a pressure, it is marked inside, below or above the band.
- Coil forks show the published spring colour ("Blue (Firm) for 81 to 90 kg"), and fork pressure is ruled out with "change the spring rather than the pressure".
- Forks that take no tokens rule out spacer changes.
- A model code returns the family, and the rider picks travel.

**Component picker has no gaps**, 2026-10-01, at Tumi's instruction ("if there is a gap, pick the closest version"). It works brand → model → travel and covers 71 fork models, 19 shock models and 297 options. A test resolves every option on the Bench.
- **Composed units (overlay, estimate):**
  - FOX 36 and 38 with GRIP X / GRIP X2 (2025), and 38 Performance with GRIP.
  - FOX 32 and 34 in Factory FIT4, Performance GRIP and Rhythm RAIL, on placeholder FLOAT springs with figures pending.
  - FLOAT X2 Performance Elite, DHX2 Performance Elite and DHX shock units.
- **Nearest travel for FOX:** every travel the chassis takes is offered. A travel with no record uses the nearest unit's dials, with its pressure, token and setting figures stripped and labelled.
- **Closest-match stand-ins** (`src/mtb/data/standins.ts`, 25 entries):
  - Marzocchi Bomber Z1, Z1 Coil, Z2 and 58.
  - X-Fusion Trace, Sweep/Manic and Velvet/Slide.
  - SR Suntour XCT/XCM, XCR, Raidon/Aion, Auron/Zeron/Durolux and Axon.
  - Older RockShox Psylo/Sektor.
  - Shocks: RockShox Deluxe, Super Deluxe (air and coil), Vivid (air and coil) and Monarch; Marzocchi Bomber Air and CR; X-Fusion O2 and H3C; Suntour Edge.
- **Stand-in rules:**
  - Only the adjuster layout is borrowed, never pressure, token, setting or coil figures.
  - Prefer a target with fewer dials than the real part.
  - Lockout-only budget forks map to pending RockShox Motion Control or TurnKey families, so no damping advice is invented.
  - Every stand-in is labelled "closest match" on the picker and on the Bench, with the reason and an "ask for it" link.
- **These mappings are judgments about adjuster layouts, not harvested data.** Review them; each is one line in `standins.ts`.

## Dataset inventory, stage 2 batch 1 (historical)

As of the stage 2 batch 1 output. These numbers are the ones a fresh session most needs and cannot infer.

| File | Records | Notes |
|---|---|---|
| `chassis.json` | 14 | 10 RockShox, 4 FOX |
| `dampers.json` | 13 | All FOX. **Zero RockShox.** |
| `air_springs.json` | 5 | 3 RockShox, 2 FOX |
| `pressure_charts.json` | 5 | |
| `fork_units.json` | 3 | FOX only |
| `shock_units.json` | 4 | FOX only |
| `setting_charts.json` | 0 | Table defined in schema 0.3, not yet populated |

**Quality state, independently verified rather than taken from the report:**

- All foreign keys resolve. Zero orphans.
- All 13 dampers have all four adjuster keys present, and `direction` populated on every adjuster. 100% complete on the field that matters most.
- **33 of 34 adjusters have `count: null`.** Only GRIP2's high speed compression has a real total, at 16, sourced from a statement of functional limit.
- Air spring coverage is **5 of 56 chassis and travel combinations, 8%.**
- `basis` is null on all 5 pressure charts.

**Build-side state, 2026-09-25 (from `npm run mtb:ingest`, see `src/mtb/data/build/coverage.md`):**

- Ingest validates all 44 raw records, zero exclusions. Raw files are never edited.
- A gap-filling overlay (`src/mtb/data/overlay/overlay.ts`) sits on top of raw, added at Tumi's instruction to fill gaps with research or best estimate. 39 corrections, 6 research, 4 estimates. Each entry fills only null fields or overrides only unchanged ones, and retires itself when a harvest supplies the value.
  - Confidence corrected to published on 13 records that were marked estimated for missing data, not assumed values. Gaps moved to `fields_pending`: bare count nulls went from 29 to 0.
  - GRIP2 hsc = 16 given `count_basis: functional_total` from its own note. It is the only count usable for clamping.
  - FIT4 Open Mode Adjust modelled as `sub_adjuster` (22 clicks, from its note).
  - FOX EVOL charts: `basis: rider_plus_kit`, `point_type: bracket`, from web search summaries of the FOX manual. RockShox charts: bracket, per 02B.
  - GRIP2 LSR and HSR setting charts, estimated, from web search summaries.
  - **Reference bike represented as an estimate**: `fox_36_rhythm_150_2024` with an estimated damper (sweep LSC, clicks LSR, no HSC or HSR) and air spring (3 of 7 spacers, 234-44-079, 120 psi max) from the figures in this file. No pressure chart, so fork pressure starts unknown. 02B objective C replaces it.
- The session network policy blocked tech.ridefox.com and transitionbikes.com, so "research" entries rest on search summaries, not the manuals.
- Showable today: 4 forks (3 FOX harvested, 1 Rhythm estimate), 4 FOX shocks.

**App state, 2026-09-28:**

- `/mtb-dashboard` has five tabs: Bench, Garage, Session log, Method and What is on file. It is lazy-loaded, so the dashboard and its dataset are a 241 kB chunk (51 kB gzip) outside the main bundle.
- Sign-in: Bench, Method and Coverage run signed out in memory. Saving a bike and keeping the log need sign-in (localStorage and IndexedDB under `mtbTriage:<uid>:*`). Requests persist signed out under `mtbTriage:anon:requests`.
- Verified in Playwright, 26 of 26 checks, signed out and with a mocked user:
  - GRIP + less_harsh rules out HSC naming GRIP.
  - DPS + pedal_efficiency gives a coarse lever step.
  - The conflict and near-zero flag show.
  - Bike search gives the stage 3 empty state; a nonsense part number says why.
  - A request survives a reload.
  - Saving to Garage works signed in; no horizontal scroll at 390px.
  - Screenshots are in `docs/mtb/reference/app-*.png`.
- Vitest: 84 tests (42 MTB, 42 existing). Strict `tsc` clean on `src/mtb`.

## Known conflicts and open problems

1. **The reference bike cannot be represented.** Tumi's 2024 FOX 36 Rhythm 150, which FOX describes as "Grip Sweep-Adj", matches neither `fox_grip_2024` (3-position, Performance tier) nor `fox_rail_2024` (2-position sweep, documented only on 32 and 34mm Rhythm forks). No Rhythm-tier fork unit exists. This is the one build where the answers are known, so until it can be represented nothing can be validated against it.

2. **Pressure disagreement on that same fork.** The harvested FLOAT EVOL 36 chart gives 89 psi at 82 kg. The fork's own documented figure is 80 psi across 82 to 86 kg. Nine psi apart.

3. **Spacer disagreement on that same fork.** Harvested record says 2 factory spacers, part number 234-04-736. The actual fork has 3 fitted from factory, part number 234-44-079. Both agree on 10cc and 7 maximum. Almost certainly a Rhythm versus Performance air spring difference rather than an error, which is why `tier_applies_to` was added in schema 0.3.

4. **Adjuster totals may not be publicly documented at all** for most damper families. Manufacturers publish recommended settings by rider weight instead. The 02b totals hunt will confirm or deny this. A negative result is a real finding and should be recorded as such, not treated as a failed pass.

## Decisions taken

| Decision | Rationale |
|---|---|
| Scope is the South African market | Makes the harvest tractable: roughly 150 combinations rather than 6,000 |
| Full suspension and hardtails in v1, e-MTBs deferred | Schema reserves e-MTB fields so adding them later is data work, not migration |
| Shared codebase, web and iOS together | |
| Goals are the primary entry point, symptoms secondary | Validated in the prototype. A rider can answer "I want more pop" without diagnosing anything |
| Capability resolves to three states: counted, coarse, absent | A lever is not an absent adjuster. Ruling it out would wrongly tell a Fuel EX owner they have no rear platform |
| Preconditions are a dismissible banner, not ranked cards | Service, tyre and fit checks should not compete for rank against damping changes |
| `count` means true total only | A recommendation in that field would misrepresent adjustment headroom |
| Fixed magnitudes in v1, computed from leverage in v2 | `magnitude` object already shaped for it |
| **Build into Trail Brew, not a new Expo app** | Existing users and auth, and the PWA covers iOS without a native build. Engine stays free of React and DOM so a native client can reuse it. Decided with Claude Code, 2026-09-25. |
| Now values are the rider's own current settings | Relative changes from where the rider is survive sparse data far better than a computed baseline |
| Coverage is user-facing, with a Request affordance | The request log becomes the harvest priority list, generated from real rider demand rather than desk guesses |

| Estimated is shown as its own provenance | Published, derived, estimated, unknown. Overlay estimates fill "now" values but are labelled. Decided with Claude Code, 2026-09-25, following the instruction to fill gaps. |
| Sign-in: Bench signed-out, sign-in to save | Preferred option from 07 v0.2 fits the existing auth pattern. Requests persist under `mtbTriage:anon:requests` when signed out so the Request path never dead-ends. |
| For review: `applies_to` per goal | Not in 05. Seed sets every goal to both, except `pedal_efficiency` (full suspension only, since two of its three fields are shock fields). |
| For review: `hardtail.tyre_weight = 1.25` | 05 says tyre weighting rises on hardtails but gives no number. |

## Findability, the requirement added 2026-09-25

The build must let a Gauteng rider find their bike and their specific parts, degrading honestly: bike search, then component search, then identifier match on the part number from the sticker, then manual pick, then Request. Today only manual pick and FOX Factory or Performance component search return anything.

**Harvest priority for reach, in order:**

1. `02B` RockShox dampers, plus `part_number` and `model_code` capture so identifier match works
2. FOX Rhythm tier, which is the reference bike and a large share of Trek and Specialized mid-range spec
3. `02` batch 2: X-Fusion, SR Suntour, Marzocchi Bomber, RockShox Recon, Judy and 35 Silver. **This is most SA bikes under R40k.**
4. `03` frames, prioritised by the Request log once it exists

## Dropped

- **TrailHead validation sampling.** Required a serial or model code per lookup and 20 serials were not available. Stage 6 now validates against manufacturer setting charts and pressure charts, which are documented rather than sampled and reproducible by anyone reading the source.
- **Physical click counting.** Totals come from documented sources instead: service manuals, exploded diagrams, and statements of functional limit.

## Highest risk item

The eight goals were chosen without asking a single rider. If that entry point is wrong, everything downstream is built on it. Cheap to fix now, expensive later.

## Next action by session type

| Session | Do this |
|---|---|
| Claude in Chrome | Run `02B_HARVEST_ROCKSHOX.md` |
| Claude Code | When 02b lands: drop its files into `src/mtb/data/raw`, rerun `npm run mtb:ingest`, and remove the stand-ins it replaces from `standins.ts` (RockShox shocks). Pending forks resolve automatically. Then transcribe the RockShox rear suspension spec the same way as 02C. |
| Claude in chat | Review 02b output when it lands, then author the full `rules.json` from `05_RULES_ENGINE.md`, replacing the 0.1-seed. Decide `applies_to` and hardtail tyre weighting. |

## Changelog

- 2026-10-01 02C engine step (pending adjusters, bands as ranges, coil spring colours, model-code families). Gap-free picker: composed FOX units, nearest-travel fallback, 25 closest-match stand-ins. 117 tests, 35 browser checks.
- 2026-09-28 02C transcribed: 11 corrections, 3 chassis, 81 air springs, 68 band charts, 153 RockShox fork units on reserved damper ids. Schema 0.3.2 in Zod. Pending damper rule in ingest. Golden value tests. 02B brief revised to produce the reserved ids.
- 2026-09-28 Build steps 5 and 6: screens, lazy route at /mtb-dashboard, sidebar link, signed-out Bench. Verified in Playwright.
- 2026-09-25 Build steps 1 to 4: schemas v0.3, ingest and coverage, gap-filling overlay, engine, search, rules seed. Stopped for review.
- 2026-09-25 Build spec written, state file created, TrailHead dropped, 02b authored
- 2026-09-11 Schema 0.3 after stage 2 batch 1 audit
- Prototype signed off, schema 0.2, goals replace symptoms as entry point
