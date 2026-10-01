# Coverage diff: 02C RockShox front spec

Before: branch head before 02C (`977152f`). After: 02C transcribed, schema v0.3.2, pending damper rule. Both include the gap-filling overlay.

## Tables

| Table | Valid before | Valid after | Change | Excluded after |
| --- | --- | --- | --- | --- |
| chassis | 14 | 17 | +3 | 0 |
| dampers | 14 | 14 |  | 0 |
| air_springs | 6 | 87 | +81 | 0 |
| pressure_charts | 5 | 73 | +68 | 0 |
| setting_charts | 2 | 2 |  | 0 |
| fork_units | 4 | 157 | +153 | 0 |
| shock_units | 4 | 4 |  | 0 |

## What a rider can use

|  | Before | After |
| --- | --- | --- |
| Forks selectable on the Bench | 4 | 4 |
| Shocks selectable on the Bench | 4 | 4 |
| Forks on file under the pending damper rule | 0 | 153 |

The pending forks are kept in the index with published pressure bands, token limits, model codes and oil data. They are held off the Bench list until the engine resolves `pending` adjusters (the next step, after this review). Search and model-code match already find them and say why they cannot be selected yet.

Pending forks by family: Pike 15, Lyrik 15, ZEB 25, BoXXer 6, Domain 8, Revelation 5, Yari 4, Yari 29+ 7, SID 8, SID SL 4, 35 Gold 6, 35 Silver 18, Reba 3, Recon Gold 6, Recon Silver 8, Recon Silver 26in 1, Judy Gold 3, Judy Silver 8, Judy 3.

Waiting on these dampers from 02b: TurnKey (27), Motion Control RL (23), Motion Control RC (20), Charger RC (14), Charger Flight Attendant (11), Charger 3 RC2 with ButterCup (11), Charger 3 RC2 (11), Rebound (10), Rush RC (6), Rush RC or Charger R (source conflict) (5), Charger 2.1 RC2 (3), Charger Race Day (3), Charger 2 RL (3), Charger RL (3), Rush RL (3).

## Brands

| Brand | Chassis | Air springs | Pressure charts | Fork units | Dampers |
| --- | --- | --- | --- | --- | --- |
| RockShox | 10 → 13 | 3 → 84 | 3 → 71 | 0 → 153 | 0 → 0 |
| FOX | 4 → 4 | 3 → 3 | 2 → 2 | 4 → 4 | 14 → 14 |

## Flags

| Flag | Before | After |
| --- | --- | --- |
| lever_not_modelled | 1 | 1 |
| shock_without_rebound | 1 | 1 |
| basis_unknown | 3 | 71 |
| converted_from_lb | 2 | 2 |
| single_value_sag | 2 | 2 |
| estimated_downgrade | 1 | 1 |
| estimated | 6 | 17 |
| unused | 22 | 9 |
| field_not_in_schema | 0 | 179 |

Notes: `basis_unknown` rises with every new RockShox chart (02C: headers say rider weight only, so `basis` stays null with a `fields_pending` entry). `field_not_in_schema` counts `model_code` on 153 units plus chassis `notes` and `axle_to_crown`, which v0.3.2 does not define. `unused` falls because the RockShox chassis and air springs are now referenced.

## Readiness gates

| Feature | Before | After |
| --- | --- | --- |
| Component search, FOX Factory and Performance | 7 units | 7 units |
| Component search, FOX Rhythm | 1 units | 1 units |
| Component search, RockShox | 0 units | 0 units selectable, 153 on file waiting on damper data |
| Component search, X-Fusion, SR Suntour, Marzocchi, RockShox Recon and 35 Silver | 0 units | 0 units |
| Identifier match | 0 units carry a part_number or model_code | 0 units carry a part_number or model_code |
| Bike search | no frames table yet | no frames table yet |
| Tyre starting pressures | no tyre data or tyre_pressure_model records | no tyre data or tyre_pressure_model records |

## Deferred (02C section 9)

- RockShox Paragon Gold: Gravel, 700c
- RockShox Rudy XPLR: Gravel, 700c
- RockShox Pike DJ: Dirt jump
- RockShox Reba 26 (FS-Reba-26-A2): Weight bands run from under 27 kg to 54 kg: junior sizing
- RockShox Dual Position Air on Yari and ZEB: Charts marked "featured on E-MTB models only"; e-MTB is deferred
- E-Bikes add 10 psi: Captured as ebike_offset_psi on each chart, not applied in v1

Exclusions after: 0.
