# 02C_ROCKSHOX_FRONT_SPEC_2023.md

Version 0.1
Executor: Claude Code
Source: RockShox *2023 Front Suspension Specifications: Oil Volume, Air Pressure, Coil Spring Rates, and Technical Specifications*, GEN.00000000007168 Rev D, SRAM LLC 2023, from `https://www.sram.com/en/service`
Transcribed: 2026-09-25
Depends on: `01_SCHEMA.md` v0.3.2, `07_BUILD_SPEC.md` v0.2
Target: `src/mtb/data/raw/`

> Repository copy. Transcribed into `src/mtb/data/raw` by `docs/mtb/transcriptions/02c_transcribe.mjs`; golden values asserted in `src/mtb/tests/golden02c.test.ts`.

## What this gives, and what it does not

| Gives | Does not give |
|---|---|
| Model code per fork family and tier | Any rear shock data |
| Which damper and spring each tier ships with | Adjuster types, click counts or directions |
| Air pressure bands by rider weight, max psi | Sag targets |
| Bottomless tokens installed and max, per travel | Token part numbers or volumes |
| Axle to crown, offsets, steerer, axle, rotor and tyre limits | Part numbers |
| Coil spring colour by rider weight | Coil spring rates in lb/in |
| Oil types and volumes | Service intervals |

Because adjuster data is absent, **do not create damper records from this document.** The fork units below reference reserved damper ids that `02B_HARVEST_ROCKSHOX.md` will fill. See the pending damper rule under engine changes. Do not infer adjusters from damper names: "RC" suggests rebound and compression, but the name is not the data.

Rear shocks need the companion SRAM rear suspension specifications document from the same service library.

---

## 1. Corrections to existing records. Do these first.

These records are already in `src/mtb/data/raw/` and disagree with the source they cite. Most look like merged table cells read against the wrong row. Page numbers are the PDF's own.

| Record | Field | Current | Correct | Page |
|---|---|---|---|---|
| `rockshox_debonair_plus_pike_140` | `spacer_factory` | 1 | **0** | 19 |
| `rockshox_debonair_plus_pike_140` | `spacer_max` | 6 | **5** | 19 |
| `rockshox_debonair_plus_lyrik_150` | `spacer_factory` | 1 | **0** | 18 |
| `rockshox_debonair_plus_zeb_160` | `spacer_max` | 4 | **5** | 25 |
| `rockshox_sid_2023` | `max_rotor_mm` | 200 | **220** | 23 |
| `rockshox_pike_2023` | `offset_options_mm` | 37, 44, 51 | **37, 44** | 19 |
| `rockshox_lyrik_2023` | `offset_options_mm` | 37, 44, 51 | **37, 44** | 18 |
| `rockshox_yari_2023` | `offset_options_mm` | 37, 44, 46, 51 | **37, 42, 44, 46, 51** | 23, 24 |
| `rockshox_yari_2023` | `travel_options_mm` | 100, 150-180 | **100, 110, 120, 130, 140, 150, 160, 170, 180** | 24 |
| `rockshox_reba_2022` | `travel_options_mm` | 80, 100, 110, 120 | **100, 110, 120** (80 is Reba 26 only, out of scope) | 19 |

The three spacer errors matter most. `spacer_max` is a clamp bound in the engine, so a wrong maximum lets the tool recommend a token the fork cannot take, or stops it recommending one it can.

Edit in place, add this document to each record's `source` array, and list every correction in `00_STATE.md`.

The three existing RockShox pressure charts were checked and are **correct** at their boundary points. They get re-expressed as bands per section 5.

---

## 2. Model codes

The findability unlock. The model code is printed on the fork, and it resolves tier, damper and spring exactly. **One model code covers every travel and wheel size of that tier**, so an identifier match returns a family and tier, then the rider picks travel and wheel.

| Model code | Family | Tier | Damper | Spring |
|---|---|---|---|---|
| FS-35G-RL-A2 | 35 Gold | RL | Motion Control RL | DebonAir |
| FS-35S-TK-A1 | 35 Silver | TK | Turnkey | Solo Air or Coil |
| FS-35S-R-A1 | 35 Silver | R | Rebound | Coil |
| FS-BXR-ULT-C2 | BoXXer | Ultimate | Charger 2.1 RC2 | DebonAir |
| FS-BXR-SEL-C2 | BoXXer | Select | Charger RC | DebonAir |
| FS-DOMN-RC-B1 | Domain | RC | Motion Control RC | DebonAir |
| FS-DOMN-R-B1 | Domain | R | Rebound | DebonAir |
| FS-JDYG-RL-A3 | Judy Gold | RL | Motion Control RL | Solo Air |
| FS-JDYS-TK-A3 | Judy Silver | TK | Turnkey | Solo Air or Coil |
| FS-JDY-TK-B1 | Judy | TK | Turnkey | Coil |
| FS-LYRK-UFA-D1 | Lyrik | Ultimate Flight Attendant | Charger Flight Attendant w/ ButterCup | DebonAir+ w/ ButterCup |
| FS-LYRK-ULT-D1 | Lyrik | Ultimate | Charger 3 RC2 w/ ButterCup | DebonAir+ w/ ButterCup |
| FS-LYRK-SELP-D1 | Lyrik | Select+ | Charger 3 RC2 | DebonAir+ |
| FS-LYRK-SEL-D1 | Lyrik | Select | Charger RC | DebonAir+ |
| FS-LYRK-BSE-D1 | Lyrik | Base | Rush RC | DebonAir+ |
| FS-PIKE-UFA-C1 | Pike | Ultimate Flight Attendant | Charger Flight Attendant w/ ButterCup | DebonAir+ w/ ButterCup |
| FS-PIKE-ULT-C1 | Pike | Ultimate | Charger 3 RC2 w/ ButterCup | DebonAir+ w/ ButterCup |
| FS-PIKE-SELP-C1 | Pike | Select+ | Charger 3 RC2 | DebonAir+ |
| FS-PIKE-SEL-C1 | Pike | Select | Charger RC | DebonAir+ |
| FS-PIKE-BSE-C1 | Pike | Base | Rush RC | DebonAir+ |
| FS-Reba-RL-A9 | Reba | RL | Motion Control RL | Solo Air |
| FS-RCNG-RL-C1 | Recon Gold | RL | Motion Control RL | DebonAir |
| FS-RCNS-RL-D1 | Recon Silver | RL | Motion Control RL | Solo Air |
| FS-RCNS-TK-D1 | Recon Silver | TK | Turnkey | Coil |
| FS-RCNS-TK-C1 | Recon Silver | TK, 26in | Turnkey | Solo Air |
| FS-RVL-RC-A3 | Revelation | RC | Motion Control RC | DebonAir |
| FS-SID-ULT-C1 | SID | Ultimate | Charger Race Day | DebonAir |
| FS-SID-SELP-C1 | SID | Select+ | Charger 2 RL | DebonAir |
| FS-SID-SEL-C1 | SID | Select | Charger RL | DebonAir |
| FS-SID-BSE-C1 | SID | Base | Rush RL | DebonAir |
| FS-SIDS-ULT-C1 | SID SL | Ultimate | Charger Race Day | DebonAir |
| FS-SIDS-SELP-C1 | SID SL | Select+ | Charger 2 RL | DebonAir |
| FS-SIDS-SEL-C1 | SID SL | Select | Charger RL | DebonAir |
| FS-SIDS-BSE-C1 | SID SL | Base | Rush RL | DebonAir |
| FS-YARI-RC-B3 | Yari | RC | Motion Control RC | DebonAir |
| FS-ZEB-UFA-A2 | ZEB | Ultimate Flight Attendant | Charger Flight Attendant w/ ButterCup | DebonAir+ w/ ButterCup |
| FS-ZEB-ULT-A2 | ZEB | Ultimate | Charger 3 RC2 w/ ButterCup | DebonAir+ w/ ButterCup |
| FS-ZEB-SELP-A2 | ZEB | Select+ | Charger 3 RC2 | DebonAir+ |
| FS-ZEB-SEL-A2 | ZEB | Select | Charger RC | DebonAir+ |
| FS-ZEB-BSE-A2 | ZEB | Base | **conflict**, see section 8 | DebonAir+ |

Tier slugs: `ultimate_flight_attendant`, `ultimate`, `select_plus`, `select`, `base`. Families with a single tier use the suffix as printed, lowercased: `rl`, `tk`, `r`, `rc`.

Forks with a trailing R in the tier on some pages (RL R, TK R, RC R) are remote lockout versions of the same fork. Same model code, same data. Capture `remote: true` as a note only.

### Reserved damper ids

Use exactly these in `fork_unit.damper_id`. `02B_HARVEST_ROCKSHOX.md` has been updated to produce them.

| Damper as printed | Reserved id |
|---|---|
| Motion Control RL | `rockshox_motion_control_rl_2023` |
| Motion Control RC | `rockshox_motion_control_rc_2023` |
| Turnkey | `rockshox_turnkey_2023` |
| Rebound | `rockshox_rebound_2023` |
| Charger RC | `rockshox_charger_rc_2023` |
| Charger 2.1 RC2 | `rockshox_charger_2_1_rc2_2023` |
| Charger 3 RC2 | `rockshox_charger_3_rc2_2023` |
| Charger 3 RC2 w/ ButterCup | `rockshox_charger_3_rc2_buttercup_2023` |
| Charger Flight Attendant w/ ButterCup | `rockshox_charger_flight_attendant_2023` |
| Rush RC | `rockshox_rush_rc_2023` |
| Charger R | `rockshox_charger_r_2023` |
| Charger Race Day | `rockshox_charger_race_day_2023` |
| Charger 2 RL | `rockshox_charger_2_rl_2023` |
| Charger RL | `rockshox_charger_rl_2023` |
| Rush RL | `rockshox_rush_rl_2023` |

Flight Attendant is electronically controlled. Its adjusters behave differently from a dial and may not fit the schema's adjuster object. Leave it pending until 02b reports on it.

---

## 3. Chassis dimensions

Axle and offsets vary by wheel size, so rows split where they differ. B means Boost. Axle to crown and tyre diameter show two values where the fork is fender compatible: standard, then fender.

| Family | Stanchion | Wheel | Travel | Axle | Steerer | Offsets | Rotor min / max | Tyre dia max | Tyre width max |
|---|---|---|---|---|---|---|---|---|---|
| 35 Gold | 35 | 27.5B | 100-160 | 15x110 | 1.5 tapered, 1.8 tapered at 44 | 37, 44 | 180 / 220 | 732, 730 | 81 |
| 35 Gold | 35 | 29B | 100-160 | 15x110 | as above | 44, 51 | 180 / 220 | 770, 768 | 81 |
| 35 Silver | 35 | 27.5B | 100-160 | 15x110 | as above | 37, 44 | 180 / 220 | 732, 730 | 81 |
| 35 Silver | 35 | 29B | 100-160 | 15x110 | as above | 44, 51 | 180 / 220 | 770, 768 | 81 |
| BoXXer | 35 | 27.5B | 200 | 20x110 | 1 1/8 straight | 36, 46 | 200 / 220 | 732 | 81 |
| BoXXer | 35 | 27.5B, 29B | 180 | 20x110 | 1 1/8 straight | 46, 56 | 200 / 220 | 770 | 81 |
| BoXXer | 35 | 29B | 190-200 | 20x110 | 1 1/8 straight | 46, 56 | 200 / 220 | 770 | 81 |
| Domain | 38 | 27.5B | 150-180 | 15x110 | 1.5 tapered, 1.8 at 44 | 38, 44 | 200 / 220 | 732 | 81 |
| Domain | 38 | 29B | 150-180 | 15x110 | as above | 44, 51 | 200 / 220 | 770 | 81 |
| Judy Gold | 30 | 26 | 80-100 | 9mm QR | 1 1/8 | 40 | 160 / 185 | 680 | 58 |
| Judy Gold | 30 | 27.5 | 80-120 | 9mm QR | 1 1/8, 1.5 tapered | 42 | 160 / 185 | 710 | 62 |
| Judy Gold | 30 | 29 | 80-120 | 9mm QR | 1 1/8, 1.5 tapered | 46, 51 | 160 / 185 | 755 | 62 |
| Judy Gold | 30 | 27.5B | 80-120 | 15x110 | 1.5 tapered | 42, 51 | 160 / 220 | 732 | 81 |
| Judy Gold | 30 | 29B | 80-120 | 15x110 | 1.5 tapered | 51 | 160 / 220 | 770 | 81 |
| Judy Silver | 30 | 26 | 80-100 | 9mm QR | 1 1/8, 1.5 tapered | 40 | 160 / 185 | 680 | 58 |
| Judy Silver | 30 | 27.5 | 80-120 | 9mm QR | 1 1/8 alu, 1 1/8 steel, 1.5 tapered | 42 | 160 / 185 | 710 | 62 |
| Judy Silver | 30 | 29 | 80-100 | 9mm QR | as above | 46, 51 | 160 / 185 | 755 | 62 |
| Judy Silver | 30 | 27.5B | 80-130 | 15x110 | 1.5 tapered | 42, 51 | 160 / 220 | 732, 726 | 81 |
| Judy Silver | 30 | 29B | 80-130 | 15x110 | 1.5 tapered | 42, 51 | 160 / 220 | 770, 766 | 81 |
| Judy | 30 | 27.5 | 80-120 | 9mm QR | 1 1/8 alu, 1 1/8 steel, 1.5 tapered | 42 | 160 / 185 | 710 | 62 |
| Judy | 30 | 29 | 80-100 | 9mm QR | 1 1/8 steel, 1.5 tapered | 46, 51 | 160 / 185 | 755 | 62 |
| Lyrik | 35 | 27.5B | 140-160 | 15x110 | 1.5 tapered (UFA); 1.5 or 1.8 tapered (others) | 37, 44 | 180 / 220 | 732 | 81 |
| Lyrik | 35 | 29B | 140-160 | 15x110 | as above | 44 | 180 / 220 | 770 | 81 |
| Pike | 35 | 27.5B | 120-140 | 15x110 | 1.5 tapered | 37, 44 | 180 / 220 | 732 | 81 |
| Pike | 35 | 29B | 120-140 | 15x110 | 1.5 tapered | 44 | 180 / 220 | 770 | 81 |
| Reba RL | 32 | 27.5B | 100-120 | 15x110 | 1.5 tapered | 42 | 160 / 220 | 712-714 | 81 |
| Reba RL | 32 | 29B | 100-120 | 15x110 | 1.5 tapered | 51 | 160 / 220 | 755-760 | 81 |
| Recon Gold | 32 | 27.5B | 80-150 | 15x110 | 1.5 tapered | 37, 46 | 160 / 220 | 732 | 81 |
| Recon Gold | 32 | 29B | 80-150 | 15x110 | 1.5 tapered | 42, 51 | 160 / 220 | 770 | 81 |
| Recon Silver RL | 32 | 27.5 | 100-120 | 9mm QR | 1 1/8, 1.5 tapered | 42 | 160 / 220 | 710 | 62 |
| Recon Silver RL | 32 | 27.5 | 100-140 | 15x100 | 1.5 tapered | 42 | 160 / 220 | 710 | 62 |
| Recon Silver RL | 32 | 27.5B | 100-150 | 15x110 | 1.5 tapered | 37, 46 | 160 / 220 | 732 | 81 |
| Recon Silver RL | 32 | 29 | 100 | 9mm QR or 15x100 | 1 1/8, 1.5 tapered | 46, 51 | 160 / 220 | 755 | 62 |
| Recon Silver RL | 32 | 29 | 120-140 | 15x100 | 1.5 tapered | 46, 51 | 160 / 220 | 755 | 62 |
| Recon Silver RL | 32 | 29B | 100-150 | 15x110 | 1.5 tapered | 42, 51 | 160 / 220 | 770 | 81 |
| Recon Silver TK | 32 | 26 | 100 | 9mm QR | 1 1/8 | 40 | 160 / 200 | 710 | 62 |
| Recon Silver TK | 32 | 27.5 | 80-100 | 9mm QR | 1 1/8 steel | 42 | 160 / 220 | 710 | 62 |
| Recon Silver TK | 32 | 27.5 | 80-100 | 9mm QR or 15x100 | 1.5 tapered | 42 | 160 / 220 | 710 | 62 |
| Recon Silver TK | 32 | 27.5B | 80-120 | 15x110 | 1.5 tapered | 37, 46 | 160 / 220 | 732 | 81 |
| Recon Silver TK | 32 | 29 | 80-100 | 9mm QR or 15x100 | 1 1/8 steel, 1.5 tapered | 46, 51 | 160 / 220 | 755 | 62 |
| Recon Silver TK | 32 | 29B | 80-120 | 15x110 | 1.5 tapered | 42, 51 | 160 / 220 | 770 | 81 |
| Revelation | 35 | 27.5B | 120-160 | 15x110 | 1.5 tapered | 37, 46 | 180 / 220 | 732 | 81 |
| Revelation | 35 | 29B | 120-150 | 15x110 | 1.5 tapered | 42, 51 | 180 / 220 | 770 | 81 |
| SID SL | 32 | 29B | 100 | 15x110 | 1.5 tapered | 44 | 160 / 200 | 751 | 60 |
| SID | 35 | 29B | 110-120 | 15x110 | 1.5 tapered | 44 | 180 / 220 | 758 | 66 |
| Yari | 35 | 27.5B | 150-180 | 15x110 | 1.5 tapered, 1.8 at 44 | 37, 44, 46 | 180 / 220 | 732 | 81 |
| Yari | 35 | 29B | 150-180 | 15x110 | as above | 42, 44, 51 | 180 / 220 | 770 | 81 |
| Yari | 35 | 29+ | 100-160 | 15x110 | 1.5 tapered | 51 | 160 / 220 | 786 | 82 |
| ZEB | 38 | 27.5B | 150-190 | 15x110 | 1.5 tapered (UFA); 1.5 or 1.8 (others) | 38, 44 | 200 / 220 | 732 | 81 |
| ZEB | 38 | 29B | 150-190 | 15x110 | as above | 44, 51 | 200 / 220 | 770 | 81 |

New chassis records needed: `rockshox_boxxer_2023`, `rockshox_judy_2023` (covers Judy, Judy Silver, Judy Gold, all 30mm), `rockshox_recon_2023` (Recon Gold and Silver, 32mm). The 35 Gold and 35 Silver share `rockshox_35_2020`: add this document as a second source and extend `year_range` to `[2020, 2023]`, since the dimensions match.

Add the missing chassis fields where these tables supply them, including `tyre_diameter_max_mm` and `tyre_width_max_mm` as notes if the schema has no field. They are useful for a rider fitting a bigger tyre.

---

## 4. Tokens and axle to crown by travel

Tokens are bottomless tokens, RockShox's volume spacers. Installed is the factory count, which maps to `spacer_factory`. Max maps to `spacer_max`. A dash means the fork takes none.

### Pike, all tiers

| Travel | 27.5B A2C | 29B A2C | Installed | Max |
|---|---|---|---|---|
| 120 | 512 | 531 | 1 | 6 |
| 130 | 522 | 541 | 0 | 6 |
| 140 | 532 | 551 | 0 | 5 |

### Lyrik, all tiers

| Travel | 27.5B A2C | 29B A2C | Installed | Max |
|---|---|---|---|---|
| 140 | 532 | 551 | 1 | 5 |
| 150 | 542 | 561 | 0 | 5 |
| 160 | 552 | 571 | 0 | 5 |

### ZEB, all tiers, DebonAir+

| Travel | 27.5B A2C | 29B A2C | Installed | Max |
|---|---|---|---|---|
| 150 | 547 | 566 | 2 | 5 |
| 160 | 557 | 576 | 1 | 5 |
| 170 | 567 | 586 | 1 | 4 |
| 180 | 577 | 596 | 0 | 4 |
| 190 | 587 | 606 | 0 | 4 |

### Revelation

| Travel | 27.5B A2C | 29B A2C | Installed | Max |
|---|---|---|---|---|
| 120 | 512 | 531 | 4 | 6 |
| 130 | 522 | 541 | 3 | 6 |
| 140 | 532 | 551 | 2 | 5 |
| 150 | 542 | 561 | 1 | 4 |
| 160 | 552 | n/a | 0 | 4 |

### Yari

| Wheel | Travel | A2C | Installed | Max |
|---|---|---|---|---|
| 27.5B | 150 / 160 / 170 / 180 | 542 / 552 / 562 / 572 | 2 / 2 / 1 / 0 | 5 / 5 / 4 / 4 |
| 29B | 150 / 160 / 170 / 180 | 561 / 571 / 581 / 591 | 2 / 2 / 1 / 0 | 5 / 5 / 4 / 4 |
| 29+ | 100 / 110 / 120 / 130 / 140 / 150 / 160 | 523 / 533 / 543 / 553 / 563 / 573 / 583 | 5 / 5 / 4 / 3 / 3 / 2 / 2 | 7 / 7 / 7 / 6 / 6 / 5 / 5 |

### Domain

| Travel | 27.5B A2C | 29B A2C | Installed | Max |
|---|---|---|---|---|
| 150 | 547 | 566 | 2 | 3 |
| 160 | 557 | 576 | 2 | 3 |
| 170 | 567 | 586 | 1 | 3 |
| 180 | 577 | 596 | 0 | 3 |

### BoXXer

| Wheel | Travel | A2C | Installed | Max |
|---|---|---|---|---|
| 27.5B | 200 | 581 | 0 | 6 |
| 27.5B or 29B | 180 | 582 | 2 | 6 |
| 29B | 190 | 592 | 1 | 6 |
| 29B | 200 | 602 | 0 | 6 |

### SID and SID SL

| Fork | Travel | A2C | Installed | Max |
|---|---|---|---|---|
| SID SL | 100 | 506 | 0 | 3 |
| SID | 110 | 521 | 1 | 3 |
| SID | 120 | 531 | 0 | 3 |

### 35 Gold

| Travel | 27.5B A2C | 29B A2C | Installed | Max |
|---|---|---|---|---|
| 100 | 492, 498 | 511, 517 | 1 | 2 |
| 120 | 512, 518 | 531, 537 | 1 | 2 |
| 130 | 522, 528 | 541, 547 | 0 | 2 |
| 140 | 532, 538 | 551, 557 | 0 | 2 |
| 150 | 542, 548 | 561, 567 | 0 | 2 |
| 160 | 552, 558 | 571, 577 | 0 | 2 |

35 Silver uses the same axle to crown figures. Tokens: see section 8.

### Reba RL

| Travel | 27.5B A2C | 29B A2C | Installed | Max |
|---|---|---|---|---|
| 100 | 487 | 506 | 0 | 3 |
| 110 | 497 | 521 | 1 | 4 |
| 120 | 507 | 531 | 0 | 4 |

### Recon Gold RL

Tokens 0 installed, 2 max, all travels.

| Travel | 27.5B A2C | 29B A2C |
|---|---|---|
| 80 | 474, 480 | 493, 499 |
| 100 | 494, 500 | 513, 519 |
| 120 | 514, 520 | 533, 539 |
| 130 | 524, 530 | 543, 549 |
| 140 | 534, 540 | 553, 559 |
| 150 | 544, 550 | 563, 569 |

### Judy, Judy Silver, Judy Gold, Recon Silver

No tokens. Axle to crown by wheel and travel:

| Fork | Wheel | Travel: A2C |
|---|---|---|
| Judy Gold | 26 | 80: 453, 100: 473 |
| Judy Gold | 27.5 | 80: 468, 100: 488, 120: 508 |
| Judy Gold | 29 | 80: 487, 100: 507, 120: 527 |
| Judy Gold | 27.5B | 80: 472, 100: 492, 120: 512 |
| Judy Gold | 29B | 80: 490, 100: 510, 120: 530 |
| Judy Silver | 26 | 80: 455, 100: 475 |
| Judy Silver | 27.5 | 80: 470, 100: 490, 120: 510 |
| Judy Silver | 29 | 80: 489, 100: 509 |
| Judy Silver | 27.5B | 80: 470/476, 100: 490/496, 120: 510/516, 130: 520/526 |
| Judy Silver | 29B | 80: 490/496, 100: 510/516, 120: 530/536, 130: 540/546 |
| Judy | 27.5 | 80: 470, 100: 490, 120: 510 |
| Judy | 29 | 80: 489, 100: 509 |
| Recon Silver RL | 27.5 | 100: 486, 120: 506, 130: 520, 140: 530 |
| Recon Silver RL | 27.5B | 100: 494/500, 120: 514/520, 130: 524/530, 140: 534/540, 150: 544/550 |
| Recon Silver RL | 29 | 100: 505, 120: 529, 130: 539, 140: 549 |
| Recon Silver RL | 29B | 100: 513/519, 120: 533/539, 130: 543/549, 140: 553/559, 150: 563/569 |
| Recon Silver TK | 26 | 100: 490 |
| Recon Silver TK | 27.5 | 80: 466, 100: 486 |
| Recon Silver TK | 27.5B | 80: 474/480, 100: 494/500, 120: 514/520 |
| Recon Silver TK | 29 | 80: 485, 100: 505 |
| Recon Silver TK | 29B | 80: 493/499, 100: 513/519, 120: 533/539 |

---

## 5. Air pressure bands

All values psi. Every standard chart carries the note **"E-Bikes add 10 psi."** RockShox publishes ranges per weight band, not single values, and the charts use three different band layouts. Transcribe the full band, both ends, per schema 0.3.2 `bands`.

`basis` is not stated. The headers give rider weight only, with no mention of kit. Leave `basis: null` and keep the existing disclosure.

### Seven-band layout

Bands in kg: under 55, 55-63, 63-72, 72-81, 81-90, 90-99, over 99.

| Fork | Spring | Wheel | Travel | <55 | 55-63 | 63-72 | 72-81 | 81-90 | 90-99 | >99 | Max |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 35 Gold | DebonAir | 27.5B, 29B | 100-120 | <75 | 75-85 | 85-95 | 95-105 | 105-115 | 115-125 | 125+ | 194 |
| 35 Gold | DebonAir | 27.5B, 29B | 130-160 | <55 | 55-65 | 65-75 | 75-85 | 85-95 | 95-105 | 105+ | 163 |
| BoXXer | DebonAir | 27.5B, 29B | 180 | <105 | 105-115 | 115-125 | 125-135 | 135-145 | 145-155 | 155+ | 200 |
| BoXXer | DebonAir | 27.5B, 29B | 190-200 | <95 | 95-105 | 105-115 | 115-125 | 125-135 | 135-145 | 145+ | 200 |
| Domain | DebonAir | 27.5B, 29B | 150-160 | <45 | 45-54 | 54-62 | 62-70 | 70-78 | 78-87 | 87+ | 148 |
| Domain | DebonAir | 27.5B, 29B | 170-180 | <37 | 37-45 | 45-54 | 54-62 | 62-70 | 70-78 | 78+ | 148 |
| Lyrik | DebonAir+ | 27.5B, 29B | 140 | <60 | 60-70 | 70-80 | 80-90 | 90-100 | 100-110 | 110+ | 163 |
| Lyrik | DebonAir+ | 27.5B, 29B | 150-160 | <50 | 50-60 | 60-70 | 70-80 | 80-90 | 90-100 | 100+ | 163 |
| Pike | DebonAir+ | 27.5B, 29B | 120 | <55 | 55-65 | 65-75 | 75-85 | 85-95 | 95-105 | 105+ | 194 |
| Pike | DebonAir+ | 27.5B, 29B | 130-140 | <45 | 45-55 | 55-65 | 65-75 | 75-85 | 85-95 | 95+ | 163 |
| Revelation | DebonAir | 27.5B, 29B | 120 | <75 | 75-85 | 85-95 | 95-105 | 105-115 | 115-125 | 125+ | 194 |
| Revelation | DebonAir | 27.5B, 29B | 130-140 | <65 | 65-75 | 75-85 | 85-95 | 95-105 | 105-115 | 115+ | 163 |
| Revelation | DebonAir | 27.5B, 29B at 150; 27.5B at 160 | 150-160 | <55 | 55-65 | 65-75 | 75-85 | 85-95 | 95-105 | 105+ | 163 |
| Yari | DebonAir | 27.5B, 29B | 150-160 | <55 | 55-65 | 65-75 | 75-85 | 85-95 | 95-105 | 105+ | 163 |
| Yari | DebonAir | 27.5B, 29B | 170-180 | <45 | 45-55 | 55-65 | 65-75 | 75-85 | 85-95 | 95+ | 148 |
| Yari | DebonAir | 29+ | 100 | <85 | 85-95 | 95-105 | 105-115 | 115-125 | 125-135 | 135+ | 194 |
| Yari | DebonAir | 29+ | 110-120 | <75 | 75-85 | 85-95 | 95-105 | 105-115 | 115-125 | 125+ | 194 |
| Yari | DebonAir | 29+ | 130-140 | <65 | 65-75 | 75-85 | 85-95 | 95-105 | 105-115 | 115+ | 163 |
| Yari | DebonAir | 29+ | 150-160 | <55 | 55-65 | 65-75 | 75-85 | 85-95 | 95-105 | 105+ | 163 |
| ZEB | DebonAir+ | 27.5B, 29B | 150-160 | <45 | 45-54 | 54-62 | 62-70 | 70-78 | 78-87 | 87+ | 148 |
| ZEB | DebonAir+ | 27.5B, 29B | 170-180 | <37 | 37-45 | 45-54 | 54-62 | 62-70 | 70-78 | 78+ | 148 |
| ZEB | DebonAir+ | 27.5B, 29B | 190 | <29 | 29-37 | 37-46 | 46-54 | 54-62 | 62-70 | 70+ | 148 |

### Six-band layout

Bands in kg: under 55, 55-63, 63-72, 72-81, 81-90, over 90.

| Fork | Spring | Wheel | Travel | <55 | 55-63 | 63-72 | 72-81 | 81-90 | >90 | Max |
|---|---|---|---|---|---|---|---|---|---|---|
| 35 Silver | Solo Air | 27.5B, 29B | 130-160 | <70 | 70-90 | 90-105 | 105-120 | 120-135 | 135+ | 195 |
| Reba RL | Solo Air | 27.5B, 29B | 100-120 | <70 | 70-90 | 90-105 | 105-120 | 120-135 | 135+ | 195 |
| SID SL | DebonAir | 29B | 100 | <70 | 70-90 | 90-105 | 105-120 | 120-135 | 135+ | 195 |
| SID | DebonAir | 29B | 110-120 | <45 | 45-59 | 59-73 | 73-87 | 87-101 | 101+ | 146 |

### Five-band layout

Bands in kg: under 63, 63-72, 72-81, 81-90, over 90. Note the lightest band carries a closed range here, not an open one.

| Fork | Spring | Wheel and travel | <63 | 63-72 | 72-81 | 81-90 | >90 | Max |
|---|---|---|---|---|---|---|---|---|
| 35 Silver | Solo Air | 27.5B, 29B at 100-120 | 90-110 | 110-125 | 125-140 | 140-160 | 160+ | 265 |
| Judy Gold | Solo Air | any wheel at 80 | 90-110 | 110-125 | 125-140 | 140-160 | 160+ | 265 |
| Judy Gold | Solo Air | 26, 27.5, 29 at 100; 27.5, 29 at 120; 27.5B, 29B at 100-120 | 50-70 | 70-85 | 85-100 | 100-120 | 120+ | 205 |
| Judy Silver | Solo Air | any wheel at 80 | 90-110 | 110-125 | 125-140 | 140-160 | 160+ | 265 |
| Judy Silver | Solo Air | 26, 27.5, 29 at 100; 27.5 at 120; 27.5B, 29B at 100-130 | 50-70 | 70-85 | 85-100 | 100-120 | 120+ | 205 |
| Recon Gold | DebonAir | 27.5B, 29B at 80 | 90-110 | 110-125 | 125-140 | 140-160 | 160+ | 265 |
| Recon Gold | DebonAir | 27.5B, 29B at 100-120 | 50-70 | 70-85 | 85-100 | 100-120 | 120+ | 205 |
| Recon Gold | DebonAir | 27.5B, 29B at 130-150 | 40-60 | 60-75 | 75-90 | 90-105 | 105+ | 225 |
| Recon Silver RL | Solo Air | 27.5, 29 at 100-140; 27.5B, 29B at 100-150 | 50-70 | 70-85 | 85-100 | 100-120 | 120+ | 205 |
| Recon Silver TK | Solo Air | 26 at 100 | 50-70 | 70-85 | 85-100 | 100-120 | 120+ | 205 |

### How the engine should use a band

Show the band as a range, for example "75 to 85 psi for 81 to 90 kg." Do not collapse it to a single number. The rider's own current pressure is the "now" value, and the band tells them whether it is inside the manufacturer's window. That is more useful and more honest than a single figure RockShox did not publish.

Open-ended bands (`<75`, `125+`) carry one bound. Display them as "under 75" or "125 or more."

---

## 6. Coil springs

Coil forks set spring rate by swapping the spring, not by air. RockShox publishes springs by colour, not by rate.

| Fork | Spring type | <63 kg | 63-72 | 72-81 | 81-90 | 90-99 |
|---|---|---|---|---|---|---|
| 35 Silver TK and R | Coil | Silver, X-Soft | Yellow, Soft | Red, Medium | Blue, Firm | Black, X-Firm |
| 35 Silver TK and R | Dual Position Coil | n/a | Red, Medium | n/a | n/a | Black, X-Firm |
| Judy Silver TK | Coil | Silver, X-Soft | Yellow, Soft | Red, Medium | Blue, Firm | Black, X-Firm |
| Judy TK | Coil | Silver, X-Soft | Yellow, Soft | Red, Medium | Blue, Firm | Black, X-Firm |
| Recon Silver TK | Coil | Silver, X-Soft | Yellow, Soft | Red, Medium | Blue, Firm | Black, X-Firm |

No spring is listed for riders over 99 kg.

For a coil fork, `fork_psi` and `fork_spacers` resolve to absent, with the reason "coil spring fork, change the spring rather than the pressure." Show the colour recommendation for the rider's weight as a published figure. This is genuinely useful to a rider on an entry level bike who has never been told their fork spring can be changed.

---

## 7. Oil volumes

For `fork_unit.oil`. Volumes in mL. Oil height is measured from the top of the crown down to the oil.

| Fork | Damper side | Damper lower leg | Spring side (+ / −) | Spring lower leg |
|---|---|---|---|---|
| 35 Gold RL | RockShox 5wt, 170, height 85-90 | RockShox 15wt, 10 | DebonAir: RockShox 5wt, 2 / none | RockShox 15wt, 10 |
| 35 Silver TK and R | RockShox 5wt, 210, height 90-95 | RockShox 15wt, 10 | Solo Air: RockShox 5wt, 2. Coil: none | RockShox 15wt, 10 |
| BoXXer | Maxima PLUSH 3wt, bleed | Maxima PLUSH Light, 10 | Maxima PLUSH Heavy, 3 / 1 | Maxima PLUSH Light, 10 |
| Domain | Maxima PLUSH 3wt, 235, height 95-100 | Maxima PLUSH Light, 10 | Maxima PLUSH Heavy, 3 / 1 | Maxima PLUSH Light, 10 |
| Judy Gold | RockShox 5wt, 85 (26) or 102 (27.5, 29, Boost), height 80-85 | RockShox 15wt, 5 (non Boost) or 6 (Boost) | RockShox 5wt, 2 | RockShox 15wt, 10 (non Boost) or 6 (Boost) |
| Judy Silver | RockShox 5wt, 100 (26), 123 (27.5), 122 (29 and Boost), height 80-85 | RockShox 15wt, 5 or 6 (Boost) | Solo Air: 5wt, 2. Coil: none | RockShox 15wt, 10 or 6 (Boost) |
| Judy TK | RockShox 5wt, 143, height 80-85 | none listed | Coil, none | none listed |
| Lyrik, Pike, ZEB | Maxima PLUSH 3wt (Flight Attendant, Select, Base) or 7wt (Ultimate, Select+), bleed | Maxima PLUSH Light, 30 | Maxima PLUSH Heavy, 3 / 1 | Maxima PLUSH Light, 15 |
| Reba RL | RockShox 5wt, 100 (100mm) or 108 (110-120mm), height 71-77 | RockShox 15wt, 5 | Solo Air, none listed | RockShox 15wt, 5 |
| Recon Gold | RockShox 5wt, 130, height 80-85 | RockShox 15wt, 6 | DebonAir: RockShox 5wt, 2 | RockShox 15wt, 6 |
| Recon Silver RL | RockShox 5wt: 118 at 100-120, 150 at 130-140 (height 80-85); 140 on Boost (height 91-96) | RockShox 15wt, 6 | Solo Air: 5wt, 2 | RockShox 15wt, 6 |
| Recon Silver TK | RockShox 5wt: 118 (height 80-85), 140 on Boost (height 86-91); 150 on 26in | RockShox 15wt, 6 | Coil: none. 26in Solo Air: 5wt, 6 | RockShox 15wt, 9 (coil) or 6 (26in) |
| Revelation | RockShox 5wt, 155, height 100-106 | Maxima PLUSH Light, 10 | Maxima PLUSH Heavy, 3 / 1 | Maxima PLUSH Light, 10 |
| SID, SID SL | Maxima PLUSH 3wt, bleed | Maxima PLUSH Heavy, 10 | Maxima PLUSH Heavy, 3 / none | Maxima PLUSH Heavy, 10 |
| Yari | RockShox 5wt, 180, height 100-106 | Maxima PLUSH Light, 10 | DebonAir: Maxima PLUSH Heavy, 3 / 1 | Maxima PLUSH Light, 10 |

Grease: SRAM Butter or PM600 on most; RockShox Dynamic Seal Grease on Domain, Revelation, SID, SID SL and Yari.

Oil data is lower priority than everything above. Capture it, but do not block the build on it.

---

## 8. Conflicts and oddities

Record both readings, set `confidence` to the lower of the two, and do not pick one silently.

| Item | Reading 1 | Reading 2 |
|---|---|---|
| ZEB Base damper | Rush RC, oil table page 7 | Charger R, technical specifications page 25 |
| 35 Silver TK tokens on 29B | Page 15 shows none | Page 14 shows 27.5B at 1 installed (100-120) and 0 (130-160), max 2 |
| Domain RC damper name | "Motion Control", oil table page 3 | "Motion Control RC", technical specifications page 16. Treated as the same damper. |

For the ZEB Base, create the fork unit with `damper_id` pending and a `confidence_note` naming both readings. 02b's damper work should settle it.

---

## 9. Out of scope for v1

Skip these, and list them in `coverage.json` as deferred rather than omitting them silently.

| Item | Reason |
|---|---|
| Paragon Gold | Gravel, 700c |
| Rudy XPLR | Gravel, 700c |
| Pike DJ | Dirt jump |
| Reba 26 (FS-Reba-26-A2) | Weight bands run from under 27 kg to 54 kg, so this is junior sizing |
| Dual Position Air on Yari and ZEB | Charts are marked "featured on E-MTB models only." E-MTB is deferred. |

The E-Bikes add 10 psi note is captured on each chart but not applied in v1.

---

## 10. Schema and engine changes required

`01_SCHEMA.md` is now **v0.3.2** with these additions. Rebuild the affected Zod schemas.

**`pressure_chart.bands`.** An array of `{ kg_min, kg_max, psi_min, psi_max }`, nulls allowed for open ends. Required when `point_type` is `bracket`. `points` stays for curves. The boundary point method used on the first three RockShox charts cannot represent a closed lowest band like "90-110 psi under 63 kg", so it loses data on every five-band chart. Re-express the three existing RockShox charts as bands.

**`pressure_chart.ebike_offset_psi`.** Integer, nullable. 10 for every standard chart here. Not applied in v1.

**`air_spring.coil_chart`.** For `type: "coil"`: an array of `{ kg_min, kg_max, label, colour }`. RockShox publishes colours, not lb/in rates, so `spring_rates_lbin` cannot hold this.

**`fork_unit.remote`.** Boolean, optional. Remote lockout variant of the same model code.

**Pending damper rule.** This is the change that makes every RockShox fork in this document selectable today.

- At ingest, a `damper_id` listed in the record's `fields_pending` is **not an orphan**. The unit is kept.
- In the engine, all four damper adjusters on such a unit resolve to a new state, **`pending`**. Pending is not absent. A pending adjuster is neither offered nor ruled out.
- The UI shows one line per screen: "Damper adjuster data for the Charger RC is not in the dataset yet." Spring pressure, token and tyre changes are still offered, because those come from published data in this document.
- When 02b lands and the damper record exists, the unit resolves normally with no data change.

Without this rule, none of these forks can appear until 02b completes, and a Pike Select rider gets nothing when this document already tells us their pressure band and token limits.

**Model code match is one to many.** An identifier match on `FS-PIKE-SEL-C1` returns the Pike Select family. The rider then picks travel and wheel size. Garage's identifier step must present that choice, not fail on ambiguity.

---

## 11. Ingestion instructions

1. Apply section 1 corrections to existing records. Add this document to each corrected record's `source`.
2. Create the three new chassis records and extend the 35 chassis.
3. Create air springs: one per family, spring type and travel, with `tier_applies_to`. DebonAir+ and DebonAir+ w/ ButterCup share token counts and pressure charts, so treat them as one spring per travel with ButterCup noted on the Ultimate tiers.
4. Create pressure charts as bands, one per air spring, with `point_type: "bracket"`, `applies_to_travel_mm`, `ebike_offset_psi: 10`, `basis: null`.
5. Create coil springs with `coil_chart`.
6. Create fork units: one per model code, travel and spring type. `damper_id` uses the reserved ids in section 2 and carries a `fields_pending` entry naming 02b. `model_code` populated. `offset_mm` null, since offset varies by wheel and lives on the chassis. `part_number` null.
7. Every record: `confidence: "published"` except the conflicts in section 8, `source.document` as named at the top of this file, `source.method: "manual_entry"`, `source.retrieved: "2026-09-25"`.
8. Run `npm run mtb:ingest` and **show me the coverage diff before going further.**

## 12. Golden value tests

This transcription is manual, and the harvest it corrects was wrong in exactly the way manual transcription goes wrong. Add a test that asserts these values survive ingest:

| Assertion | Expected |
|---|---|
| Pike 140 tokens | installed 0, max 5 |
| Pike 120 tokens | installed 1, max 6 |
| ZEB 160 tokens | installed 1, max 5 |
| ZEB 190, 29B axle to crown | 606 |
| Revelation 120 tokens | installed 4, max 6 |
| Yari 29+ 100 tokens | installed 5, max 7 |
| SID `max_rotor_mm` | 220 |
| Recon Gold 130-150 max psi | 225 |
| Judy Gold 29 at 120 axle to crown | 527 |
| 35 Silver 100-120 band for 72-81 kg | 125 to 140 psi |
| Lyrik 150-160 band for 81-90 kg | 80 to 90 psi |
| `FS-PIKE-SEL-C1` identifier match | returns Pike Select family, damper `rockshox_charger_rc_2023` |
| Any fork unit on a pending damper | adjusters resolve `pending`, never `absent`; pressure band still shown |
| Coil fork at 85 kg | "Blue, Firm" shown as published; `fork_psi` absent |

## 13. Update `00_STATE.md`

Record: the corrections made, the new record counts, the pending damper rule, schema 0.3.2, and that RockShox forks are now selectable in Garage with pressure and token data while damper data waits on 02b. Rear shocks remain FOX only until the companion rear suspension document is transcribed.
