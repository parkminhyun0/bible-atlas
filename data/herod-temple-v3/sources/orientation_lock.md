# Orientation Lock Registry · ORI-01 ~ ORI-11

출처: Notion CMUX Control §18B Mandatory Macro Orientation Preflight ·
STEP07B WP §9 Macro Topology & Orientation Reaudit v0.1
Package: `STEP07B-MACRO-ORIENTATION-LOCK-v0.1`
SHA-256: `0e5677f5bf498dac7416b041d844062cfbcc06cf5db78c972cfa7295e9176861`

> whole-complex preview · floor-plan integration · geometry staging 을 시작하기 전에
> 반드시 이 목록을 preflight 로 검증한다. **하나라도 위반하면 `VISUAL_QA_HOLD`.**

---

## 좌표계

| 항목 | 값 |
|---|---|
| frame | `ARCH_LOCAL` |
| +X | **EAST** |
| +Y | **NORTH** |
| Z | up |
| scale | `1.000` 고정 |

`ARCH_LOCAL` 과 `SITE/world` 를 혼합하지 않는다.

---

## 잠금 항목

| ID | 내용 |
|---|---|
| ORI-01 | `ARCH_LOCAL +X = EAST / +Y = NORTH / scale 1.000` |
| ORI-02 | **Ulam · 성소 주입구 = EAST end** |
| ORI-03 | **Altar = Ulam 의 동쪽** |
| ORI-04 | Women's Court = Nicanor/Azarah 의 **동쪽 관계**. exact transform / SITE alignment 는 unresolved |
| ORI-05 | Antonia = **NW topology relation only**. exact fortress footprint / towers = `BLOCKED / NO_MESH` |
| ORI-06 | **Royal Stoa = SOUTH** system |
| ORI-07 | South-Wall 서→동 **station order only LOCKED** = `SW → Double → Triple → SE`. 수치 체인은 `REVALIDATION_REQUIRED / P0 HOLD` |
| ORI-08 | Inner Nicanor/east gate 와 outer east-wall gate 를 **자동 동일시하지 않는다** |
| ORI-09 | exact full AD30 outer-perimeter polygon 은 아직 production release 아님 |
| ORI-10 | generated/AI 조감도는 `QA_ONLY`. **geometry authority 로 측정·복제 금지** |
| ORI-11 | `ARCH_LOCAL ↔ SITE/world` **eyeballed fusion 금지** |

---

## 배경

이전에 생성된 AI 조감도가 geometry authority 로 오용될 위험이 확인되어,
해당 이미지를 QA-only 비교 이미지로 무효화하고 이 레지스트리를 신설했다.

Verdict: `PASS_MACRO_TOPOLOGY_ORIENTATION_REAUDIT__CORE_AXES_AND_RELATIONS_LOCKED__FULL_OUTER_POLYGON_AND_WORLD_BIND_REMAIN_BLOCKED`

## 계속 차단

- 정확한 AD30 외곽 4면 polygon
- Antonia exact footprint / towers
- `ARCH_LOCAL → SITE/world` production transform
- 이미지 비례측정에 의한 미지 치수 복원
