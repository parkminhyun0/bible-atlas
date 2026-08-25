# 헤롯성전 V3 · Evidence-Based Reconstruction Data

`herod-temple-v3` — Notion `🏛️ 헤롯성전 모델링 · Evidence-Based 3D Reconstruction` SSOT 에서
파생한 **완전 독립 버전**의 데이터 저장소.

## 이게 무엇인가

기존 `data/herod-temple/`(V1·V2 계열)과 **분리된 새 라인**이다.
V1 은 CesiumJS 뷰어용 3D 모델 제작 라인이고, V3 는 근거 추적이 가능한
Evidence-Based 복원 데이터를 축적·검증해 모델로 만드는 라인이다.

**V1 자산은 V3 의 근거가 되지 않는다.** → `FIREWALL.md`

## 왜 GitHub 인가

Notion Constitution v1.3 §5 는 canonical package 를
`ZIP + MANIFEST.json + SHA-256 + Library canonical path` 로 규정하지만,
그 Library 의 물리적 위치가 확정되지 않아 산출물이 휘발될 위험이 있었다.
git 저장소가 그 역할을 대신한다 — 버전 관리·해시·영속성·배포가 이미 있다.

## 디렉터리

```
sources/     Notion 페이지 본문에서 추출한 서술 데이터 (치수·사료·blocker·F02J·orientation)
registry/    Notion 구조화 DB 16종 추출 (Evidence / Measurement / Structure / Drawing / ...)
packages/    canonical ZIP 원본 적재 + SHA-256 대조 결과   ← GPT export 대기 중
spec/        BUILD(A/T1) 상태만으로 구성한 빌드용 spec      ← STEP07C 폐합 후
blocked/     BLOCKED / NO_MESH / VARIANT / CANDIDATE_ONLY 명시 목록
```

## 현재 상태 · 2026-08-25

| 항목 | 값 |
|---|---|
| Notion Constitution | v1.3 |
| 프로젝트 Gate | STEP07B-6 · Cistern exact file-path/hash normalization |
| STEP07B 진행 | 84% |
| Drawing Index | v0.5 · 64 views · 25/25 domains · 199/199 atomic crosswalk |
| RUN_STATE / EXECUTOR | RUN / GPT |

**STEP07C~G 는 미착수다.** 즉 빌드에 필요한 Object Contract(C), Material 분리(D),
Registry 화해(E), Build_Order(F)가 아직 존재하지 않는다.
Constitution §14: *"CMUX 의 실제 모델링은 STEP07F 까지 데이터 계약이 폐합된 뒤 수행한다."*

따라서 이 저장소는 현재 **축적·검증 단계**이며 빌드 가능한 상태가 아니다.

## 상속되는 HOLD

- **F02J numeric stations** — `REVALIDATION_REQUIRED / P0 HOLD`
- **SITE / world placement** — `BLOCKED`
- **STEP05A mixed-unit correction** — native regression PASS 전까지 canonical 3D promotion HOLD
- **Sanctuary final masonry skin** — `NO_BIND / BLOCKED_EVIDENCE`
- **성물 3종 exact form** — `DRAWING_BLOCKED_SOURCE_FORM`

## 불변 규칙

- `NO AVERAGE` — 충돌하는 사료 값을 평균내지 않는다
- source unit(규빗·피트·손바닥)이 authority, meter 는 derived
- `0.525 m/cubit` 은 primary working hypothesis이지 확정된 실측값이 아니다
- BLOCKED 치수를 도면 비례·이미지 측정으로 추정해 채우지 않는다
- 역사 사실과 renderer 파라미터를 분리한다

## 출처

Notion SSOT · first-read order:
`📌 공통 기준·워크플로우 v2` → `STEP07 Production Constitution v1.3` →
`CMUX AI Production Execution Control` → `Dashboard / Master Roadmap` →
`current Work Package / Registry` → `Library canonical artifact`
