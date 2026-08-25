# 헤롯성전 V3 · 치수 통합표

출처: Notion Dashboard · Master Roadmap · STEP07B Work Package (2026-08-25 fresh-read)
단위 규칙: **source unit(규빗 `c` / 피트 `ft` / 손바닥 `t`)이 authority.** meter 는 derived.
환산: `1c = 0.525 m` (primary working hypothesis · Ritmeyer 왕실 규빗) · 병기 `0.4445 m` (할라카)
`1t = 1/6 c = 0.0875 m` · `1 ft = 0.3048 m`

> **경고** — 아래 미터값의 소수 자릿수는 산술 결과이지 고고학적 정밀도가 아니다.
> 큐빗 계수가 바뀌면 전부 변한다. 빌드는 반드시 큐빗 파라메트릭으로 한다.

---

## 1. 성소 (Sanctuary) — STEP02A / STEP02C / STEP07B-2

| 항목 | source unit | m (0.525) | 사료 | 등급 |
|---|---|---|---|---|
| 수직 스택 전체 | 100c | 52.5 | Middot | primary / RELEASE |
| ├ otem (바닥 아래) | 6c | 3.15 | Middot | RELEASE |
| └ 바닥 위 | 94c | 49.35 | Middot | RELEASE |
| gross envelope E-W | 100c | 52.5 | Middot | primary |
| gross envelope 후면 N-S | 70c | 36.75 | Middot | primary |
| Ulam 전면 | 100c | 52.5 | Middot | primary |
| Ulam 개구부 | 20×40c | 10.5×21.0 | Middot | RELEASE · 문 없음 · wire/constraint only |
| Hekhal 개구부 | 10×20c | 5.25×10.5 | Middot | RELEASE |
| Hekhal 4-door leaf | — | — | — | T2 · zero-thickness plane only |
| 성소(Holy Place) clear | 40×20×40c | 21.0×10.5×21.0 | Middot | T1 clear volume |
| 지성소(Holy of Holies) clear | 20×20×40c | 10.5×10.5×21.0 | Middot | T1 clear volume |
| upper core | 61×20×40c | 32.025×10.5×21.0 | — | T2 |
| side cells | 38개 = 15N + 15S + 8W | — | Middot | count/topology RELEASE · 개별 모듈 BLOCKED |
| side cell 반경 폭 | 5→6→7c | 2.625→3.15→3.675 | Middot | RELEASE |
| side cell 층고 | 6 / 20 / 20c | 3.15 / 10.5 / 10.5 | Rambam | **T2 · interpretive** |

### SOURCE_CONFLICT · NO AVERAGE
| 항목 | primary (Middot) | variant (Josephus) | 처리 |
|---|---|---|---|
| Ulam | `20×40c` | `25×70c` | variant 분리 |
| inner portal | `10×20c` | `16×55c` | variant 분리 |
| 하부 clear 높이 | `40c` | `60c` | **평균 금지** |

---

## 2. 번제단 / 램프 — STEP02B

| 항목 | source unit | m (0.525) | 사료 | 등급 |
|---|---|---|---|---|
| 제단 평면 | 32×32c | 16.8×16.8 | Middot / Rambam | primary |
| 제단 높이 상세 | 58t | 5.075 | Middot | RELEASE |
| pyre top | 53t | 4.6375 | Middot | RELEASE |
| red-line (적선) | 29t | 2.5375 | — | T2 · zero-thickness semantic centerline |
| 주 램프 | 32×16c nominal | 16.8×8.4 | Middot | T2 wedge guide |
| 램프 ground-run | 30c | 15.75 | — | T2 |
| 램프 rise | 53t | 4.6375 | — | T2 |

### variant · NO AVERAGE
- Josephus 제단 `50×50×15c` → **wire-only variant**

### BLOCKED
shittin 직경·간격 · shit-pit 치수 · ammah 단면·경사 · 정확한 Kidron 배출구 ·
overlap · air gap · small ramps · Rivuvah 상세

---

## 3. 뜰 (Courts) — STEP01B / STEP01C / STEP01D

| 항목 | source unit | m (0.525) | 사료 | 등급 |
|---|---|---|---|---|
| Azarah 전체 | 187×135c | 98.175×70.875 | Middot 5:1 | RELEASE |
| 여인의 뜰 | 135×135c | 70.875×70.875 | Middot 2:5 | **T2 centerline-aligned model envelope** |
| N-S 체인 | 135c | 70.875 | Middot | RELEASE |
| Nicanor 개구부 | 10×20c | 5.25×10.5 | Middot | T2 |
| 15 계단 | count 15 | — | Middot | count/rise/tread RELEASE |
| 뜰 문 (generic) | 10×20c | 5.25×10.5 | Middot | primary template |
| Hel 폭 | 10c | 5.25 | Middot 2:3 | RELEASE |
| 문 개수 | 7 (Middot) | — | Middot 1:4 | primary |
| 문 개수 alt | 13 (Shekalim) / 10 (Josephus War) | — | — | alternate · 분리 |
| remainder split | 12.5 / 12.5c | 6.5625 / 6.5625 | — | T2 · A 승격 BLOCKED |

### 상부 레벨 체인 — STEP01A
`0 → 3.15 → 7.0875 → 8.40 → 11.55 m` (Middot relative chain)
- `TXT-L0` 는 H0/world Z 가 아니다
- `TXT-L4 11.55 m` ↔ PEF historical Sanctuary `11.5824 m` 는 **수치 근접만 존재. datum bind 금지**

### BLOCKED
Soreg 정확한 polygon · Hel full 10c surround polygon · 램프 footprint · 2c overlap 해법 ·
ring/pillar/table 개별 XY·치수 · Nicanor 벽 두께·SITE 중심·반원 반지름/호 footprint

---

## 4. Royal Stoa · Outer Portico — STEP03B / STEP03C / STEP07B-3 / B-4

| 항목 | source unit | m | 사료 | 등급 |
|---|---|---|---|---|
| 기둥 total envelope | Ø≈3 ft × H≈27 ft | Ø≈0.914 × 8.230 | — | LOD0 RELEASE |
| entablature | ≈6.5 ft | ≈1.981 | — | T2 · total envelope only |
| nave | ≈47 ft | ≈14.326 | — | T2 |
| outer cloister 폭 | 30c | 15.75 | Josephus | Candidate GUIDE |
| outer cloister 기둥 높이 | 25c | 13.125 | Josephus | Candidate GUIDE |
| 구성 | 4 rows / 162 columns / three walks | — | Josephus | special T2 |

### variant · NO AVERAGE (모두 분리 보관)
`600 ft` (Josephus) · `~590 ft` (Peleg) · `3×54=162` · `~10.5 ft rhythm` ·
`105 ft` aisle sum · `124 ft` / `127 ft` total-width reconstruction

### BLOCKED
정확한 west/east endpoint · canonical 162-column full array · fourth-row rhythm ·
Corinthian/Doric/modillion 상세 profile · final roof/parapet/drainage · clerestory ·
gate↔column exact snap · SITE/world placement · intercolumniation · bay spacing

### 장식 전이 방화벽 (STEP07B-5 · DG-07)
- Western Wall drafted margin → Sanctuary/Ulam : **DENY**
- Royal Stoa Corinthian → W/N/E Outer Portico : **DENY**
- Outer Portico Doric → Royal Stoa : **DENY**
- Royal Stoa ornament → Sanctuary/Ulam : **DENY**
- Triple Gate profiled doorpost → 타 시스템 : **DENY**
- generic Roman/Classical decorative asset → historical evidence geometry : **DENY**

---

## 5. 성전산 외벽 · 남측 접근 — F-08 / STEP03D

| 항목 | 값 | 사료 | 등급 |
|---|---|---|---|
| South Wall 전체 | `922 ft = 281.0256 m` | PEF 1884 | **REVALIDATION_REQUIRED / P0 HOLD** |
| Double ← SW | `330 ft = 100.584 m` | PEF 1884 | 동일 |
| older Triple ← SE | `300 ft` | PEF 1884 | 동일 |
| derived Triple ← SW | `622 ft = 189.5856 m` | 계산 | 동일 · 구 `621 ft` 는 직렬화 오류로 폐기 |
| Double ↔ older Triple | `292 ft = 89.0016 m` | 계산 | 동일 |
| modern synthesis | `~70 m` | 현대 연구 | **Conflict** |
| Double 통과 | `~190 ft` | — | transition marker only |
| Triple 종단 | `~192 ft` | — | termination marker only |

**station order `SW → Double → Triple → SE` 만 topology lock.** 수치 체인은 production
endpoint authority 가 아니다. → `f02j.md`

### 상세 · 미해결
AD30 남측 monumental stair tread/riser/footprint · 정확한 plaza polygon/paving map ·
Hasmonean miqveh 정확한 footprint/depth/stairs · Chamber A/B vault 수직 ·
Chamber C footprint · eastern-street 수치 경사

Triple Gate 남측 A+B rock-cut chamber: 7.2–7.5 m offset · 약 `14.3×4.8 m` bounded **T2 envelope**

---

## 6. Parokhet (휘장) — STEP06D / STEP06E

| 항목 | source unit | m | 사료 | 등급 |
|---|---|---|---|---|
| gross 치수 | 40×20c | 21.0×10.5 | — | RELEASE |
| 두께 envelope | 1 handbreadth | 0.0875 | — | metadata |
| 실 구조 | 72×24 yarn architecture | — | — | RELEASE |
| topology | Yoma double-curtain · 1c 간격 | 0.525 | Yoma | RELEASE |
| Traksin primary | **두 겹 휘장 / 석조 벽 없음** | — | — | STEP02D 확정 |

### BLOCKED
micro-weave · 염료 · opening/hardware · aperture clearance · photometric light leak ·
fold/suspension detail
**Josephus entrance veil 의 cosmic motif 를 inner double Parokhet 에 bind 금지**

---

## 7. 성물 (Sacred Objects) — STEP06F / STEP06G

| 항목 | 재질 판정 | 등급 |
|---|---|---|
| Menorah | gold A release | 재질만 · **형상 DRAWING_BLOCKED_SOURCE_FORM** |
| Showbread Table | gold A release | 동일 |
| Incense Altar | gold surface A + wood core B candidate | 동일 |

- architectural gold plate 와 sacred-vessel solid gold 를 **분리**한다
- incense altar 에 outer altar 의 stone/lime stack 을 재사용하지 않는다
- **금은 emission 으로 밝게 만들지 않는다**
- shader 값은 `IMPLEMENTATION_ONLY`

---

## 8. 재질 — STEP06A / STEP06B

| 항목 | 값 | 등급 |
|---|---|---|
| 제단 | `FAB-ALTAR-WHOLE-STONE` + `FAB-ALTAR-LIMEWHITE` | **A-grade bind** (7 objects) |
| 제단 적선 | `FAB-ALTAR-RED-LINE` | semantic mask only |
| Sanctuary historical skin | bind `0` | **NO_BIND** |
| retaining-wall drafted ashlar | 자동 적용 **금지** | — |

---

## 참조 무결성

- 이 표는 Notion 페이지 본문에서 추출한 **사람이 읽기 위한 사본**이다.
- 기계 판정의 SSOT 는 `registry/` 의 Measurement / Evidence Registry 이며,
  값이 다르면 Registry 를 우선한다.
- STEP07C 이후 신규/개정 BUILD contract 가 이 숫자를 재사용하려면
  반드시 Measurement ID 를 생성해 bind 해야 한다 (Constitution §2 Registry-first, forward-only).
