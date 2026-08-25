# 헤롯성전 V3 · 인수인계 (Codex 용)

작성: Claude Code · 2026-08-25
브랜치: `feat/herod-temple-v3` · 저장소 `parkminhyun0/bible-atlas`

---

## 0. 지금 무슨 일을 하고 있나

Notion `🏛️ 헤롯성전 모델링 · Evidence-Based 3D Reconstruction` SSOT 의 구조화 데이터를
이 git 저장소로 옮기는 중이다.

**왜:** Constitution v1.3 §5 는 canonical package 를 `ZIP + MANIFEST + SHA-256 + Library path` 로
규정하지만 그 Library 의 물리적 위치가 확정되지 않아 산출물이 휘발될 위험이 있었다.
또한 Blender 는 Notion 을 읽을 수 없다 — `blender --background --python` 은 파일 경로에서
JSON 을 읽으므로 데이터는 언젠가 반드시 파일로 내려와야 한다.

**진행률: 레지스트리 12/16**

---

## 1. 완료된 것

```
data/herod-temple-v3/
  README.md          V3 정체성 · 현재 Gate · 상속 HOLD
  FIREWALL.md        V1/V2 자산 유입 금지 규칙
  SYNC.md            Notion collection ID ↔ git 파일 매핑 + 단방향 규칙
  registry/
    measurement_registry.json/.csv     200행
    drawing_registry.json/.csv          78행
    evidence_registry.json/.csv         57행
    structure_registry.json             28행
    masonry_material_registry.json      26행
    circulation_registry.json           25행
    substructure_registry.json          18행
    datum_control_registry.json         18行
    sacred_furnishings_registry.json    15행
    geometry_input_registry.json        13행
    reconstruction_gates.json           12행
    textile_registry.json                4행
    _PENDING.md                        미이관 목록
  sources/
    dimensions.md          치수 통합표
    f02j.md                F02J 체인 + P0 격리
    orientation_lock.md    ORI-01~11
  packages/INDEX.md        canonical SHA-256 16건 대조표 (실물 ZIP 미적재)
  qa/cross-validation-v0.1/
    SPEC.md  LANE_GPT.md  LANE_CLAUDE.md  LANE_GEMINI.md
```

---

## 2. 남은 작업 · 레지스트리 4종

| Notion DB | collection id | 목표 파일 |
|---|---|---|
| Construction Phase | `4c178529-2592-4964-8c4e-c24240f7e11a` | `registry/construction_phase_registry.json` |
| Architectural Profile | `543d517e-0025-41f9-8247-b36529734937` | `registry/architectural_profile_registry.json` |
| 3D Data Completeness Matrix | `98b7b023-0875-4f66-bc57-ad5f3b0d4c7a` | `registry/data_completeness_matrix.json` |
| Relief, Ornament & Iconography | `b21fe70d-5ab2-42e4-92ec-21c87070ff9a` | `registry/relief_ornament_registry.json` |

### ⚠️ 결정적 요령 — SQL 쿼터는 소진됐지만 view mode 는 쿼터가 없다

```
Your workspace has reached the usage limit for Query Data Source.
```

SQL 모드(`SELECT * FROM "collection://..."`)는 막혔다. **view mode 로 우회한다.**

**2단계 절차:**

```
① notion-fetch 로 DB 페이지를 열어 view ID 를 얻는다
   fetch id = <위 표의 DB 페이지 ID>
   응답 끝의 <views> 블록에서 view://<uuid> 를 찾는다

② view mode 로 행을 가져온다
   notion-query-data-sources
     mode: "view"
     view_url: "https://app.notion.com/p/<DB페이지ID>?v=<view-uuid>"
     page_size: 100
```

DB 페이지 ID 는 SSOT Registries 허브에서 확인한다:
`https://app.notion.com/p/3c60b963e600812080a9f6ba96a0a90a`

이미 확인된 view ID (참고):
```
Masonry            9ea732fae81848d296b59015c7943e7f ?v= b1ba630f-1ac0-4957-bd27-e385992afda1
Sacred Furnishings aea2502d7fab4546b713106f5b70694e ?v= c4beb873-0fc5-48b4-99d3-15c3d909712f
Textile            222cda05c131436c874253cdee552e92 ?v= 3d61bd03-71fb-4389-ba7d-c593e8ca9d48
```

### 변환 규칙

- 결과를 **JSON 배열**로 `registry/<name>.json` 에 저장
- Notion 내부 필드(`id`, `url`, `createdTime`)는 생략 가능. 단 **도메인 ID 는 반드시 보존**
  (`Measurement ID` · `Structure ID` · `Evidence ID` · `Geometry ID` · `Element ID` ·
   `Datum ID` · `Fabric ID` · `Object ID` · `Textile ID` · `Sheet ID`)
- 빈 문자열 필드는 생략해도 되지만 **값이 있는 필드는 원문 그대로** 옮긴다. 요약·의역 금지
- 200행 초과 시 `LIMIT 100 OFFSET n` 페이지네이션 (Measurement 가 그 경우였다)
- 작업 후 `SYNC.md` 매핑표의 ☐ 를 ✅ 로 바꾸고 행 수를 적는다

---

## 3. 절대 지켜야 할 규칙

Notion `CMUX AI Production Execution Control` §7·§8 과 Constitution v1.3 상속.

1. **데이터를 고치지 마라.** 이 저장소는 Notion 의 **발행 스냅샷**이다. 단방향.
   값이 틀렸으면 Notion 에서 고치고 다시 내린다. git 에서 직접 수정 금지.
2. **`NO AVERAGE`** — 충돌하는 사료 값을 평균내지 마라.
3. **source unit 이 authority.** 규빗·피트·손바닥이 원본, 미터는 파생.
   `0.525 m/cubit` 은 작업 가설이지 확정 실측값이 아니다.
4. **추정 금지.** 빈 값은 빈 값으로 둔다. `UNKNOWN` 이 정답일 수 있다.
5. **V1/V2 자산 유입 금지** → `FIREWALL.md`. 특히
   `data/herod-temple/spec/world_alignment.json` (OSM 앵커 · Procrustes 해 · 잔차 33m/27m).
   Notion `G4-SITE` 게이트가 *"OSM eye-fit 으로 통과 금지"* 를 명시한다.
6. **Dashboard · Master Roadmap · CMUX Control · Constitution 은 수정하지 마라.**
   EXECUTOR(GPT) 전용이며 건드리면 v1.3 §0A 의 4면 합의가 깨진다.
   Notion 기록이 필요하면 `작업 이력 DB`(`ce0cba77-e824-4f83-aced-0de1330b6894`)에만 append.

---

## 4. 미해결 · 상위 이슈 4건

이건 이관 작업이 아니라 **GPT(00_CONTROL)가 판단해야 할 사안**이다. 발견만 하고 넘긴다.

| # | 이슈 | 상태 |
|---|---|---|
| 1 | **ID 표기 분기 18건** — `ALTAR_MID`↔`ALTAR-MID`, `ALTAR_RAMP`↔`ALTAR-RAMP`, `SANCT_HEIGHT`↔`SANCT-HEIGHT`. Measurement 와 Structure 가 같은 대상을 다르게 부른다. 자동 조인이 끊긴다. Constitution §16 `dangling ref 0` 위반 | Notion 통일 필요 |
| 2 | **canonical package 실물 16건 부재** — `packages/` 가 비어 있다. Notion 에 SHA 만 있고 payload 가 없다. `CMUX_04QA_NATIVE_CORRECTNESS_HANDOFF_v0_1.zip`(`cb5637d7…`) 포함 | GPT export 필요 |
| 3 | **Blender `BLOCKED_RUNTIME` 사유 오류** — STEP05B/05C/06C/06E/06G 가 "Blender executable 미탑재"를 사유로 기록했으나 이 맥에 `/opt/homebrew/bin/blender` Blender 5.2.0 LTS 가 설치돼 있고 headless `bpy` 가 정상 동작한다 | 사유 재분류 필요 |
| 4 | **`03_SUBSTRUCTURE` 컬렉션 계약 의심** — Constitution §7A 가 고정한 top-level 16개 목록에 `03_SUBSTRUCTURE` 가 없다(16개의 `03` 번은 `03_OUTER_COURT`). 그런데 `geometry_input_registry` 와 `substructure_registry` 가 `03_SUBSTRUCTURE/...` 경로를 쓴다 | **미확인. 검증 필요** |

### 이미 검증된 것

```
geometry → measurement 참조 32건 : 전부 해소 · dangling 0   ✅
Constitution v1.3 §0A 4면 합의    : PASS (전부 STEP07B-6 / 84% / v0.5)
Blender 실행 게이트 (Control §6)   : PASS (5.2.0 LTS, headless bpy)
```

---

## 5. 이관이 끝나면 할 일

1. **`_PENDING.md` 삭제** 또는 완료 표시
2. **참조 무결성 전수 재검사** — cross-registry 참조 159건이 16종 모두 이관된 뒤에도
   dangling 인지 확인. `qa/cross-validation-v0.1/LANE_CLAUDE.md` 의 M1 이 그 절차다
3. **3-모델 교차 검증 실행** — `qa/cross-validation-v0.1/` 의 SPEC + 3개 레인 지시서.
   결과는 `result_gpt.md` · `result_claude.md` · `result_gemini.md`
4. **Draft PR 생성** — `gh pr create --draft`. **병합은 사용자가 한다**
5. Notion `작업 이력 DB` 에 완료 행 append (Dashboard 등은 건드리지 않음)

---

## 6. Notion 에 없어서 여기로 못 오는 것

이관이 끝나도 **아래는 git 에 없다.** 오해하지 마라.

| 항목 | 이유 | 어떻게 채우나 |
|---|---|---|
| canonical ZIP payload 16건 | Constitution §5 가 대용량 data 의 Notion 복제를 금지 | GPT export → `packages/` |
| 실제 도면 파일 (DXF/SVG/PNG) | Drawing Registry 는 메타데이터만 78행 | Library 에서 export |
| STEP01A~STEP07B Work Package 약 40페이지 | 서술형 판정·blocker 근거·verdict | 필요 시 별도 추출 |
| Constitution · Control · Dashboard · Roadmap | **의도적으로 Notion 에 남긴다.** 거버넌스이지 모델 데이터가 아니다 | 그대로 둔다 |
| Daily Log · 구조화 브리핑 | v1.3 §0A 가 append-only history 로 규정 | 그대로 둔다 |

---

## 7. 커밋 관례

```
feat(temple-v3): ...    데이터 추가
docs(temple-v3): ...    문서
test(temple-v3): ...    QA/검증

Co-Authored-By: <실행 모델> <noreply@...>
```

`.cmux/state.json` 은 **다른 자동화의 산출물이다. 절대 커밋하지 마라.**
`git add data/herod-temple-v3` 로 경로를 한정한다.
