# 헤롯성전 V3 · FIREWALL

적용 위치(예정): `bible-atlas/data/herod-temple-v3/FIREWALL.md`
근거: STEP07 Production Constitution v1.3 · CMUX AI Production Execution Control §7·§8

---

## 원칙

**V3 는 Notion STEP07 Evidence-Based SSOT 에서만 파생한다.**
저장소 안에 이미 존재하는 헤롯성전 자산(V1/V2 계열)은 V3 의 근거가 되지 않는다.
형식·도구·구조는 참조할 수 있으나, **수치·좌표·형상은 유입 금지**한다.

## 유입 금지 대상 (명시)

| 경로 | 사유 |
|---|---|
| `data/herod-temple/spec/world_alignment.json` | OSM 앵커(σ 5–8 m)로 2D Procrustes 해를 구한 결과. `sw_corner`·`robinson` 을 grade A/control 로 사용. Notion STEP04B/C 는 동일 지점을 `ENVELOPE_ONLY`·`SOURCE_ASSET_BLOCKED` 로 판정하고 solver 실행을 금지한다 |
| `data/herod-temple/validation/anchor-residuals.json` | 잔차 33.04 m · 27.02 m. 건축 정합 기준으로 사용 불가 |
| `data/herod-temple/spec/temple_spec.json` | V1 권위 체계. V3 의 199 atomic state 와 대응 관계가 검증되지 않음 |
| `data/herod-temple/spec/primitives_boxes.json` | 위와 동일 |
| `assets/herod-temple/**` | V1 텍스처·메쉬 |
| `vendor/3d-temple-mount/**` | 외부 모델(MIT). V3 의 evidence 근거가 아님 |
| 기존 GLB 일체 | `HerodTemple.glb` · `herod-temple-interior.glb` · `HerodTemple_AD30.glb` |

## 허용 (형식 참조만)

- `data/herod-temple/02_치수표.md` — 두 큐빗 병기(0.525 / 0.4445) + 사료 절 + A/B/C 등급이라는 **표 형식**은 좋은 선례다. 형식만 차용하고 값은 Notion 에서 가져온다
- `tools/herod-temple/*.mjs` — 빌드·익스포트 **패턴** 참조 가능. 상수 복사 금지
- Cesium 뷰어 통합 방식

## 별도 보관 (직접 사용 금지)

`data/herod-temple/validation/anchor-residuals.json` 의 기록:

> "OSM 이중문↔삼중문 간격이 67 m 인데 모델·발굴 도면은 86 m 다."

Notion F02J 격리는 다른 자료 계통에서 같은 문제를 기록하고 있다:

> PEF 1884 derived Double↔older-Triple = 292 ft = 89.0016 m · modern synthesis ~70 m

**서로 다른 자료·도구에서 같은 부호·같은 크기(약 19–20 m)의 불일치가 독립적으로 나왔다.**
이는 STEP07E F02J 화해의 **입력 후보**로서 가치가 있으나, 현 시점에서 어느 값도 production 으로
승격하지 않는다. `blocked/f02j_inputs.json` 에 출처를 명기해 보관만 한다.

## 상속되는 HOLD

- **F02J numeric stations** — `REVALIDATION_REQUIRED / P0 HOLD`. station order `SW → Double → Triple → SE` 만 lock. `SW 0 → Double 100.584 → Triple 189.5856 → SE 281.0256 m` 는 production endpoint authority 아님
- **SITE / world placement** — `BLOCKED`. 뷰어 배치는 presentation 결정으로 별도 표기
- **STEP05A mixed-unit correction** — native positive PASS + 의도적 negative expected FAIL 전까지 canonical 3D promotion HOLD
- **Sanctuary final masonry skin** — `NO_BIND / BLOCKED_EVIDENCE`
- **성물 3종(Menorah / Showbread Table / Incense Altar) exact form** — `DRAWING_BLOCKED_SOURCE_FORM`
- **Royal Stoa 162-column full array · Outer Portico production array** — `BLOCKED`
- **D24 exact decorative geometry** — `BLOCKED`, Sanctuary façade ornament `NO_MESH_DETAIL`

## 불변 규칙 (Control §8 상속)

- `NO AVERAGE` — 충돌하는 사료 값을 평균내지 않는다
- BLOCKED 치수를 도면 비례나 이미지 측정으로 추정해 채우지 않는다
- subsystem 간 장식 전이 금지 (Western Wall → Sanctuary, Royal Stoa ↔ Outer Portico 등)
- 역사 사실과 renderer 파라미터(roughness/RGB/IOR/photometry)를 분리한다
- 금은 emission 으로 밝게 만들지 않는다
- ARCH_LOCAL 과 SITE/world 를 혼합하지 않는다. scale `1.000` 고정
- native Blender 실행 전 `.blend / render validated` 선언 금지

## 위반 시

`VISUAL_QA_HOLD` 또는 `SYNC_HOLD` 로 중단하고 00_CONTROL(GPT)에 보고한다.
V3 는 Single-Writer 규칙을 상속한다 — staging 산출물은 누구나 만들 수 있으나
canonical 승격은 현재 EXECUTOR 만 한다.
