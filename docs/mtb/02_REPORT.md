# Stage 2 completion report

Batch: 1 (still partial — batch 1's own damper list is now fully represented, but several sub-items in the "Done criteria" are not met yet; see "Gaps")
Date: 2026-09-02
Sheet URL: none - skipped for this pass by Tumi's instruction (no Google Sheets tool connected this session; JSON is canonical per the spec anyway)

## Why this is a second pass, not a first

The first pass this session hit a Claude in Chrome infrastructure issue (the extension's
navigation safety-check timing out under model load) after only reading two already-uploaded
project PDFs. That pass banked what it could, wrote an interim report, and stopped rather than
guess or loop-retry. Tumi then asked to retry; navigation worked on retry, and this pass used
live browsing to fetch all five FOX owner's-manual pages that were previously only URL-mapped:
2024 36/38mm forks, 2024 32/32TC/34/34AWL forks, 2025 36/38mm forks (introduces GRIP X / GRIP X2),
2024 FLOAT X2 shock, and 2024 all-coil shocks (DHX/DHX2). That closes out the FOX side of batch 1's
damper list. RockShox's damper adjuster data (Motion Control, Charger family, Deluxe/Vivid family)
is still unfetched — see Gaps.

In this pass I also caught and corrected an issue in my own first-pass output: three RockShox
`air_springs` records carried `sag_target_pct: [15,20]` with `confidence: "published"`, but that
range was never actually stated in the RockShox source I'd read (SRAM's front suspension spec PDF)
— it was carried over unflagged. Those three records are now `confidence: "estimated"` with a
`confidence_note` admitting the gap, per ground rule 3 ("do not guess... an invented value poisons
every downstream recommendation").

## Counts

| File | Records | Validated | Held back |
|---|---|---|---|
| chassis.json | 14 | 14 | 0 |
| dampers.json | 13 | 13 | 0 (RockShox damper family not started - see Gaps) |
| air_springs.json | 5 | 5 | 0 |
| pressure_charts.json | 5 | 5 | 0 |
| fork_units.json | 3 | 3 | 0 |
| shock_units.json | 4 | 4 | 0 |

All six files pass the validation rules that don't require live re-fetching (source.url/retrieved
present, FK resolution, adjusters four-key completeness, pressure_chart point ordering/count ≥3,
spacer_factory<=spacer_max, estimated-needs-confidence_note, numbers-not-strings-or-null) — checked
programmatically via `validate.py`. Two `shock_units` records (`fox_float_x2_factory_2024`,
`fox_dhx2_factory_2024`) carry `sag_target_pct: [30,30]` rather than an ascending pair; `validate.py`
flags these as a documented exception, not a silent pass — see Schema friction #1 below for why.

## Coverage

Dampers captured, by brand and model, with adjuster completeness:

| damper_id | lsc | hsc | lsr | hsr | complete? |
|---|---|---|---|---|---|
| float_dps_3pos_2023 | lever, 3 pos | null | clicks, count null | null | keys complete; lsr count not published (image table) |
| float_x_2023 | clicks, count null | null | clicks, count null | null | keys complete; counts not published (image table) |
| fox_float_x2_factory_2024 | clicks, count null | clicks, count null | clicks, count null | clicks, count null | keys complete; full 4-way, all counts null (recommendation table, not a total) |
| fox_float_x2_perf_elite_2024 | clicks, count null | null | clicks, count null | null | keys complete; hsc/hsr null per manual's explicit statement (Performance/Elite tune has no HSC/HSR dial) |
| fox_dhx2_factory_2024 | clicks, count null | clicks, count null | clicks, count null | clicks, count null | keys complete; full 4-way, all counts null |
| fox_dhx2_performance_elite_2024 | clicks, count null | null | clicks, count null | null | keys complete; hsc/hsr null per manual's explicit statement |
| fox_dhx_2024 | clicks, count null, detented unknown | null | null | null | keys complete; lsc-only per manual, heavily caveated |
| fox_fit4_2024 | lever, 3 pos | null | clicks, count null | null | keys complete; 22-position "Open Mode Adjust" sub-feature not modeled (schema friction #4) |
| fox_grip_2024 | sweep, [open,medium,firm] | null | clicks, count null | null | keys complete |
| fox_rail_2024 | sweep, [open,firm] | null | clicks, count null | null | keys complete; this is the real unit behind 01_SCHEMA.md's `grip_sweep_adj_2024` worked example |
| fox_grip2_2024 | clicks, count null | clicks, **count 16** | clicks, count null | clicks, count null | keys complete; HSC is the one true total-click figure found in this whole pass |
| fox_grip_x_2025 | clicks, count null | clicks, count null | clicks, count null | null | keys complete; hsr null - 2025 rebound table shows GRIP X has a single unified rebound column, not separate lsr/hsr |
| fox_grip_x2_2025 | clicks, count null | clicks, count null | clicks, count null | clicks, count null | keys complete; full 4-way |

RockShox `Motion Control`, `Charger RC`, `Charger 2.1`, `Charger 3`, `Charger 3.1`, `Charger Race Day`,
`Deluxe`, `Super Deluxe`, `Super Deluxe Ultimate`, `Vivid`: **still no damper adjuster records.**
RockShox's front suspension spec PDF (already read) gives oil/pressure/technical-spec tables, not
adjuster click counts or directions — that data lives in the RockShox Suspension Welcome Guide, which
requires live browsing not yet done this pass.

RockShox fork chassis captured (10, unchanged from pass 1): 35, Pike, Lyrik, ZEB, Domain, Yari,
Revelation, SID, SID SL, Reba. FOX fork chassis newly captured (4): 36, 38, 34, 32 (all 2024) — these
carry `axle_std`, `steerer`, `wheel_sizes` and `travel_options` from the owner's manuals, but
`offset_options_mm` and `max_rotor_mm` are `null`: that dimensional data lives in FOX's separate Spec
Sheet resource (tech.ridefox.com, tier B / session-gated per the harvest doc), not fetched this pass —
left `null` rather than guessed.

Full air_spring + pressure_chart pairs: 3 RockShox (Pike, Lyrik, ZEB — unchanged) + 2 new FOX (36, 38
EVOL). `fork_units.json` went from empty to 3 real composed records (FOX 36 Factory/Performance,
FOX 38 Factory) — first fork_unit records of the project. `shock_units.json` went from 2 to 4 (added
FLOAT X2 Factory, DHX2 Factory).

## Gaps

- **RockShox Suspension Welcome Guide** (`sram.com/en/rockshox/learn/suspension-welcome-guide`) — not
  yet fetched. Needed for all 10 RockShox dampers in batch 1's target list (Motion Control, Charger
  family, Deluxe/Super Deluxe/Vivid family). This is now the single largest remaining gap in batch 1.
- **FOX dimensional Spec Sheets** for the 4 new FOX chassis (32/34/36/38mm) — `offset_options_mm` and
  `max_rotor_mm` null on all four. Tier B source (tech.ridefox.com), session-gated, screenshot+zoom
  pattern per the harvest doc.
- `needs_physical_count`: every FOX damper's click counts are `null` (13 of 13). FOX's owner's manuals
  publish weight-based *recommended starting point* tables ("back it out to N clicks for your weight"),
  not true extreme-to-extreme totals — see Schema friction #2. The one exception is GRIP2's HSC, where
  the manual states "beyond 16 clicks... do not change damping further," an explicit total. Everything
  else needs either a physical count or a different FOX source (parts/service manual with a spec table)
  that states true totals rather than recommendations.
- `float_dps_3pos_2023` / `float_x_2023`: unchanged from pass 1 — click tables in that manual are
  images, not extractable text.
- Pressure charts / air springs pending for the other 7 RockShox chassis already captured (35, Domain,
  Yari, Revelation, SID, SID SL, Reba) — source data exists in the already-read SRAM PDF, not yet
  transcribed.
- FOX bath oil volumes and service intervals: available in the fetched manuals but not yet folded into
  fork_unit-level records beyond what's already there.
- Twenty RockShox TrailHead validation pairs (batch 1's own done-criteria item, for stage 6): **not
  attempted.** TrailHead needs a real serial number or model code per lookup; none available offline.
  Needs either serials from Tumi's own bikes or a documented sampling method, plus live browsing.
- FOX 40mm (DH fork, id 2929) not fetched — outside the batch 1 minimum list (GRIP/FIT4/GRIP2/GRIP X/
  GRIP X2 are all covered without it) but flagged in case DH coverage matters for SA trail use.

## Conflicts

None encountered — no two sources disagreed on anything captured in either pass.

## Schema friction

1. **A single-value sag target doesn't fit `sag_target_pct`'s implicit range shape.** FOX's FLOAT X2
   and DHX2 manuals state one number ("set sag to approximately 30% of shock travel"), not a range,
   unlike the DPS/X manual's 25-30%. Rule 5 requires `sag_target_pct[0] < sag_target_pct[1]` strictly.
   Writing `[30,30]` satisfies the *shape* honestly (both entries genuinely mean "30%") without
   inventing a range the source doesn't state; validation.py now flags these two records with an
   explicit note rather than either erroring or silently passing. Recommend a schema decision: either
   relax rule 5 to `<=`, or add a `sag_target_single_pct` field for a manual's single-number case, so
   this doesn't need a workaround on every FOX single-value shock going forward.
2. **FOX's click-count tables are recommendation tables, not totals.** Almost every FOX manual
   publishes "recommended clicks out, by rider weight" rather than the schema's intended "total clicks,
   one extreme to the other." Treating a recommendation as a total would misrepresent the unit's actual
   range and mislead the rules engine about how much adjustment headroom exists. This pass wrote
   `count: null` for every such case (12 of 13 FOX dampers) rather than borrow the recommendation
   table's max value, which would look like a real total but isn't one. Recommend the schema (or the
   harvest doc) explicitly distinguish "recommended range" data from "total count" data — right now
   both would round-trip through the same `count` field, and only the confidence_note tells them apart.
3. **RockShox's Air Spring Pressure table is a 7-bin weight bracket table, not a continuous curve**
   (unchanged from pass 1). Bracket-boundary point method used, flagged as needing a schema decision
   before stage 3 generates more RockShox pressure data the same way.
4. **FIT4's "Open Mode Adjust" is a second dial nested inside the LSC position, not a separate
   adjuster.** The 2024 32/34mm manual describes FIT4's open mode as itself having ~22 fine-tune
   positions, in addition to the 3-position Open/Medium/Firm lever. `01_SCHEMA.md`'s `lsc` slot has
   room for one `type`+`count` pair, so this pass modeled FIT4's lsc as `lever, 3 positions` (the
   headline adjuster a rider actually sets) and left the Open Mode Adjust sub-feature undocumented in
   structured form — noted here instead. Recommend deciding whether nested/sub-adjusters need a schema
   slot before FIT4 shows up on enough SA bikes that this omission matters for triage accuracy.
5. **FOX's dimensional data (axle, offset, steerer, max rotor) lives in a separate, session-gated
   resource from the owner's manual that has the adjuster/click data.** RockShox publishes both in one
   PDF; FOX splits them across the owner's manual (adjusters, service) and the tech portal Spec Sheet
   (dimensions), the latter needing tier B's screenshot-and-zoom pattern. This pass captured only the
   owner's-manual side for the 4 new FOX chassis, leaving dimensional fields `null` rather than mixing
   partial data sourced from two different confidence tiers into one record without flagging it.

## Anomalies

None. No page or document content in either pass contained anything resembling an instruction
directed at the harvest agent.

## Recommended changes to stage 3

- Stage 3 still should not start yet. Its precondition (`fork_units.json` / `shock_units.json`
  populated enough to resolve meaningful FKs) is closer but not met: only 3 fork units and 4 shock
  units exist, all FOX-only, and all RockShox dampers are still missing, so any RockShox-forked bike
  spec (the majority of the SA market) will still produce an orphan `missing_components` entry.
- When stage 3 does start, it can now resolve real FKs for bikes speccing: FOX 36/38 Factory or
  Performance forks (GRIP2 or GRIP damper), FOX FLOAT DPS/FLOAT X/FLOAT X2 Factory/DHX2 Factory shocks.
  Everything RockShox-forked, and every FOX Performance-Elite/Elite-tier shock, will still produce
  `missing_components` until the RockShox Welcome Guide pass and a FOX Performance-Elite fork_unit
  compose pass happen.
- Given how much of the SA OEM market is RockShox-forked, recommend doing one more stage 2 pass
  focused solely on the RockShox Suspension Welcome Guide before stage 3, rather than starting stage 3
  now and accepting a large `missing_components` list on the majority brand.

## Next-session resume list (in priority order)

1. Fetch RockShox Suspension Welcome Guide (`sram.com/en/rockshox/learn/suspension-welcome-guide`) for
   Motion Control / Charger RC/2.1/3/3.1/Race Day / Deluxe / Super Deluxe / Super Deluxe Ultimate /
   Vivid adjuster type/count/direction — this closes the single largest remaining batch 1 gap.
2. FOX tech portal (tier B, session-gated) Spec Sheets for the 4 FOX chassis already captured, to fill
   `offset_options_mm` / `max_rotor_mm`.
3. Transcribe air_spring + pressure_chart records for the 7 RockShox chassis already captured but not
   yet paired (35, Domain, Yari, Revelation, SID, SID SL, Reba), same boundary-point method as the
   existing 3.
4. Compose remaining fork_units / shock_units once RockShox damper records exist (Pike+Charger,
   Lyrik+Charger, ZEB+Charger, etc. — the highest-value SA combinations).
5. Sample ~20 RockShox TrailHead validation pairs once real serials/model codes are available (needs
   Tumi's input or a documented sampling method — this is blocked on something only Tumi can supply,
   not on more browsing).
