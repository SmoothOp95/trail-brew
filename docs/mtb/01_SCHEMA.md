# 01_SCHEMA.md

MTB Setup Triage Dashboard: data contract

Version 0.3
Status: revised against stage 2 batch 1 output
Owner: Tumi

### Changes in 0.3

Five schema frictions surfaced by the first real harvest, all resolved here. Four of the five are cases where the data was fine and the schema was too narrow.

1. **`count` was doing two jobs.** Manufacturers publish recommended settings far more often than true adjuster totals, and both were round-tripping through one field. Now separated, and the recommendation data gets a table of its own, because it is more useful than the total.
2. **Air springs vary by tier, not just by travel.** A Rhythm air spring and a Factory air spring on the same chassis at the same travel have different factory spacer counts, different part numbers and different pressure charts. The schema had no slot for that.
3. **Pressure charts come in two shapes.** Bracket tables and continuous curves interpolate differently and cannot share a read path silently.
4. **Adjusters can nest.** FIT4's open mode has its own fine adjustment inside the lever position.
5. **Single-value sag targets are real.** Rule 5 relaxed rather than worked around.

Also added: `fields_pending`, so a record can declare which fields are deliberately null with a known source, making gaps queryable instead of indistinguishable from oversights.

### Changes in 0.2

The interactive prototype changed three things that the data model has to carry.

1. **Goals replaced symptoms as the primary entry point.** The rider states what they want from the bike, not what is wrong with it. Symptoms remain as a secondary path. Section 12 is rewritten around this.
2. **Capability resolution is three-state, not two.** An adjuster can be counted, coarse, or absent. A Sweep-Adjust can express "more support" but not "two clicks", and that distinction has to reach the UI. See the capability resolution rules under `adjusters`.
3. **Conflicts between goals are a first class output.** Two goals can pull against each other, and saying so is more useful than silently summing the deltas. New `conflict` table.

Also added: an attribute model for the radar output, minimum pressures, and a tyre pressure model that is a real model rather than a linear guess.

## Purpose

This is the single source of truth for every table, field and enum in the project. Three consumers read it:

1. **Claude in Chrome**, executing the harvest files (`02`, `03`, `04`). It must produce JSON that validates against this document exactly.
2. **Claude Code**, executing `07_BUILD_SPEC.md`. It builds the database, API and shared client codebase against these types.
3. **The chat prototype**, which uses a cut-down subset of the same shapes so prototype work transfers cleanly.

If a harvest agent finds real-world data that does not fit a shape defined here, it must not reshape the data to fit. It records the mismatch in its completion report and leaves the field null.

## Scope for v1

In scope: full suspension mountain bikes and hardtails, sold in South Africa.

Out of scope for v1, but the schema reserves fields for them so they can be added without migration: e-MTBs, gravel and road, dirt jump.

## Conventions

### Identifiers

All ids are lowercase snake_case slugs, stable, and never reused. Format is `brand_model_year` or `brand_model_variant`.

```
fox_36_2024
grip_sweep_adj_2024
fox_float_evol_36_150
trek_fuel_ex_gen6_2024
maxxis_assegai_29x2_5_exo_plus
```

Where a component spans model years without change, use the first year of the range and record `year_range`.

### Units

| Quantity | Unit | Notes |
|---|---|---|
| Length | mm | integers, or one decimal where the source gives one |
| Pressure | psi | canonical. Never store bar. Convert at display time |
| Mass | kg | rider and bike |
| Volume | cc | volume spacers, oil |
| Angle | degrees | one decimal |
| Torque | Nm | |
| Time | hours | service intervals |

### Null versus zero

This distinction is load bearing and is the most common way this dataset can be silently wrong.

- `null` means the adjuster or field **does not exist** on this component.
- `0` means it exists and its value is zero.

A fork with no high speed compression dial has `hsc: null`. A fork whose HSC is set fully open has `hsc.count` populated and a setting value of `0`. The triage rules engine gates on existence, so conflating these produces advice the rider physically cannot follow.

### Confidence

Every record that contains a derived, inferred or estimated value carries a confidence field.

```
"confidence": "measured" | "published" | "derived" | "estimated"
```

- `measured`: physically counted or measured, for example clicks counted on a real unit.
- `published`: read directly from a manufacturer document.
- `derived`: calculated from published values by a documented formula, for example average leverage from travel divided by stroke.
- `estimated`: assumed from a category archetype. Must carry a `confidence_note`.

The UI surfaces anything below `published` to the rider. A tool that hides its guesses is not trustworthy.

### Provenance

Every record carries a provenance block. No exceptions.

```json
"source": {
  "url": "https://...",
  "document": "2024 FOX 36 Owner's Manual",
  "retrieved": "2026-09-02",
  "method": "public_pdf" | "session_page" | "manual_entry" | "cross_check"
}
```

Where a record is assembled from more than one source, `source` becomes an array.

### Pending fields

A record often has to be written before every field can be filled, because the remaining fields live in a different document at a different access tier. FOX splits adjuster data into the owner's manual and dimensional data into a session-gated spec sheet, so a chassis record is genuinely half-writable.

```json
"fields_pending": [
  { "field": "offset_options_mm", "expected_source": "FOX tech portal spec sheet", "tier": "B" }
]
```

Without this, a null field is indistinguishable from a field nobody looked for. With it, the next harvest pass can query for its own worklist instead of re-reading a completion report written by a different agent on a different day.

Never use `fields_pending` to excuse a guess. It records absence, not uncertainty. Uncertainty is what `confidence` is for.

## Tables

### 1. `chassis`

The mechanical fork body, independent of damper and air spring.

| Field | Type | Notes |
|---|---|---|
| `id` | string | `fox_36_2024` |
| `brand` | string | |
| `model` | string | `36` |
| `stanchion_mm` | int | 32, 34, 35, 36, 38, 40 |
| `travel_options_mm` | int[] | every travel this chassis accepts |
| `axle_std` | string | `boost_110x15`, `torque_cap`, `20x110` |
| `offset_options_mm` | int[] | |
| `steerer` | string | `tapered_1_5`, `straight_1_125` |
| `wheel_sizes` | string[] | `29`, `27_5` |
| `max_rotor_mm` | int | |
| `brake_mount` | string | `pm_180`, `pm_200` |
| `year_range` | [int, int] | |
| `confidence` | enum | |
| `source` | object | |

### 2. `damper`

The constraint layer. This table is what makes triage possible rather than just calculation, and it is the highest value manual work in the project.

| Field | Type | Notes |
|---|---|---|
| `id` | string | `grip_sweep_adj_2024` |
| `brand` | string | |
| `name` | string | `GRIP with Sweep-Adjust` |
| `tier` | string | `oem`, `performance`, `performance_elite`, `factory`, `ultimate`, `select`, `base` |
| `type` | string | `fork` or `shock` |
| `adjusters` | object | see below |
| `year_range` | [int, int] | |
| `confidence` | enum | |
| `source` | object | |

#### `adjusters` object

Four keys, always present, each either `null` or an object.

```json
"adjusters": {
  "lsc": { "type": "sweep", "count": null, "positions": ["open", "firm"], "detented": false, "direction": "cw_firmer" },
  "hsc": null,
  "lsr": { "type": "clicks", "count": 10, "positions": null, "detented": true, "direction": "cw_slower" },
  "hsr": null
}
```

`type` is one of:

- `clicks`: discrete detented adjuster. `count` is the total number of clicks from one extreme to the other.
- `sweep`: continuous or semi-continuous sweep between named endpoints. `count` null, `positions` holds the endpoint labels.
- `lever`: discrete lever positions. `positions` holds the labels, for example `["open", "medium", "firm"]`. `count` equals the number of positions.
- `lockout`: binary. `positions` is `["open", "locked"]`.

`direction` records which way the adjuster goes firmer or slower, so the UI can express a change as "2 clicks clockwise" rather than an ambiguous "add 2".

#### `count` versus recommendation

`count` means one thing only: **the total number of positions from one mechanical extreme to the other.** It is the adjustment headroom. Nothing else goes in this field.

Manufacturers rarely publish it. What they publish, constantly, is a recommended starting point by rider weight. Those two numbers look alike and mean completely different things, and putting a recommendation into `count` would tell the engine a fork has eight clicks of adjustment when it has twenty four, three of which the manual happens to suggest.

Three fields, all optional, all on the adjuster object:

| Field | Type | Meaning |
|---|---|---|
| `count` | int or null | true total, extreme to extreme |
| `count_basis` | enum | `stated_total`, `functional_total`, `physical_count`, null |
| `usable_range` | [int, int] or null | where the manufacturer says the adjuster actually does something |

`functional_total` covers the case where a manual states that settings beyond a point stop changing damping. That is a real ceiling for tuning purposes even though the dial keeps turning, and it should be treated as the total.

When a manual publishes only a weight-based recommendation, `count` stays null and the recommendation goes into a `setting_chart` record, not here.

#### Nested adjusters

An adjuster position can itself contain a finer adjustment. FIT4's open mode has its own multi-position fine tune sitting inside the lever's open position. Model it as an optional `sub_adjuster` on the parent:

```json
"lsc": {
  "type": "lever", "count": 3, "positions": ["open","medium","firm"],
  "sub_adjuster": { "within_position": "open", "type": "clicks", "count": 22, "label": "Open Mode Adjust" }
}
```

The rules engine offers the sub-adjuster only when the parent is in `within_position`. Leaving it undocumented would tell a FIT4 owner they have three positions when they have three positions and twenty two more inside one of them.

Worked examples for the four units in the prototype:

```
grip_sweep_adj_2024   lsc: sweep       hsc: null        lsr: clicks 10   hsr: null
grip_x2_2024          lsc: clicks 8    hsc: clicks 8    lsr: clicks 8    hsr: clicks 8
charger_3_1_2025      lsc: clicks 5    hsc: clicks 5    lsr: clicks 18   hsr: null
motion_control_2020   lsc: lockout     hsc: null        lsr: clicks 10   hsr: null
float_dps_3pos_2023   lsc: lever 3     hsc: null        lsr: clicks 10   hsr: null
float_x_2023          lsc: clicks 8    hsc: null        lsr: clicks 10   hsr: null
```

Note that `float_dps_3pos_2023` uses a three position lever and a rebound dial, with no separate low speed compression dial. This is the correct representation for the Fuel EX Gen 6 stock shock.

#### Capability resolution

Given a requested change to an adjuster, the engine resolves to one of three states. This is derived from `adjusters`, not stored.

| State | Condition | Behaviour |
|---|---|---|
| `counted` | adjuster exists and `type` is `clicks` | Express the change as a click count and a direction. "Two clicks clockwise." |
| `coarse` | adjuster exists and `type` is `sweep` or `lever` | Express the change as a step between named positions, and tell the rider it is coarse. "Wind Sweep-Adjust toward firm." |
| `absent` | adjuster is `null`, or `type` is `lockout` and the request is for fine compression tuning | Do not offer the change. Show it as ruled out with the reason, and fall through to the next candidate. |

`lockout` resolves to `absent` for tuning requests because a lockout is a binary on-trail control, not a tuning adjuster. It resolves to `counted` only for an explicit lock or unlock instruction.

The distinction matters because the three states produce three different sentences in the UI, and a tool that renders all non-`clicks` adjusters as unavailable will wrongly tell a Fuel EX owner that they cannot add rear platform when they have a three position lever sitting right there.

### 3. `air_spring`

| Field | Type | Notes |
|---|---|---|
| `id` | string | `fox_float_evol_36_150` |
| `brand` | string | |
| `name` | string | `FLOAT EVOL` |
| `type` | string | `air`, `coil` |
| `negative` | string | `self_equalising`, `separate_chamber`, `none` |
| `chassis_id` | string | fk |
| `tier_applies_to` | string[] | which fork tiers share this spring. `["rhythm"]`, `["performance","factory"]` |
| `travel_mm` | int | one record per travel |
| `spacer_pn` | string | `234-44-079` |
| `spacer_volume_cc` | number | 10 |
| `spacer_factory` | int | fitted from factory |
| `spacer_max` | int | |
| `pressure_max_psi` | int | |
| `pressure_min_psi` | int | below this the negative chamber stops equalising properly |
| `sag_target_pct` | [int, int] | `[15, 20]` |
| `equalise_note` | string | for example the EVOL requirement to cycle the fork during inflation |
| `confidence` | enum | |
| `source` | object | |

Coil springs use the same table with `type: "coil"`, `spacer_*` null, and an additional `spring_rates_lbin` int array.

### 4. `pressure_chart`

Manufacturer pressure recommendations, stored as compact arrays for payload size.

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `air_spring_id` | string | fk |
| `points` | [int, int][] | `[[kg, psi], ...]` ordered ascending by kg |
| `basis` | string | `rider_only` or `rider_plus_kit`. Critical, charts differ |
| `point_type` | enum | `curve` or `bracket` |
| `applies_to_travel_mm` | int[] | a single published table often covers several travels |
| `confidence` | enum | |
| `source` | object | |

The `basis` field matters. FOX charts are typically rider weight in riding gear. Getting this wrong shifts every recommendation by several psi.

`point_type` matters just as much. A `curve` interpolates linearly between points. A `bracket` table assigns a single value to a weight band, and interpolating across a band boundary invents a precision the manufacturer did not offer. Store bracket tables as their boundary points and read them as steps, not slopes.

### 4b. `setting_chart`

Manufacturer recommended starting points for damper adjusters, by rider weight. Same shape as `pressure_chart`, different subject.

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `damper_id` | string | fk |
| `adjuster` | enum | `lsc`, `hsc`, `lsr`, `hsr` |
| `unit` | enum | `clicks_from_closed`, `clicks_from_open`, `position` |
| `points` | [number, number][] | `[[kg, setting], ...]` |
| `basis` | string | as pressure_chart |
| `point_type` | enum | `curve` or `bracket` |
| `confidence`, `source` | | |

**This table is more valuable than the adjuster totals it was mistaken for.** The prototype derives a rebound starting point by multiplying the click count by 0.7, which is a guess standing in for data the manufacturer publishes directly. Wherever a `setting_chart` exists for a damper and adjuster, the baseline uses it and the guess never runs.

`unit` must be captured, not assumed. A recommendation of "8" means opposite things depending on whether the manufacturer counts from closed or from open, and normalising to `clicks_from_closed` requires knowing the total, which is exactly the thing that is usually missing. Store what the source said and convert only when the total is known.

### 5. `fork_unit`

The composed, purchasable thing. This is what a rider selects.

| Field | Type | Notes |
|---|---|---|
| `id` | string | `fox_36_rhythm_150_2024` |
| `display_name` | string | `FOX 36 Rhythm 150 (GRIP Sweep-Adjust)` |
| `chassis_id` | string | fk |
| `damper_id` | string | fk |
| `air_spring_id` | string | fk |
| `travel_mm` | int | |
| `offset_mm` | int | |
| `tier` | string | |
| `model_year` | int | |
| `part_number` | string | nullable |
| `service_interval_h` | object | `{ "lower_leg": 50, "full": 125 }` |
| `oil` | object | `{ "air_bath_cc": 10, "air_bath_spec": "FOX 20wt Gold", "damper_bath_cc": 40, "damper_bath_spec": "FOX 5wt Teflon" }` |
| `known_issues` | string[] | free text, for example out of box bushing bind on 2024 units |
| `sa_availability` | enum | `oem_common`, `oem_rare`, `aftermarket`, `import_only` |
| `confidence` | enum | |
| `source` | object | |

### 6. `shock_unit`

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `display_name` | string | |
| `brand`, `model`, `tier`, `model_year` | | |
| `damper_id` | string | fk |
| `mount` | string | `trunnion`, `eyelet` |
| `sizes` | object[] | `[{ "ee_mm": 185, "stroke_mm": 55 }]` |
| `air_can` | string | `evol_lv`, `evol_hv`, `standard`, `coil` |
| `spacer_pn`, `spacer_volume_cc`, `spacer_factory`, `spacer_max` | | as air_spring |
| `sag_target_pct` | [int, int] | typically `[25, 30]` |
| `pressure_max_psi` | int | |
| `service_interval_h` | object | |
| `oem_tune` | string | nullable, for example `tuned by Trek Suspension Lab` |
| `part_number` | string | nullable |
| `sa_availability` | enum | |
| `confidence`, `source` | | |

### 7. `frame`

| Field | Type | Notes |
|---|---|---|
| `id` | string | `trek_fuel_ex_gen6_2024` |
| `brand`, `model`, `model_year` | | |
| `category` | enum | `xc`, `downcountry`, `trail`, `enduro`, `dh`, `hardtail_xc`, `hardtail_trail` |
| `suspension_type` | enum | `full_suspension`, `hardtail` |
| `platform` | string | `abp`, `horst_link`, `vpp`, `dw_link`, `single_pivot`, `flex_stay`, `high_pivot`, `null` for hardtails |
| `sizes` | string[] | |
| `rear_travel_mm` | int or null | **null for hardtails** |
| `shock_ee_mm`, `shock_stroke_mm` | int or null | null for hardtails |
| `max_fork_travel_mm` | int | |
| `stock_fork_unit_id` | string | fk, nullable |
| `stock_shock_unit_id` | string | fk, nullable |
| `flip_chip` | object or null | `{ "name": "Mino Link", "states": ["low", "high"], "effect": "10mm BB, 8mm reach, 0.6deg HTA" }` |
| `headset_adjust` | object or null | angle adjust cup options |
| `bb_standard` | string | `bsa_73`, `pf92`, `t47` |
| `chain_guide_mount` | string | `iscg_05`, `bb_mount`, `none` |
| `hanger` | string | `udh`, `proprietary` |
| `msrp_zar` | int or null | |
| `sa_channel` | string | distributor or retailer |
| `confidence`, `source` | | |

Hardtail handling: `suspension_type: "hardtail"` with `rear_travel_mm`, `shock_*` and `platform` all null. The rules engine must branch on this field and suppress every rear suspension symptom and every shock baseline output. Tyre pressure and fork rules still apply, and in fact carry more weight, since the rear tyre is the only rear compliance the bike has.

E-MTB reserved fields, null in v1: `motor_id`, `battery_wh`, `system_mass_kg`.

### 8. `frame_geo`

One row per frame, per size, per flip chip state. Denormalised deliberately, because riders select by size.

| Field | Type |
|---|---|
| `id` | string, `trek_fuel_ex_gen6_2024_L_low` |
| `frame_id` | string fk |
| `size` | string |
| `config` | string, `low`, `high`, `mullet`, `slack_low`, `steep_high` and so on |
| `reach_mm`, `stack_mm`, `ett_mm`, `seat_tube_mm` | number |
| `hta_deg`, `sta_deg`, `esta_deg` | number |
| `chainstay_mm`, `wheelbase_mm`, `front_centre_mm` | number |
| `bb_height_mm`, `bb_drop_mm`, `standover_mm`, `trail_mm` | number |
| `fork_axle_to_crown_mm` | number, the geo table assumes a specific fork |
| `confidence`, `source` | |

### 9. `kinematics`

The hardest table to source and the one that separates this from a weight to psi lookup.

| Field | Type | Notes |
|---|---|---|
| `id` | string |
| `frame_id` | string fk |
| `leverage_start` | number | at topout |
| `leverage_at_sag` | number | at 30 percent |
| `leverage_end` | number | at bottom out |
| `progression_pct` | number | `(start - end) / start * 100` |
| `curve` | [number, number][] or null | `[[travel_pct, leverage], ...]` if a real curve is available |
| `anti_squat_at_sag` | number or null | |
| `anti_rise_at_sag` | number or null | |
| `derivation` | string | `published_curve`, `linkage_software`, `review_derived`, `travel_over_stroke` |
| `confidence` | enum | |
| `source` | object | |

Fallback rule when nothing better exists: `leverage_at_sag = rear_travel_mm / shock_stroke_mm`, `derivation: "travel_over_stroke"`, `confidence: "derived"`, `progression_pct` assumed from `frame.platform` archetype and marked `estimated`.

Hardtails have no kinematics record.

### 10. `tyre`

Seeded from the existing Maxxis matrix, extended to Schwalbe, Continental, Michelin, Vittoria.

| Field | Type | Notes |
|---|---|---|
| `id` | string | `maxxis_assegai_29x2_5_exo_plus_3ct` |
| `brand`, `model` | string | |
| `width_stated_in` | number | 2.5 |
| `width_measured_mm` | int or null | on a stated rim internal width |
| `measured_on_rim_mm` | int or null | |
| `casing` | enum | `thin`, `medium`, `thick_dh`, `radial` |
| `casing_name` | string | `EXO+`, `DoubleDown`, `Super Gravity` |
| `compound` | string | `3CT MaxxTerra` |
| `tpi` | int | |
| `weight_g` | int | |
| `position` | enum | `front`, `rear`, `either` |
| `scores` | object | `{ "rolling": 4, "cornering": 10, "braking": 10 }` 1 to 10 |
| `terrain` | object | `{ "hardpack": 8, "loose_over_hard": 10, "medium": 10, "loose": 10, "wet_mud": 5 }` |
| `confidence`, `source` | | |

`scores` and `terrain` are subjective ratings, not measurements. They carry `confidence: "estimated"` unless sourced from a published lab test.

### 11. `rider_profile`

Stored client side. Not harvested.

| Field | Type |
|---|---|
| `kitted_weight_kg` | number |
| `height_cm`, `inseam_cm`, `shoulder_width_cm` | number |
| `bike_weight_kg` | number |
| `ability` | enum `beginner`, `intermediate`, `advanced`, `expert` |
| `style` | enum `xc`, `trail`, `all_mountain`, `enduro`, `dh` |
| `terrain` | enum[] `hardpack`, `loose_over_hard`, `loam`, `rock`, `roots`, `wet` |
| `priorities` | ranked enum[] `grip`, `support`, `comfort`, `pop`, `efficiency`, `bottom_out_control` |
| `insert` | enum `none`, `cushcore`, `rimpact`, `other` |

### 12. `goal`, `conflict`, `symptom`, `cause`

Authored in stage 5, not harvested. Defined here so the harvest agent understands what the damper table feeds.

#### `setting_field`

The controlled vocabulary that every recipe and cause writes against. Fixed list, do not extend without a schema change.

```
fork_psi        fork_spacers    fork_lsr    fork_hsr    fork_lsc    fork_hsc
shock_psi       shock_spacers   shock_lsr   shock_hsr   shock_lsc   shock_hsc
tyre_front      tyre_rear       flip_chip
```

Each field carries a resolver that returns its current value, its min and max from the component record, and its capability state.

#### `goal`

The primary entry point. What the rider wants, phrased so it can be answered without diagnosing anything.

| Field | Type | Notes |
|---|---|---|
| `id` | string | `more_pop` |
| `name` | string | rider facing, imperative or noun phrase |
| `sub` | string | one line on what it means in practice |
| `applies_to` | enum[] | `full_suspension`, `hardtail` |
| `recipe` | object | map of `setting_field` to signed delta |
| `rationale` | object | map of `setting_field` to one sentence explaining the mechanism |

Example:

```json
{
  "id": "rock_garden_control",
  "name": "More control in rock gardens",
  "sub": "Tracks the ground, stops deflecting",
  "applies_to": ["full_suspension", "hardtail"],
  "recipe": { "fork_psi": -5, "fork_spacers": 1, "fork_hsc": -2, "fork_lsr": 1, "tyre_front": -1.5 },
  "rationale": { "fork_hsc": "Opening high speed compression lets the fork absorb square edges instead of spiking off them." }
}
```

Composition rules:

1. A rider may select up to three goals. Beyond three the deltas cancel and the output stops meaning anything.
2. Deltas for the same `setting_field` sum across selected goals.
3. Every delta is resolved against capability before it is summed. `absent` fields are dropped from the sum and surfaced separately as ruled out, with the reason and the goal that wanted them.
4. Summed values are clamped to the field min and max from the component record, not to hardcoded numbers.
5. Each surviving change records which goals drove it, so the UI can attribute it.

#### `conflict`

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `goal_a`, `goal_b` | string fk | order does not matter |
| `axis` | string | the attribute or adjuster they fight over |
| `text` | string | what the trade is, in plain terms |
| `severity` | enum | `cancels`, `trades`, `mild` |

`cancels` means the two recipes push the same field in opposite directions and the net change is near zero. `trades` means both changes happen but one attribute is bought with another. `severity` decides how loudly the UI says so.

Conflicts are authored, not derived. A derived conflict detector would fire on every partial overlap and become noise. That said, the engine must also flag the mechanical case where summed deltas for a field net to zero, since that is a real result the rider should see.

#### `attribute`

The six axes of the radar output.

```
grip   support   comfort   pop   bottom_out   pedalling
```

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `label` | string | |
| `weights` | object | map of normalised input to signed coefficient |
| `fit_basis` | enum | `expert_prior`, `fitted` |
| `fit_note` | string | what the model was fitted against |

The model scores each attribute from 0 to 10, with 5 being the computed baseline for that rider and bike. Inputs are normalised deviations from baseline: pressure, spacer count, rebound clicks, compression clicks, tyre pressure.

**Every attribute record ships with `fit_basis: "expert_prior"` until it has been fitted against real logged outcomes.** The weights currently in the prototype are informed guesses and are not defensible as measurements. Stage 6 fits them against known outcomes and flips the flag. The UI must not present radar output as more certain than this field says it is.

#### `symptom` and `cause`

The secondary entry point, for riders who already know what is wrong.

`symptom`

| Field | Type |
|---|---|
| `id` | string, `front_harsh_chatter` |
| `axis` | enum `front`, `rear`, `whole_bike` |
| `text` | string, rider facing phrasing |
| `applies_to` | enum[] `full_suspension`, `hardtail` |

`cause`

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `symptom_id` | string fk | |
| `rank` | int | default ordering |
| `class` | enum | `service`, `tyre`, `spring`, `ramp`, `damping`, `geometry`, `hardware` |
| `requires` | `setting_field` or null | resolved through capability resolution |
| `action` | string | the change, with magnitude |
| `magnitude` | object | `{ "field": "fork_psi", "delta": -5, "unit": "psi" }` |
| `expect` | string | what the rider should feel if the hypothesis was right |
| `falsify` | string | what it means if nothing changes |

Goals and causes share the `setting_field` vocabulary and the same capability resolution, so a change produced by either path renders identically.

#### Locked decisions

These were provisional in 0.1 and are now settled by the prototype.

**Preconditions are a banner, not ranked cards.** Service state, tyre pressure and cockpit fit render once at the top as a dismissible block. They are not competing for rank against damping changes. Dismissal persists per bike per session.

**Magnitudes are fixed deltas in v1.** Computed deltas from `leverage_at_sag` come in v2. The `magnitude` object is already shaped for it.

**Confidence renders on the baseline block only**, and only when a record resolves below `published`. The radar carries its own `fit_basis` disclosure separately, because that is a different kind of uncertainty and collapsing them would mislead.

**Ordering of changes** follows the fixed sequence: tyre, spring rate, ramp, rebound, compression, geometry. This is the order in which a change to one invalidates your read on the next.

### 13. `session_log`

Client side, persisted. Schema mirrors the How To Bike test sheet structure, which is a correct experimental design and is not being improved on.

| Field | Type |
|---|---|
| `id`, `bike_id`, `date`, `location`, `conditions` | |
| `baseline` | settings object |
| `laps` | array of `{ lap, changed_field, from, to, note, verdict }` |
| `final` | settings object |
| `carried_forward_from` | previous session id |

`verdict` is `better`, `worse`, `same`. This closes the loop twice over. A cause whose expected outcome is confirmed strengthens its rank for that rider, and one that is repeatedly rejected drops. Separately, every logged lap is a labelled training example for the attribute model: a goal was selected, specific fields moved by known amounts, and the rider said whether it worked. That is the dataset stage 6 needs to move `attribute.fit_basis` off `expert_prior`.

The log therefore records the selected goal ids alongside the field deltas, not just the resulting settings. Recording only the end state throws away the label.

## Validation rules

Applied by the harvest agent before writing any record.

1. Every record has a non-empty `source.url` and `source.retrieved`.
2. Every `*_id` foreign key resolves to an existing record, or the record is held back and listed in the completion report as an orphan.
3. `adjusters` has all four keys present. Missing keys are a hard fail, not a null.
4. `pressure_chart.points` is ordered ascending by kg and has at least three points.
5. `sag_target_pct[0] <= sag_target_pct[1]`. A source that states a single target rather than a range writes it as `[30, 30]`, which is honest. Do not invent a range around a single number to satisfy a stricter rule.
6. `spacer_factory <= spacer_max`.
7. `frame_geo.reach_mm` between 380 and 540. Outside that range, flag rather than write.
8. `frame.suspension_type == "hardtail"` implies `rear_travel_mm`, `shock_ee_mm`, `shock_stroke_mm`, `platform` are all null.
9. No record carries `confidence: "estimated"` without a `confidence_note`.
10. Numbers are numbers, not strings. `"150mm"` is a fail, `150` is correct.

## Payload budget

The chat artifact inlines the dataset. Target under 150 KB minified JSON for the artifact subset.

Normalise by reference, never by duplication. The FOX 36 Rhythm, Performance and Factory share one `chassis` and one `air_spring` record and differ only by `damper_id`. Flattened that is three copies of the chassis, which is exactly the mistake that blows the budget.

The web and iOS build has no such limit and consumes the full normalised set from the API.

### 14. `tyre_pressure_model`

The prototype used a linear function of rider weight, which is wrong enough to matter. Tyre pressure is the highest leverage adjustment on the bike and the one most riders get worst, so it deserves a real model rather than a placeholder.

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `inputs` | string[] | `system_mass_kg`, `measured_width_mm`, `rim_internal_mm`, `casing`, `insert`, `terrain_aggression`, `wheel_diameter` |
| `front_rear_split` | [number, number] | mass distribution assumption, for example `[0.42, 0.58]` |
| `coefficients` | object | |
| `insert_offset_psi` | object | map of insert type to psi offset |
| `bounds_psi` | [number, number] | hard floor and ceiling, refuse to recommend outside |
| `confidence` | enum | |
| `source` | object | |

Implement the methodology, do not scrape any calculator's output. Casing thickness and measured versus stated width both materially change the answer, and the widely used road and gravel models cap out well below trail tyre widths, so they cannot simply be extended.

## Open items

- `pressure_chart.basis` needs verifying per brand. Do not assume.
- Coil spring rate recommendation needs a separate model, not covered in v1.
- Insert effect on tyre pressure is currently a flat offset. Needs better sourcing.
- `attribute.weights` are expert priors and must be fitted in stage 6 before the radar can be presented as anything more than directional.
- The goal list is eight items chosen without rider research. If the entry point is wrong, everything downstream is wrong. Worth validating against real riders before the build stage.
- Frame silhouette for the bike diagram is generic per `frame.category` in v1. Per-frame silhouettes are a nice-to-have, not a v1 requirement.
