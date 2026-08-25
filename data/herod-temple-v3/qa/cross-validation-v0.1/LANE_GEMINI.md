# LANE: GEMINI · 외부 대조 (External Cross-check)

## 왜 이 레인인가

앞의 두 레인은 **프로젝트 안쪽**을 본다 — 원전 재유도와 내부 정합성.
이 레인은 **바깥**을 본다. 이 복원안이 현대 고고학·학계 종합과 어긋나는 지점을 찾는다.

프로젝트의 모든 PASS가 자기 규칙에 대한 PASS였다는 것이 이 프로젝트의 알려진 약점이다.
이 레인만이 "밖에서 보면 틀렸다"를 말할 수 있다.

## 절차

`registry/` 와 `sources/dimensions.md` 를 읽고, 각 주요 수치를 **외부 문헌과 대조**하라.
웹 검색을 적극적으로 쓰되, **출처를 반드시 명시**하라. 출처 없는 주장은 무효다.

## 검사 항목

### X1. 성전산 외벽 실측 대조

registry는 PEF 1884 계열 값을 쓴다. 현대 측량·발굴 보고와 대조하라.

```
South Wall  922 ft = 281.0256 m   ← 현대 값은?
서벽 / 동벽 / 북벽 길이            ← registry에 있는가, 현대 값은?
Double ↔ Triple 간격 89.0016 m vs ~70 m  ← 현대 학계 다수설은?
```

특히 **Double↔Triple 간격**은 이 프로젝트의 P0 쟁점이다.
현대 문헌이 실제로 얼마를 말하는지, 그 값이 **무엇을 기준점으로 잰 것인지** 찾아라.

### X2. 규빗 길이 학설 지형

registry는 `0.525 m` 를 primary working hypothesis 로 쓴다.

- Ritmeyer의 525 mm 왕실 규빗 논거는 무엇인가
- Patrich 등 다른 복원가는 무엇을 쓰는가
- 할라카 규빗(약 0.4445 / 0.48 / 0.52 등) 논쟁의 현재 지형은
- **`500 × 0.525 = 262.5 m`가 성전산 실측 정방형과 실제로 맞는가** — 이게 0.525 채택의 핵심 논거인데 검증되는가

### X3. 성전 위치 가설

registry의 `TM-CORE500`(Ritmeyer 500규빗 정방형)은 `Hypothesis` 등급이다.
현대 학계의 주요 위치 가설 세 갈래(바위돔 = 지성소 / 바위돔 = 제단 / 북쪽 또는 남쪽 이동설)를
정리하고, registry가 **어느 가설에 얼마나 묶여 있는지** 평가하라.

특히 `orientation_lock.md` 의 ORI-01~11이 특정 가설을 암묵적으로 전제하는지 확인하라.

### X4. 최근 발굴 반영도

registry가 인용하는 발굴 보고의 최신성을 확인하라.

```
IAA 남벽 발굴 (A-9477)
Baruch & Reich 2016 · Triple Gate 인근 암반 굴착 방
Western Wall Tunnels · Warren's Gate 광장 포장 (726.7 / 724 / 723.5 m ASL)
City of David · Pilgrims Road
Wilson's Arch / Great Causeway
```

- 이후 더 새로운 보고가 나왔는가
- registry가 놓친 주요 발굴이 있는가
- 인용된 수치가 원 보고서와 일치하는가

### X5. Josephus 신뢰도 지형

registry는 Josephus 수치를 대부분 `T2/Candidate`로 강등해 두었다.
현대 학계가 Josephus의 건축 수치를 어떻게 평가하는지 정리하고,
**강등이 과했거나 부족한 항목**이 있는지 지적하라.
특히 Royal Stoa `162 기둥 / 4열` 은 Josephus 단독 근거인데 등급이 적절한가.

### X6. 누락 검사 — 무엇이 아예 없는가

registry에 **있어야 하는데 아예 없는 것**을 찾아라. 이게 이 레인의 가장 중요한 일이다.

예시 방향:
- 성전산 북쪽·동쪽 관련 데이터가 남쪽·서쪽 대비 얼마나 빈약한가
- 1세기 예루살렘의 다른 구조물과의 관계(왕궁·상부도시·시장)가 반영되어 있는가
- 파괴층·화재 흔적 등 AD70 관련 증거가 AD30 복원과 분리되어 있는가
- 후대(비잔틴·우마이야) 요소가 Herodian으로 오귀속된 항목이 있는가

## 금지

- 출처 없는 수치를 제시하지 마라.
- registry 값을 "학계 통설과 다르다"고만 하지 말고, **누가 무엇을 근거로 다르게 말하는지** 적어라.
- 위키피디아 단독 인용 금지. 1차 발굴 보고 또는 심사 문헌을 찾아라.
- 데이터를 고치지 마라. 보고만 한다.

## 출력

`SPEC.md` 공통 형식 + 아래. **모든 주장에 출처 URL 또는 서지 정보**.

```
== LANE 전용 ==
X1 WALL_METRICS:   <PEF vs 현대 측량 대조표 + 출처>
X2 CUBIT_LANDSCAPE: <학설 지형 + 262.5m 검증 결과>
X3 LOCATION_HYPOTHESIS: <가설 세 갈래 + registry 결박도>
X4 EXCAVATION_CURRENCY: <최신성 · 누락 발굴 · 수치 일치>
X5 JOSEPHUS_GRADING: <강등 과부족 판정>
X6 MISSING:        <아예 없는 항목>   ← 최우선
SOURCES:           <인용 전량>
```

`qa/cross-validation-v0.1/result_gemini.md` 로 저장.
