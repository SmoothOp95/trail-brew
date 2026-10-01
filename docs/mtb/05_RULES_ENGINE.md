# 05_RULES_ENGINE.md

Version 0.1
Stage 5: goals, conflicts, attribute model, symptoms
Executor: Claude in chat, authored not harvested
Depends on: `01_SCHEMA.md` v0.2, and the working prototype `mtb-setup-triage-prototype.html`
Produces: `rules.json`
Consumed by: `07_BUILD_SPEC.md`

## What this stage is

Everything here is written, not scraped. The component and frame tables tell you what the rider's hardware can physically do. This file tells you what to do with it. It is the product.

The prototype already contains a working version of all of it. This file exists to formalise what the prototype proved, expand it to full coverage, and hand Claude Code something implementable that does not require reading the prototype's JavaScript.

**Where this file and the prototype disagree, this file wins.** Where it is silent, the prototype is the reference implementation.

## 1. Setting field vocabulary

Fixed. Every recipe, cause and log entry writes against these ids and no others.

```
fork_psi   fork_spacers   fork_lsr   fork_hsr   fork_lsc   fork_hsc
shock_psi  shock_spacers  shock_lsr  shock_hsr  shock_lsc  shock_hsc
tyre_front tyre_rear      flip_chip
```

Rebound fields are expressed as **clicks from fully closed**, so a higher number always means faster. This is the opposite of how some manufacturers print it, and the conversion happens at the component record, never in the rules. Getting this backwards inverts every rebound recommendation in the system, so it is worth a test case of its own.

## 2. Capability resolution

Before any delta is applied, resolve the field against the rider's hardware. Returns `counted`, `coarse` or `absent`, per `01_SCHEMA.md`.

```
resolve(field, fork, shock, frame) -> { state, adjuster, min, max, positions }
```

- `absent` deltas are dropped from the sum and surfaced in a separate ruled-out list, carrying the reason and the goal that wanted them.
- `coarse` deltas are applied but rendered as a step between named positions, with a note that it is coarse.
- `counted` deltas are rendered as a click count and a direction.

The reason strings are rider facing and must name the actual hardware. "No high speed compression adjuster on the GRIP Sweep-Adjust damper" is useful. "Not available" is not.

## 3. Goals

The primary entry point. Maximum three selected. Deltas sum, then clamp to the field min and max from the component record.

The eight below are carried over from the prototype and are the validated set. The four marked `proposed` need review before implementation, and the whole list needs rider validation before the build stage, since a wrong entry point makes everything downstream wrong.

| id | Name | Sub | Recipe |
|---|---|---|---|
| `more_pop` | More pop off lips | Bike gives back what you put in | `fork_lsr +2, shock_lsr +2, shock_psi +10, fork_spacers +1` |
| `rock_garden_control` | More control in rock gardens | Tracks the ground, stops deflecting | `fork_psi -5, fork_spacers +1, fork_hsc -2, fork_lsr +1, tyre_front -1.5` |
| `flat_corner_grip` | More grip in flat corners | Front tyre bites instead of washing | `tyre_front -2, fork_psi -5, fork_lsr +1` |
| `berm_support` | More support in berms | Something to push against | `fork_psi +5, fork_lsc +2, shock_psi +10, shock_lsc +2` |
| `bottom_out_control` | Stop harsh bottom outs | Ramp deeper without losing small bump | `fork_spacers +1, shock_spacers +1, fork_hsc +2` |
| `pedal_efficiency` | Pedal more efficiently | Less bob on long climbs | `shock_lsc +3, shock_psi +10, tyre_rear +1.5` |
| `less_harsh` | Less arm pump and harshness | Take the sting out of chatter | `tyre_front -2, tyre_rear -1.5, fork_hsc -2, fork_psi -5` |
| `high_speed_stability` | More stability at speed | Calmer when it gets fast and rough | `fork_psi +5, fork_lsr -1, shock_lsr -1, tyre_front +1` |
| `climbing_traction` | More rear grip on steep climbs | proposed | `tyre_rear -2, shock_psi -10, shock_lsr +1` |
| `less_pedal_strike` | Fewer pedal strikes | proposed | `shock_psi +10, flip_chip high` |
| `quicker_steering` | Bike turns in faster | proposed | `fork_psi +5, flip_chip high` |
| `more_comfort_long_days` | Comfort on long days | proposed | `tyre_front -1.5, tyre_rear -1.5, fork_psi -5, fork_lsc -2` |

Each goal also carries a `rationale` map explaining the mechanism per field, in rider language. The prototype's `WHY` strings are the starting text.

### Hardtail branching

Goals with `applies_to` excluding `hardtail` are hidden entirely rather than shown greyed out, because a hardtail rider has not made a mistake by not having a shock. For goals that apply to both, strip every `shock_*` delta and redistribute the intent onto the fields that remain. `more_pop` on a hardtail becomes `fork_lsr +2, fork_spacers +1, tyre_rear +1`, not the full recipe minus the shock rows.

Tyre pressure weighting increases on hardtails, since the rear tyre is the only rear compliance the bike has.

## 4. Conflicts

Authored pairs. Order does not matter.

| goal_a | goal_b | axis | severity | text |
|---|---|---|---|---|
| `pedal_efficiency` | `flat_corner_grip` | rear traction | trades | Firming the shock and running more rear pressure costs rear traction on loose climbs. Split the difference or accept one. |
| `less_harsh` | `berm_support` | compression | cancels | One wants the bike softer and more open, the other wants it firmer. These cancel. Pick the one that is actually costing you time. |
| `more_pop` | `less_harsh` | rebound | trades | Faster rebound gives pop but adds harshness and arm pump on long rough descents. One click at a time here. |
| `high_speed_stability` | `more_pop` | rebound | cancels | Slower rebound calms the bike and takes the pop away. The rebound dial cannot give you both. |
| `pedal_efficiency` | `less_harsh` | compression | trades | Platform for climbing is the same damping that makes the descent harsh. Consider using the lever rather than the tune. |
| `bottom_out_control` | `climbing_traction` | spring rate | mild | Ramp and pressure changes for bottom out control sit against the softer rear you want for climbing grip. |

Alongside authored conflicts, the engine flags the **mechanical case**: any field whose summed deltas net to within 10 percent of zero. That is a real result and the rider should see it rather than watch a change silently vanish.

## 5. Attribute model

Six axes. Scored 0.4 to 10, with 5 being the computed baseline for that rider and bike.

### Normalised inputs

```
p    = mean of (fork_psi - base) / 18  and  (shock_psi - base) / 40
spc  = ((fork_spacers - base) + (shock_spacers - base)) / 3
rb   = ((fork_lsr - base) + (shock_lsr - base)) / 4
cp   = ((fork_lsc - base) + (fork_hsc - base) + (shock_lsc - base)) / 4
ty   = mean of (tyre_front - base) and (tyre_rear - base), divided by 4
```

### Weights

```
grip       = 5 - 1.9p - 2.4ty - 1.1cp + 0.4rb
support    = 5 + 2.0p + 1.5cp + 1.0spc
comfort    = 5 - 1.7p - 1.9ty - 1.5cp - 0.7spc
pop        = 5 + 1.8rb + 0.8spc + 0.7p
bottom_out = 5 + 2.2spc + 1.2p + 0.9cp
pedalling  = 5 + 1.4p + 1.8cp + 0.9ty - 0.5rb
```

**Every one of these coefficients is an expert prior, not a measurement.** They ship with `fit_basis: "expert_prior"` and the UI must disclose it. They were chosen to feel directionally right, and directionally right is genuinely useful for showing a rider that buying support costs comfort, but the specific magnitudes carry no evidentiary weight.

Stage 6 fits them against logged outcomes. Until then, do not add decimal places to the display, do not rank goals by predicted attribute gain, and do not use the model to make a recommendation the rider did not ask for. Showing a trade-off is defensible. Claiming to have quantified it is not.

## 6. Symptoms

The secondary entry point, for riders who already know what is wrong. Roughly 25 to 30 entries. The prototype's seven are the seed.

Front: harsh over chatter, spiking on square edges, dives under braking, packs down through repeated hits, blows through travel, never reaches full travel, vague or wandering, hand pain and arm pump, deflects off roots, no front grip in flat corners.

Rear: bucking on landings, wallowing, harsh mid stroke, bottoms out hard, hangs up on square edges, poor climbing traction, pedal bob, no pop off lips, feels dead.

Whole bike: front and rear out of balance, pedal strikes, feels low, rear heavy under braking, tyre burping or rim strikes, rebound mismatched front to rear.

Each symptom carries ranked causes with `requires`, `magnitude`, `expect` and `falsify`. `expect` and `falsify` are what make it a diagnostic rather than a guess: the rider is told what confirms the hypothesis and what refutes it, and the answer feeds the session log.

## 7. Ordering

Fixed sequence for presenting changes, regardless of which path produced them:

```
1. tyre pressure
2. spring rate (air pressure)
3. ramp (volume spacers)
4. rebound
5. compression
6. geometry (flip chip, travel, cockpit)
```

This is the order in which a change to one invalidates your read on the next. Setting compression before sag is the single most common way riders chase their own tail.

Preconditions sit above all of it as a dismissible banner: service state, tyre condition, cockpit fit. They do not compete for rank.

## 8. Diagnostic tests

Attach these to the relevant causes so the rider can confirm before changing anything.

| Test | Reads |
|---|---|
| Press the bars down hard and release | Front wheel leaves the ground means rebound is too fast |
| Ride the same rough section twice, watch the o-ring | Not reaching full travel on the biggest hit means too much ramp or too much pressure |
| Judge the bike entering a corner or on a jump face | Sluggish and stacking up under you means low speed compression is too open |
| Judge it on square edges | Harsh on quick impacts while barely using travel means high speed compression is too closed |
| Kerb drop, front and rear together | Front and rear returning at visibly different speeds is the classic buck |
| Cycle the fork by hand, cold | Notchiness off the top is mechanical, not tuning |

Sag measurement method, which gates all of the above: full kit, level ground, no brakes held, bounce to free the seals, settle, slide the o-ring without shifting weight, step off without bouncing. Standing or seated both work, but pick one and never mix them, or readings across sessions are not comparable.

## 9. Output contract

`rules.json`:

```json
{
  "version": "0.1",
  "setting_fields": [...],
  "goals": [...],
  "conflicts": [...],
  "attributes": [...],
  "symptoms": [...],
  "causes": [...],
  "ordering": [...],
  "diagnostics": [...],
  "preconditions": [...]
}
```

## 10. Test cases

Claude Code must be able to run these and get the stated result. They exist because each one is a bug the prototype had to be built carefully to avoid.

| Case | Expected |
|---|---|
| FOX 36 Rhythm GRIP, goal `less_harsh` | `fork_hsc` appears in the ruled-out list naming the GRIP damper. Tyre and pressure changes still offered. |
| FOX 36 Factory GRIP X2, goal `less_harsh` | `fork_hsc` offered as a counted click change. |
| RockShox 35 Gold RL Motion Control, goal `berm_support` | `fork_lsc` ruled out, reason names the lockout lever. Compression row hidden from the readout entirely. |
| FLOAT DPS three position, goal `pedal_efficiency` | `shock_lsc` offered as `coarse`, stepping toward firm, with the coarse note. Not ruled out. |
| FLOAT X, same goal | `shock_lsc` offered as counted clicks. |
| Goals `more_pop` and `high_speed_stability` together | Conflict shown, severity `cancels`, and the net rebound change flagged as near zero. |
| Hardtail frame, any goal | No shock fields anywhere. Rear suspension symptoms hidden. Tyre weighting raised. |
| Rider weight changed | Baseline recomputes, staged goals clear rather than carrying stale deltas forward. |
| Any goal pushing a field past its component maximum | Clamped to the component record's maximum, not to a hardcoded number, and the clamp is disclosed. |
| Rebound direction | An increase in `fork_lsr` renders as opening or speeding up, never as slowing down. |

## Open items

- The four `proposed` goals need review before implementation.
- The goal list has not been validated against real riders. This is the highest risk item in the project and the cheapest to fix now.
- Long form rider written setup guides are an unexploited source for the symptom set. The Reddit r/MTB suspension setup thread was blocked to automated fetching and would need to be supplied manually.

## Validation basis, revised

TrailHead sampling is dropped. Stage 6 now rests on two things, both better than sampled lookups because both are reproducible.

**Baseline model** validates against manufacturer `pressure_chart` and `setting_chart` records. If our computed starting pressure for a given rider weight and component disagrees with the manufacturer's own published chart, our model is wrong and the chart wins. Where a chart exists, the model should not be running at all: read the chart, interpolate within its `point_type`, and only fall back to the model when no chart covers that component.

This retires a guess. The prototype derives a rebound starting point by multiplying total clicks by 0.7 and a fork pressure by multiplying weight by a per-chassis constant. Both are placeholders for data manufacturers publish. The `setting_chart` table added in schema 0.3 carries the real numbers.

**Attribute weights** fit against Tumi's own logged sessions. The Bike Mechanic sheet already holds several setting versions with spring rate, spacer count, rebound, compression and tyre pressures, each paired with a written account of what the bike did afterwards. That is a small labelled dataset of exactly the right shape: known field deltas, known outcome. It is not large enough to fit six attributes with confidence, which is the honest reason `fit_basis` stays at `expert_prior` until the session log has accumulated more laps.

Do not present the radar as fitted until it is. A directional trade-off display is defensible on expert priors. A quantified one is not.
