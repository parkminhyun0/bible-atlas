# LANE: CLAUDE · 기계 검증 (Machine Verification)

## 왜 이 레인인가

449행의 레지스트리는 사람이 눈으로 훑어서 검증할 수 없다.
이 레인은 **코드로 돌려서 결정적으로 판정**한다. 의견이 아니라 실행 결과를 낸다.

## 절차

`~/Documents/bible-atlas/data/herod-temple-v3/registry/` 의 JSON을 python으로 읽고
아래를 **스크립트로** 검사하라. 결과 스크립트도 함께 제출한다.

## 검사 항목

### M1. 참조 무결성 전수

```
geometry_input.Dimension IDs    → measurement.Measurement ID
geometry_input.Structure ID     → substructure.Element ID
geometry_input.Parent ID        → geometry_input.Geometry ID (자기참조)
geometry_input.Start/End Datum  → datum_control.Datum ID
measurement.Structure ID        → structure.Structure ID | substructure.Element ID
substructure.Dependency         → substructure.Element ID
circulation.Next Segment        → circulation.Segment ID
evidence.Structure              → structure.Structure
*.Drawing IDs                   → drawing_registry (Sheet ID)
```

각 방향별로 `해소 / dangling` 건수와 dangling 목록 전량을 내라.

### M2. 동선 그래프 위상

`circulation_registry` 의 `Next Segment` 로 그래프를 만들어라.

- 시작 노드(들어오는 간선 없음) · 종단 노드(`Next Segment: null`)를 찾아라
- **끊긴 구간**(다음 세그먼트가 존재하지 않는 ID를 가리킴)이 있는가
- **순환**이 있는가
- `C-S01`에서 `C-HP01`까지 **끊김 없이 도달 가능한가**
- `Access Class` 가 경로를 따라 단조롭게 좁아지는가
  (`Public Outer → Jewish Clean → Women/Court → Israel Male → Priest Only → Sanctuary Priest → High Priest`)
  역행하는 구간이 있으면 보고하라

### M3. 수직 체인 정합

`datum_control_registry` 의 `Relative To` + `Relative Delta m` 로 체인을 만들어라.

```
D-HEL-BASE → D-WOMEN-COURT-FFL (+3.15) → D-ISRAEL-COURT-FFL (+3.9375)
           → D-PRIESTS-COURT-FFL (+1.3125) → D-ULAM-FFL (?)
```

- 각 delta가 `circulation_registry` 의 `Vertical Change` 서술과 일치하는가
  (12×0.5c=6c → 3.15m? 15×0.5c=7.5c → 3.9375m? 2.5c → 1.3125m?)
- `0.525 m/cubit`으로 역산이 닫히는가
- 절대 ASL을 가진 행(`726.7 / 724 / 723.5`)과 상대 체인이 **연결되어 있는가, 끊겨 있는가**
  끊겨 있다면 그것이 `SITE/world BLOCKED` 판정과 정합하는지 확인

### M4. 상태 enum 일관성

각 레지스트리의 `Status` / `Evidence Grade` / `Plan Status` / `Vertical Status` 값 분포를 내라.
같은 대상이 레지스트리마다 다른 등급을 갖는 경우를 찾아라.
(예: `structure_registry`에서 B인데 `measurement_registry`의 해당 행은 A)

### M5. Blender 컬렉션 계약

`structure_registry.Blender Collection` 과 `geometry_input_registry.Blender Collection` 의
**top-level 컬렉션**을 추출하라. Constitution §7A가 고정한 16개와 대조:

```
00_REFERENCE 01_TERRAIN 02_PLATFORM_RETENTION 03_OUTER_COURT 04_SOREG_HEL
05_WOMEN_COURT 06_INNER_COURTS 07_ALTAR 08_SANCTUARY 09_GATES
10_PORTICO_ROYAL_STOA 11_ANTONIA 12_STAIRS_ACCESS 13_MATERIALS_REFERENCE
90_VARIANTS 99_QA
```

16개에 없는 top-level이 등장하면 **계약 위반**이다. (`03_SUBSTRUCTURE` 를 주의해서 보라)

### M6. BUILD 가능 대상 집계

`Status`/`Plan Status`가 production build 가능한 행이 몇 개인지,
그 행들이 필요한 필드(치수·컬렉션·generator 참조)를 **전부** 갖췄는지 확인하라.
하나라도 빠지면 그 행은 아직 build-ready가 아니다.

## 출력

`SPEC.md` 공통 형식 + 아래. **스크립트 본문도 첨부**하라.

```
== LANE 전용 ==
M1 REF_INTEGRITY:  <방향별 해소/dangling + dangling 전량>
M2 PATH_GRAPH:     <시작/종단/끊김/순환/Access Class 역행>
M3 VERTICAL_CHAIN: <delta 검산 + 절대/상대 연결 여부>
M4 ENUM_CONSISTENCY: <레지스트리 간 등급 불일치>
M5 COLLECTION_CONTRACT: <16개 계약 위반 여부>
M6 BUILD_READY:    <build 가능 행 수 + 필드 결손>
SCRIPT:            <실행한 코드>
```

`qa/cross-validation-v0.1/result_claude.md` 로 저장.
