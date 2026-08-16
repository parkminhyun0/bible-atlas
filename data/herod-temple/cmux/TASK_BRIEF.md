# CMUX TASK BRIEF — 헤롯 성전 3D 구현 (bible-atlas)

- 대상 저장소: `bible-atlas` (CesiumJS 3D 지형 뷰어, GitHub Pages)
- 파이프라인 역할: **0-lead 자비스(Claude Code)** 계획·분할·통합 / **1-run Codex CLI** 구현 / **2-review agy(Antigravity)** 검증. 구현 모델은 자가 검증하지 않는다(ROLES.md 원칙). 상태는 `.pipeline/`에 기록.
- 입력: 이 패키지 전체를 `bible-atlas/data/herod-temple/` 로 복사한다.

## 0. 완료 정의 (Definition of Done)

1. `public/models/herod-temple/temple.glb` (LOD2, 압축 Draco/meshopt) + `temple_lod0.glb`(성전산 매싱)가 GitHub Pages에 배포되고, 예루살렘 3D 뷰어에서 **바위 돔 위치**에 정확한 스케일·방위(축 E-W, 스큐 4.2°)로 표시된다.
2. `verify.js` 계열 기하 검증(미돗 4:6 100 합산, 4:7 100·70 합산, 5:1 187 합산, 여인의 뜰 135, 번제단 32, 왕실 규빗 0.525)이 통과한다.
3. Playwright 회귀 스크린샷 4장(항공·남측·성역·성소 정면, 정오 태양) 저장 및 diff 통과.
4. 이론적으로 민감한 항목(성전 위치가설, 제단 위치, 규빗) 변경은 **R3 게이트(사람 승인)**. 자동 병합 금지.

## 1. Phase 계획

### Phase 0 — 자산 확보 (1-run)
- `git subtree add --prefix vendor/3d-temple-mount https://github.com/openbibleinfo/3D-Temple-Mount main --squash` (MIT). LICENSE.md 보존.
- `node vendor/3d-temple-mount/util/verify.js` 실행 → 통과 로그를 `.pipeline/phase0.log`에 저장.
- `src/40-data.js`의 상수와 `data/herod-temple/spec/temple_spec.json`을 **대조표**로 만든다(`.pipeline/dim-diff.md`). 불일치 항목은 0-lead에 보고(값 수정 금지).

### Phase 1 — glTF 익스포터 (1-run)
- `vendor/.../src/30-geom.js`의 지오메트리 빌더는 브라우저 비의존(verify.js가 vm에서 실행). 이를 이용해 `tools/export-gltf.mjs`를 작성: 빌더가 만든 정점 버퍼·47 드로우 그룹을 그룹별 메쉬로 나눠 glTF 2.0(.glb)로 직렬화. 머티리얼은 `spec.materials`의 hex/roughness/metallic을 PBR metallicRoughness로 매핑.
- 좌표 변환: 저장소 월드 미터 프레임 → glTF(Y-up). 문서화된 두 좌표계는 `vendor/.../AGENTS.md` 참조.
- 산출: `temple_lod0.glb`(지형·옹벽·안토니아·주랑 매싱), `temple.glb`(성역·성소 포함 LOD2), 각 5 MB 이하 목표. `gltf-validator` 통과.
- 대안(익스포터 난항 시): `spec/primitives_boxes.json`을 Three.js로 읽어 박스 매싱 → GLTFExporter. 이 경로는 LOD1까지만.

### Phase 2 — Cesium 배치 (1-run)
- 앵커: 바위 돔 중심 ≈ 31.7780° N, 35.2354° E (사크라 바위 정점). **성소 지성소 중심**을 이 점에 두고, 축은 진동(E) 기준. 높이는 Cesium World Terrain 표고 + 이방인의 뜰 레벨(z=0)을 아자라 기준으로 역산(`levels_m`).
- `Cesium.Model.fromGltfAsync({url, modelMatrix: Transforms.headingPitchRollToFixedFrame(...)})`; heading = 성역 축 방위 + 4.2° 스큐 보정(스큐는 옛 정방형이 헤롯 외벽에 대해 갖는 각. 성역 축은 정방형에 평행 → 외벽 대비 4.2°). 정확한 부호는 리트마이어 도면과 대조.
- 시간 슬라이더(기존 태양 시뮬레이션)와 그림자 캐스팅 활성화, 금속 표면은 `imageBasedLighting` 켜기.
- 카메라 프리셋 4개 + 정보 패널(각 요소 클릭 시 `source`, `confidence` 표시 — spec JSON에서 읽음).

### Phase 3 — 머티리얼/실사화 (1-run, 2-review 감수)
- 텍스처는 저장소 내 절차적 생성(vendor `20-textures.js` 캔버스 텍스처를 PNG로 굽기: 드래프트 마진 애슐러·대리석·금판·청동·삼나무·테라코타·휘장). 외부 사진 텍스처 사용 금지(라이선스).
- 노멀맵: 애슐러 조인트·마진. AO는 vendor 방식(정점 베이크)을 텍스처로 옮기거나 Cesium 기본 사용.
- 색·재질 값은 `spec.materials`가 SSOT.

### Phase 4 — 검증 (2-review)
- `verify.js` + 자체 검증 스크립트 `tools/verify-spec.mjs`: spec JSON 합산 규칙(아래) 통과.
- Playwright: 4 시점 스크린샷 → `tests/herod-temple/__snapshots__/`. 임계 0.5%.
- 리뷰 체크리스트: (a) 스케일—왕의 주랑 길이 ≈ 남벽 280 m인가, 성소 높이 ≈52.5 m인가; (b) 방위—수산문이 성소 축선상에 있는가; (c) 라이선스 파일 포함; (d) 성능—모바일 60fps 근접, glb 총량 ≤ 12 MB.

## 2. 검증 규칙 (verify-spec.mjs에 구현)

```
Middot 4:6  : 6+40+(1+2+1+1)+40+(1+2+1+1)+3+1 == 100
Middot 4:7  : 5+11+6+40+1+20+6+6+5 == 100 ; 5+3+5+6+6+20+6+6+5+3+5 == 70
Middot 5:1  : 11+11+32+22+100+11 == 187
Middot 5:2  : 62+8+24+4+4+8 <= 135 (나머지 ≥ 0)
Middot 2:5  : court_of_women == 135×135 ; 4 chambers 40×40 inside
Middot 3:1  : altar 32×32, height 10 ; ramp 32×16 south
Ritmeyer    : 500 × cubit_m ≈ 262.5 (±0.5) ; walls W>E>N>S
Sanctuary   : front width 100 == 2×15 + 70
```

## 3. 에이전트별 지시 (한국어, ROLES.md 형식)

**0-lead(자비스)**: 위 Phase를 `.pipeline/RESUME.json` 체크포인트로 분할하라. 각 Phase 종료 시 산출 파일 경로·해시를 기록. 규빗·위치가설·제단 위치 변경 요청은 사람에게 에스컬레이션(R3). Notion 대시보드에 Phase 상태 동기화.

**1-run(Codex)**: 값을 발명하지 마라. 모든 치수는 `spec/temple_spec.json` 또는 vendor `40-data.js`에서 읽고, 둘이 다르면 `.pipeline/dim-diff.md`에 적고 spec 값을 쓴다. 외부 상용 3D 모델·사진 텍스처 다운로드 금지. 각 산출물에 `SOURCE:` 주석으로 사료 절 번호를 남긴다.

**2-review(agy)**: 렌더 결과를 보지 말고 먼저 숫자를 본다 — verify 스크립트 로그, glb 바운딩 박스(성소 52.5×52.5×~36.75 m 전후, 성전산 ≈485×315 m). 그 다음 Playwright 스크린샷으로 방위·스케일·재질을 확인. 실패 시 원인 파일 경로와 재현 명령을 적어 1-run에 반환.

## 4. 열린 결정 (사람이 정할 것)

1. 규빗 0.525(기본) vs 0.4445 — 성전산 실측과 맞추려면 0.525.
2. 성소 후면 폭 70(미돗, 기본) vs 60(요세푸스).
3. 헤칼 문 20×10(미돗, 기본) vs 55×16(요세푸스).
4. 여인의 뜰 회랑(gallery) 표현 여부(AD 30 시점에는 존재; 미돗 2:5 "나중에 둘러쌌다").
5. 도시 가옥·감람산 둑길 포함 여부(vendor 저장소는 가옥 미표시, 둑길 표시).
