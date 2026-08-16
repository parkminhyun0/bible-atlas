# 헤롯 성전(1세기 예루살렘 성전) — 3D 모델링 소스 패키지 v0.1

> 목적: CMUX 3-에이전트 파이프라인(0-lead 자비스 / 1-run Codex / 2-review agy)이 **bible-atlas**(CesiumJS)에 헤롯 성전·성전산 3D 모델을 구현할 수 있도록, 사료 기반 치수·도면·머티리얼·작업 지시서를 한 곳에 모은 것.

## 솔직한 전제 (읽고 시작할 것)

1. **이 패키지는 "실사 이미지"가 아니라 "실사 3D를 만들기 위한 설계 소스"다.** 저(Claude 채팅)는 사진급 렌더링 이미지를 생성할 수 없다. 실사화는 3D 모델(glTF) + PBR 머티리얼 + 조명(Cesium 태양/대기)이 담당한다. 이 패키지가 그 입력값이다.
2. **성전 건물 자체의 고고학적 유구는 없다.** 하람 알샤리프 아래는 발굴된 적이 없다. 따라서 내부 성역(뜰·번제단·성소)은 **미쉬나 『미돗(Middot)』 + 요세푸스**의 텍스트 재구성이고, 외곽 옹벽·문·계단·주랑은 워렌(1867–70)·B. 마자르(1968–78)·벤도브·라이히 발굴과 리트마이어(L. Ritmeyer) 재구성에 근거한다. 각 요소에 **신뢰도 등급(A/B/C)** 을 붙였다(`spec/temple_spec.json → confidence`).
3. **규빗 값**은 리트마이어의 왕실 규빗 **0.525 m**를 기본으로 채택(500규빗 = 262.5 m가 성전산 실측과 맞음). 할라카적 규빗 0.4445 m를 쓰면 성역 전체가 약 15% 작아진다. JSON의 `units.cubit_m` 하나만 바꾸면 전체가 재계산되도록 설계했다.

## 파일 구성

```
README.md                          ← 이 문서
01_사료_및_참고자료.md               ← 1차 사료 절 번호, 2차 문헌, 웹/오픈소스 3D 자산 목록(라이선스 포함)
02_치수표.md                       ← 규빗/미터 치수 총표 + 사료 충돌 항목
spec/temple_spec.json              ← 단일 진실 소스(SSOT): 좌표계, 레벨, 평면 박스, 높이, 외곽 성전산, 머티리얼, 신뢰도, LOD 계획
spec/primitives_boxes.json         ← spec에서 파생된 LOD2 매싱 박스 리스트(미터) — Three.js/Blender/Cesium 로더용
drawings/01_plan_inner_precinct.svg/.png        ← 내부 성역 평면도(규빗, 치수선)
drawings/02_elevation_sanctuary_east.svg/.png   ← 성소 동측 입면(울람 정면 100×100)
drawings/03_section_ew_sanctuary_levels.svg/.png ← 동서 단면 + 뜰 레벨 누적
drawings/04_plan_temple_mount_schematic.svg     ← 성전산 전체 개략 배치(미터)
tools/generate_drawings.py         ← spec 데이터로부터 도면·JSON을 재생성(치수 수정 시 재실행)
tools/spec_to_boxes.py             ← spec → 박스 프리미티브 변환기
cmux/TASK_BRIEF.md                 ← CMUX 0-lead용 작업 지시서(단계·역할·검증·완료조건)
```

## 가장 중요한 외부 자산 (먼저 확보할 것)

- **openbibleinfo/3D-Temple-Mount** (GitHub, MIT, 2026-07/08): 라이브러리 없는 WebGL2 자체 렌더러로 만든 성전산 전체 재구성. `src/40-data.js`에 미돗·요세푸스 치수 상수가, `util/verify.js`에 약 30개 기하 검증이 들어 있다. 규빗 0.525 m, 리트마이어 500규빗 정방형·4.2° 스큐를 채택 — **본 패키지와 좌표 가정이 일치**한다. 이 저장소를 fork하여 지오메트리 빌더(`30-geom.js`, `50/55-build-*.js`)를 glTF 익스포터에 연결하는 것이 가장 빠른 경로다(TASK_BRIEF Phase 1 참조).
- **Ritmeyer Archaeological Design** 도면(유료 이미지 라이브러리) — 최종 검증용 참조. 저작권 있으므로 텍스처/이미지 재배포 금지, 치수 참조만.

## 워크플로 요약

1. `spec/temple_spec.json`을 SSOT로 저장소에 커밋 → 2. openbibleinfo 저장소를 vendor/ 하위에 fork → 3. 지오메트리를 glTF(.glb)로 내보내는 노드 스크립트 작성 → 4. bible-atlas CesiumJS 씬에 `Cesium.Model.fromGltfAsync`로 배치(성소 = 바위 돔 위치, 축 E-W, 스큐 4.2°) → 5. PBR 머티리얼(석회암·금박·청동)·태양/그림자 활성화 → 6. Playwright 스크린샷 회귀 + verify.js 기하 검증.

## 버전
- v0.1.0 (2026-08-17) 초안. 성역 내부는 미돗 전체 치수 반영, 외곽은 개략치. 다음 버전에서 (a) 성전산 실측 GeoJSON 벽선, (b) 뜰 문 13/7개 위치, (c) 왕의 주랑 기둥 간격 산정을 추가할 것.
