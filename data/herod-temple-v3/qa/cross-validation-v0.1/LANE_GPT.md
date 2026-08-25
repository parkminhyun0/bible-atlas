# LANE: GPT · 사료 재유도 (Source Re-derivation)

## 왜 이 레인인가

GPT는 이 데이터의 **저자**다. CMUX Control §4 는 `04_QA` 를 "Builder와 다른 모델"로 규정하고
**자기 작업 self-approval을 금지**한다. 따라서 GPT는 "내가 맞게 썼다"를 판정하지 않는다.

대신 GPT만 할 수 있는 일을 한다 — **registry를 보지 말고 원전으로 돌아가 값을 다시 유도하고,
그 결과를 registry와 대조**한다. 저자의 기억이 아니라 사료가 근거가 된다.

## 절차

1. **먼저 registry를 열지 마라.** Mishnah Middot · Josephus(War 5, Antiquities 15) ·
   PEF Survey of Western Palestine (1884) 원문에서 아래 값을 **독립적으로 재유도**하라.

   ```
   Azarah 전체 치수
   성소 수직 100c 분해 (각 항목별)
   성소 E-W / 후면 N-S / Ulam 전면
   Ulam 개구부 · Hekhal 개구부
   Holy Place / Holy of Holies clear volume
   제단 평면 · 높이(손바닥) · 램프
   여인의 뜰 · 모서리 방
   Hel 폭 · Soreg 높이 · 12계단 · 15계단
   뜰 문 규격 · 문 개수
   Royal Stoa 열 구성
   PEF South Wall / Double / Triple station
   ```

2. **그 다음** `registry/measurement_registry.json` 과 `sources/dimensions.md` 를 열어 대조하라.

3. 불일치를 세 종류로 분류하라:
   - **TRANSCRIPTION** — 원전은 맞는데 registry 옮기다 틀림
   - **INTERPRETATION** — 원전 해석이 갈리는 지점 (variant로 분리되어야 함)
   - **FABRICATION** — 원전에 없는데 registry에 있음 ← **가장 심각**

## 추가 확인

**A. 사료 인용 정확성.** `evidence_registry.json` 의 각 행은 `Source` · `Passage` · `Claim` ·
`Source URL`(Sefaria) 을 가진다. **인용된 절이 실제로 그 주장을 담고 있는지** 확인하라.
특히 `Grade: A` 20건과 `Status: Conflict` 5건을 우선.

**B. Rambam / 후대 주석 구분.** side cell 층고 `6/20/20c`, Mesibbah 관련 값은
Rambam 해석이지 Middot 직접 텍스트가 아니다. registry가 이를 `T2 / interpretive`로
제대로 표시하고 있는지, 아니면 Middot A-text로 승격되어 있는지 확인하라.

**C. Josephus 수치의 단위.** Josephus는 규빗과 피트가 섞여 있고 사본 전승 차이가 있다.
registry가 어느 판본·번역을 썼는지 추적 가능한지 확인하라.

**D. 622 ft 재유도.** `922 − 300 = 622` 가 PEF 원문에서 정당한 연산인지 확인하라.
`300 ft from SE` 와 `922 ft total`이 **같은 기준선·같은 측량**에서 나온 값인가?
아니라면 이 뺄셈 자체가 무효다. 폐기된 `621 ft` 의 출처도 추적하라.

## 금지

- registry 값을 "맞다"고 승인하지 마라. 재유도 결과만 보고하라.
- 원전에 없는 값을 채우지 마라.
- 자기 이전 산출물을 근거로 인용하지 마라 (`STEP07B-3에서 확정했으므로` 같은 논증 금지).

## 출력

`SPEC.md` 의 공통 형식 + 아래:

```
== LANE 전용 ==
RE_DERIVED:      <재유도한 값 목록. 원전 절 명시>
TRANSCRIPTION:   <건수 + 목록>
INTERPRETATION:  <건수 + 목록>
FABRICATION:     <건수 + 목록>   ← 0이 아니면 최우선 보고
CITATION_CHECK:  <evidence_registry 인용 정확성. 특히 A등급 20건>
RAMBAM_GUARD:    <후대 주석이 A-text로 승격된 사례>
F02J_622:        <622ft 유도의 정당성 판정>
```

`qa/cross-validation-v0.1/result_gpt.md` 로 저장.
