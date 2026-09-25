# 00_STATE.md

MTB Setup Triage Dashboard: project state

Last updated: 2026-09-25
Update protocol: **every session reads this file first and updates it last.** If you finish a session without updating this file, the next session starts from stale numbers and repeats work.

## What this project is

A setup triage dashboard for mountain bikers, scoped to the South African market, shipping as a web app and an iOS app from a shared codebase.

The core idea, and the thing no existing tool does: **hardware-gated recommendations.** Before suggesting any change, the tool confirms the adjuster physically exists on the rider's damper. Telling a GRIP Sweep-Adjust owner to back off high speed compression is worse than useless, because that dial does not exist on the fork.

Primary entry point is goals, not symptoms. The rider says what they want from the bike and the engine works out which settings to change.

## Pipeline

| Stage | File | Status |
|---|---|---|
| 0 | `mtb-setup-triage-prototype.html` | Complete. Design reference, signed off. |
| 1 | `01_SCHEMA.md` | v0.3. Revised twice against real harvest data. |
| 2 | `02_HARVEST_SUSPENSION.md` | FOX batch 1 complete. RockShox not started. |
| 2b | `02B_HARVEST_ROCKSHOX.md` | Written, not yet run. Next Chrome task. |
| 3 | `03_HARVEST_BIKES_SA.md` | Written, blocked on 2b. |
| 4 | Kinematics and tyres | Not written. Target list should come from stage 3's report. |
| 5 | `05_RULES_ENGINE.md` | Written. `rules.json` not yet produced. |
| 6 | Validation | Not written. Basis revised, see below. |
| 7 | `07_BUILD_SPEC.md` | v0.2. Claude Code build plan reviewed and accepted with findability additions. Build starting. |

## Dataset inventory

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
| Claude Code | Follow `07_BUILD_SPEC.md` |
| Claude in chat | Review 02b output when it lands, then author `rules.json` from `05_RULES_ENGINE.md` |

## Changelog

- 2026-09-25 Build spec written, state file created, TrailHead dropped, 02b authored
- 2026-09-11 Schema 0.3 after stage 2 batch 1 audit
- Prototype signed off, schema 0.2, goals replace symptoms as entry point
