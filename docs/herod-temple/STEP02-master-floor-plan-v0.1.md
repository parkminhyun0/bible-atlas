# STEP 02 · Master Floor Plan v0.1

Status: **geometry baseline generated; absolute world alignment remains provisional**

## 1. Placement contract

- Cesium runtime placement SSOT: `data/herod-temple/spec/world_alignment.json`
- Existing GLB site frame: origin = Herodian platform NW corner; `+X east`, `+Y up`, `+Z south`; **metres**.
- Floor-plan master architectural frame:
  - `H0 = Holy of Holies center`
  - `+E east`, `+N north`, `+U up`
  - H0 in current GLB/site frame = `[88.574617, 0, 225.758621] m`
  - H0 derived WGS84 using the current Cesium alignment = `31.7781297571, 35.2352091871`
  - this WGS84 value is **derived from the current provisional alignment**, not a new archaeological fact
- Architectural frame rotation relative to the existing site frame:
  - `E basis in site XZ = [0.997283737526, 0.073655596301]`
  - `N basis in site XZ = [0.073655596301, -0.997283737526]`
  - precinct rotation vs site +X = `4.223980°`
  - derived world azimuth: `+E = 86.483980°`, `+N = 356.483980°`
- Conversion:
  - `x_site = H0_x + 0.997283737526*E + 0.073655596301*N`
  - `y_site = U`
  - `z_site = H0_z + 0.073655596301*E - 0.997283737526*N`
  - inverse: `E = 0.997283737526*(x-H0_x) + 0.073655596301*(z-H0_z)`
  - inverse: `N = 0.073655596301*(x-H0_x) - 0.997283737526*(z-H0_z)`
- **Never** resize, skew, or visually fit this plan to imagery, blank spaces, present-day paving, or the Dome of the Rock footprint.
- Runtime scale is locked at `1.0`.
- Current horizontal world alignment is still `alignment-provisional`: RMS `3.125 m`, max control residual `4.36 m`.
- Vertical datum is **not locked**. Do not freeze the architectural floor levels to modern DEM.

## 2. Cubit and unit

- Live/reference cubit: `1 cubit = 0.525 m`.
- `1 Blender Unit = 1 m`.
- Alternative cubit values are research variants only and must never rescale the live plan without explicit approval.

## 3. Outer platform / site frame

Current vendor/GLB platform vertices, metres:

| Corner | X east | Z south |
|---|---:|---:|
| NW | 0.000 | 0.000 |
| NE | 313.900 | 26.000 |
| SE | 280.000 | 485.000 |
| SW | 0.000 | 485.000 |

The platform is an **irregular quadrilateral**, not a rectangle.

## 4. 500-cubit square core hypothesis

Derived from Middot 2:1 + Ritmeyer 0.525 m cubit hypothesis.

| Corner | X site m | Z site m |
|---|---:|---:|
| NW | 42.500964 | 136.810934 |
| NE | 304.287945 | 156.145528 |
| SE | 284.953351 | 417.932509 |
| SW | 23.166370 | 398.597915 |

Side = `500 cubits = 262.5 m`.
This is a **B-grade reconstruction hypothesis**, not the full Herodian enclosure.

## 5. Sacred precinct dimension chain

### E–W chain across the 187-cubit Azarah

| Segment | cubits | metres |
|---|---:|---:|
| rear court | 11 | 5.775 |
| sanctuary | 100 | 52.500 |
| altar → Porch gap | 22 | 11.550 |
| altar | 32 | 16.800 |
| Court of Priests | 11 | 5.775 |
| Court of Israel | 11 | 5.775 |
| **Total** | **187** | **98.175** |

### N–S

- Azarah = `135 cubits = 70.875 m`
- Court of Women = `135 × 135 cubits = 70.875 × 70.875 m`
- Sanctuary rear/body width (Middot) = `70 cubits = 36.75 m`
- Ulam front width = `100 cubits = 52.5 m`

## 6. Sanctuary 100-cubit E–W decomposition

| Segment east→west | cubits | metres |
|---|---:|---:|
| Porch wall | 5 | 2.625 |
| Porch | 11 | 5.775 |
| eastern Hekhal wall | 6 | 3.150 |
| Hekhal | 40 | 21.000 |
| Traksin | 1 | 0.525 |
| Holy of Holies / Debir | 20 | 10.500 |
| western Hekhal wall | 6 | 3.150 |
| western cells | 6 | 3.150 |
| outer west wall | 5 | 2.625 |
| **Total** | **100** | **52.500** |

H0 is the centre of the 20-cubit Debir.

## 7. Key plan dimensions

- Hel/Chel width: `10 cubits = 5.25 m` — exact perimeter form is reconstructed.
- Court of Women corner chambers: `40 cubits = 21.0 m` each.
- Standard Middot doorway: `10 wide × 20 high = 5.25 × 10.5 m`.
- Porch opening: `20 wide × 40 high = 10.5 × 21.0 m`.
- Hekhal opening: `10 wide × 20 high = 5.25 × 10.5 m`.
- Middot altar base: `32 × 32 = 16.8 × 16.8 m`.
- Middot altar ramp: `32 long × 16 wide = 16.8 × 8.4 m`.
- Altar-to-Porch clear E–W distance: `22 cubits = 11.55 m`.
- Standard court step: rise `0.5 cubit = 0.2625 m`.
- Porch approach step: rise `0.5 cubit = 0.2625 m`, tread `1 cubit = 0.525 m`.

## 8. Levels — keep separate from modern terrain

Using the current textual stacking model:

| Level | cubits above esplanade | metres |
|---|---:|---:|
| Court of Gentiles / esplanade | 0 | 0 |
| Court of Women | 6 | 3.150 |
| Court of Israel | 13.5 | 7.0875 |
| Court of Priests | 16 | 8.400 |
| Sanctuary finished floor | 22 | 11.550 |

The Sanctuary's **100-cubit architectural height is counted from the priests' court datum** in the current interpretation; it must not be naively added to modern terrain.

## 9. Explicit textual conflicts — preserved, not averaged

### Altar
- Middot: `32 × 32` cubits with stepped profile.
- Josephus War 5.225: `50 × 50 × 15` cubits.
- v0.1 drawing uses `ALTAR_MID` for the main geometry because it closes consistently inside the 187-cubit court.
- `ALTAR_JOS` remains a separate switchable variant.

### Gates
- Middot standard doorway: `20 high × 10 wide`.
- Josephus regular gates: `30 high × 15 wide`.
- Josephus larger eastern Corinthian gate: building height `50`; doors `40`.
- These are different gate-class/description variants and must not be averaged.

### Sanctuary body width
- Middot: `70 cubits`.
- Josephus: `60 cubits` behind the 100-cubit front.
- v0.1 preserves Middot `70` for the master internal plan and records the Josephus `60` variant separately.

## 10. Outer gate stations already used by the current site model

These are site-frame stations in metres and are **not to be visually re-fit**:

| Gate | wall/from | station | width | height |
|---|---|---:|---:|---:|
| Robinson | W/from SW | 12 | 12.9 span | — |
| Barclay | W/from SW | 80 | 5.6 | 8.8 |
| Wilson | W/from SW | 150 | ~13 span / 8.4 opening | 8.4 |
| Warren | W/from SW | 190 | 5.0 | 7.0 |
| Double/Huldah | S/from SW | 84 | 12.6 | 8.6 |
| Triple/Huldah | S/from SW | 170 | 15.4 | 8.6 |
| Shushan | E/from NE | 215.2 | 10.5 | 11.55 |
| Tadi | N/from NW | 200 | 5.25 | 10.5 |

These are model/excavation-derived working placements; the OSM check points in `world_alignment.json` are not survey-grade.

## 11. Gate for Blender/Cesium use

A Blender/CAD model is allowed to use this plan when:

1. Scene = Metric, 1 BU = 1 m.
2. H0 is either the Blender origin or has a documented parent transform to H0.
3. No scale other than 1.0 is used.
4. The exported GLB can be transformed into the existing **site frame** without geometry distortion.
5. Cesium placement uses `world_alignment.json`; no manual latitude/longitude nudging is baked into geometry.
6. `ALTAR_MID`, `ALTAR_JOS`, gate variants, and sanctuary-width variants remain separate.
7. Absolute map accuracy is not claimed better than the current alignment evidence.

## 12. v0.1 limitations

- The **internal dimension network is deterministic** within the selected Middot/Ritmeyer reconstruction.
- The **absolute world placement is not survey-grade** yet because the existing alignment relies partly on OSM control points.
- Historical vertical datum / Herodian pavement absolute elevation is not yet locked.
- Exact Hel/Soreg corner geometry, some gate-house shapes, side-cell details, and Royal Stoa bay spacing remain reconstruction-dependent.
