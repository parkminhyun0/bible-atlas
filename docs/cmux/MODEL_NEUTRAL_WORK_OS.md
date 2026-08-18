# CMUX Model-Neutral Work OS

## 목적

장기 작업의 기억을 Claude, GPT/Codex, Gemini 등 특정 모델의 대화에 두지 않는다. Git, `.cmux/state.json`, 검증 가능한 Evidence가 복구의 SSOT다. 모델 세션은 교체 가능한 실행자일 뿐이다.

## 진실의 우선순위

1. 원격 Git 기본 브랜치와 활성 작업 브랜치
2. 현재 HEAD의 코드·테스트·배포 결과
3. `.cmux/state.json`과 fingerprint된 Evidence
4. 작업 문서
5. 대화 기록

대화와 Shared State가 충돌하면 Git과 Evidence가 우선한다.

## 상태 계약

- `.cmux/state.schema.json`: 공급자 중립 상태 형식
- `.cmux/state.json`: 한 개의 활성 main-bound 작업 체크포인트
- `tools/cmux-state.mjs`: 원자적 상태 변경과 takeover 검증

`git.headAtWrite`는 상태 파일을 쓰기 직전 HEAD다. 체크포인트 커밋은 자신의 SHA를 미리 알 수 없으므로 현재 커밋 SHA를 저장하지 않는다. 복구 시 `headAtWrite`가 현재 HEAD의 조상인지 검증한다.

## 불변조건

1. 한 상태 파일에는 활성 작업이 하나만 존재한다.
2. `completedSteps`의 step ID와 Evidence ID는 중복될 수 없다.
3. 현재 file Evidence의 SHA-256이 달라지면 takeover는 실패한다. 파일이 의도적으로 변경되면 과거 Evidence는 삭제하지 않고 `supersededAt/replacedBy`로 새 fingerprint에 연결한다.
4. 기록된 브랜치와 현재 브랜치가 다르면 takeover는 실패한다.
5. 작업 트리가 더러우면 takeover는 실패한다. 미커밋 작업의 소유권을 추측하지 않는다.
6. required gate가 `fail`이면 takeover와 complete는 실패한다.
7. complete는 blocker=0, nextStep=null, required gate 전부 pass/waived일 때만 가능하다.
8. planned takeover는 `handoff.ready=true`가 필요하다.
9. 세션 손실 복구는 lease 만료 후 `--recover --reason ...`으로만 가능하며 기록을 남긴다.
10. 다른 모델이 필수 외부 감사자를 가장하거나 대체하지 않는다. 해당 Evidence가 없으면 gate는 pending/fail로 유지한다.
11. `human`/`external` gate의 pass·waived 결정에는 actor와 Evidence가 모두 필요하다.
12. 새 작업은 기존 작업이 complete인 경우에만 `start`할 수 있다.

## 표준 흐름

```text
Git fetch/read
  → current branch/HEAD 확인
  → cmux validate --strict
  → cmux takeover
  → nextStep 한 단계 수행
  → Evidence 생성 및 fingerprint
  → gate 갱신
  → checkpoint
  → 커밋·push
```

### 체크포인트

```bash
node tools/cmux-state.mjs checkpoint \
  --phase implementation \
  --complete "render-v2" \
  --next "Run visual review" \
  --evidence tests/output/report.json
git add .cmux/state.json tests/output/report.json
git commit -m "checkpoint(cmux): render-v2 complete"
git push
```

### 계획된 handoff

```bash
node tools/cmux-state.mjs handoff --reason "provider rate limit"
git add .cmux/state.json
git commit -m "checkpoint(cmux): executor handoff ready"
git push

node tools/cmux-state.mjs takeover \
  --provider openai --model codex --session session-42
```

### 비계획 복구

이전 실행자가 checkpoint를 남겼지만 handoff flag를 쓰지 못한 경우 lease가 만료된 뒤에만 허용한다.

```bash
node tools/cmux-state.mjs takeover \
  --provider google --model gemini --session recovery-7 \
  --recover --reason "previous CLI session lost"
```

## Gate와 Evidence

Gate는 모델의 주장으로 통과하지 않는다. Evidence ID가 실제 파일 fingerprint나 재현 가능한 명령/URL을 가리켜야 한다.

```bash
node tools/cmux-state.mjs gate-add --id geometry --authority automated
node tools/cmux-state.mjs evidence --kind file --value tests/report.json
node tools/cmux-state.mjs gate --id geometry --status pass --evidence ev-<id>
```

새 작업을 `start`하면 이전 작업의 gate와 Evidence는 초기화된다. 필요한 gate를 `gate-add`로 명시하며, `--optional`이 없으면 required gate다.

사람 승인, 보안, 비용, 배포 권한, 민감한 역사 가정은 자동 gate로 바꾸지 않는다. 사람 gate는 `--actor`와 Evidence 없이 통과하지 않는다.

```bash
node tools/cmux-state.mjs gate --id maintainer-review --status pass \
  --actor github:maintainer --evidence ev-<review-url>
```

## 외부 오케스트레이터 경계

저장소 코드는 상태를 결정론적으로 검증하고 handoff 가능 상태를 표현할 수 있다. 하지만 provider quota를 스스로 감지하거나 다른 LLM 앱을 실행할 수는 없다. CMUX/스케줄러가 프로세스 종료·rate-limit 신호를 관찰하고 다음 executor를 시작해야 한다. 이 저장소는 그 실행자가 안전하게 이어받을 계약만 제공한다.

## System-manual 변경

상태 스키마, takeover 규칙, gate 의미, 이 문서와 CLI는 작업 신뢰 경계다. 변경은 별도 PR에서 검증하고 maintainer가 수동 병합한다. CI 성공만으로 자동 병합하지 않는다.
