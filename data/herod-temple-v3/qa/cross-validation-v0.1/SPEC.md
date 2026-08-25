# 헤롯성전 V3 · 3-모델 교차 검증 v0.1 · 공통 사양

세 패널(GPT · Claude · Gemini)이 **같은 데이터를 서로 다른 방법으로** 검증한다.
같은 검사를 세 번 하면 중복이지 교차 검증이 아니다. 렌즈를 나누되 **핵심 5개는 겹쳐서** 합의 신호를 만든다.

## 검증 대상 (모두 로컬 파일)

```
~/Documents/bible-atlas/data/herod-temple-v3/
  registry/measurement_registry.json      200행
  registry/evidence_registry.json          57행
  registry/structure_registry.json         28행
  registry/drawing_registry.json           78행
  registry/circulation_registry.json       25행
  registry/substructure_registry.json      18행
  registry/datum_control_registry.json     18행
  registry/geometry_input_registry.json    13행
  registry/reconstruction_gates.json       12행
  sources/dimensions.md
  sources/f02j.md
  sources/orientation_lock.md
```

브랜치 `feat/herod-temple-v3` · HEAD `1d030ec`

## 절대 규칙 (세 패널 공통)

1. **데이터를 고치지 마라.** 검증만 한다. 발견은 보고서에만 적는다.
2. **`NO AVERAGE`** — 충돌하는 사료 값을 평균내지 마라. 충돌은 충돌로 보고한다.
3. **source unit이 authority.** 규빗·피트·손바닥이 원본이고 미터는 파생값이다.
   `0.525 m/cubit`은 작업 가설이지 확정된 실측값이 아니다.
4. **모르면 모른다고 하라.** 추정으로 빈칸을 채우지 마라. `UNKNOWN`이 정답일 수 있다.
5. **자기 작업 self-approval 금지.** GPT는 이 데이터의 저자이므로 "내가 맞게 썼다"는 판정을 하지 않는다.
6. 근거 없이 등급을 올리지 마라. `A/B/C/D`는 사료 종류와 확인 수준으로 결정된다.

---

## CORE-5 · 세 패널 모두 수행 (합의 신호용)

### C1. Middot 체크섬 산술

아래는 **정의상 닫혀야 하는 합**이다. 계산해서 맞는지 확인하라.

```
Middot 4:6   6+40+1+2+1+1+40+1+2+1+1+3+1        =? 100
Middot 5:1   11+11+32+22+100+11                  =? 187
Middot 4:7   5+11+6+40+1+20+6+6+5                =? 100
Middot 4:7   5+3+5+6+6+20+6+6+5+3+5              =? 70
Middot 5:2   62+8+24+4+4+8                       =? ≤135 (나머지 ≥0)
성소 전면    2×15 + 70                            =? 100
```

각 합이 registry의 어느 행에서 나온 값인지 `Measurement ID`로 추적하라.
합이 안 맞으면 **어느 항이 틀렸는지**까지 지목하라.

### C2. 규빗 환산 검산

`measurement_registry.json`의 `Source Value` · `Source Unit` · `Converted m` · `Cubit Preset`.
`Cubit Preset = 0.525m`인 행에서 `Source Value(규빗) × 0.525 == Converted m`인지 전수 확인.
불일치 행의 `Measurement ID`를 전부 나열하라.

`Cubit Preset = N/A`인 63행은 별도로 — 단위가 무엇이고 환산 근거가 무엇인지 확인.

### C3. F02J 체인

```
PEF raw      South Wall 922 ft · Double 330 ft from SW · older Triple 300 ft from SE
derived      Triple from SW = 922 − 300 = ?  ft
             Double ↔ Triple = ? − 330 = ?  ft
미터 환산     × 0.3048
현대 종합값   ~70 m
```

산술이 닫히는지, 그리고 `89.0016 m`와 `~70 m`의 차이가 **무엇을 재확인해야 좁혀지는지**를 적어라.
(gate center 정의 / Warren station semantics / 후대 gate vs Herodian core / 측량 기준점)

### C4. ID 표기 분기

`measurement_registry`의 `Structure ID`와 `structure_registry`의 `Structure ID`를 대조.
언더바(`_`)와 하이픈(`-`)만 다른 쌍을 **전부** 찾아 나열하라. (예상 18건)
그리고 그 외에 어느 레지스트리에도 없는 `Structure ID`를 따로 분류하라.

### C5. NO AVERAGE 준수

아래 충돌쌍이 **분리 보관**되어 있는지, 어디선가 평균·절충되지 않았는지 확인.

```
Ulam        Middot 20×40c   vs  Josephus 25×70c
inner portal Middot 10×20c  vs  Josephus 16×55c
하부 clear   Middot 40c      vs  Josephus 60c
제단        Middot/Rambam 32×32c  vs  Josephus 50×50×15c
Royal Stoa  600ft / ~590ft / 105ft / 124ft / 127ft
```

---

## 출력 형식 (세 패널 동일)

```
LANE:            <GPT | CLAUDE | GEMINI>
MODEL:           <실제 모델명>
DATE:            2026-08-25
HEAD:            1d030ec

== CORE-5 ==
C1 CHECKSUM:     PASS | FAIL   (실패 시 어느 합, 어느 항)
C2 CUBIT:        PASS | FAIL   (불일치 Measurement ID 전량)
C3 F02J:         PASS | FAIL   (산술 결과 + 미해결 쟁점)
C4 ID_SPLIT:     <건수> + 목록
C5 NO_AVERAGE:   PASS | FAIL   (위반 위치)

== LANE 전용 ==
<각 레인 지시서 참조>

== 종합 ==
FINDINGS:        <심각도순. 각 항목에 파일·행·근거>
UNRESOLVED:      <판정 불가 항목과 그 이유>
CONFIDENCE:      <이 검증 자체를 얼마나 신뢰하는지, 왜>
```

결과는 `qa/cross-validation-v0.1/result_<lane>.md`로 저장한다.
세 결과가 모이면 합의/불일치를 대조한다. **불일치가 나온 항목이 가장 중요한 항목이다.**
