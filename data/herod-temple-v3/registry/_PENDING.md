# 미이관 레지스트리 · 7종

**차단 사유:** Notion 워크스페이스의 **Query Data Source 사용량 한도 소진** (2026-08-25).
rate limit(30초 대기)이 아니라 워크스페이스 쿼터라 대기로 풀리지 않는다.

```
Your workspace has reached the usage limit for Query Data Source.
```

## 이관 완료 · 9/16

| Notion DB | 행 | git 파일 |
|---|---|---|
| Evidence Registry | 57 | `evidence_registry.json/.csv` |
| Measurement Registry | 200 | `measurement_registry.json/.csv` |
| Structure Registry | 28 | `structure_registry.json` |
| Drawing Registry | 78 | `drawing_registry.json/.csv` |
| Reconstruction Gates | 12 | `reconstruction_gates.json` |
| Substructure & Construction | 18 | `substructure_registry.json` |
| Circulation & Access | 25 | `circulation_registry.json` |
| Datum & Control Point | 18 | `datum_control_registry.json` |
| 3D Geometry Input | 13 | `geometry_input_registry.json` |
| **합계** | **449행** | |

## 미이관 · 7/16

| Notion DB | collection id |
|---|---|
| Masonry, Material & Surface | `12092486-0975-4277-8f3f-4dd58ffd7548` |
| Construction Phase | `4c178529-2592-4964-8c4e-c24240f7e11a` |
| Architectural Profile | `543d517e-0025-41f9-8247-b36529734937` |
| 3D Data Completeness Matrix | `98b7b023-0875-4f66-bc57-ad5f3b0d4c7a` |
| Textile, Veil & Weave | `4773d020-b711-4f12-98a8-cf61e6feaa49` |
| Sacred Furnishings & Ritual Objects | `7ae07e6e-f689-4e0c-b27e-47d250deb09f` |
| Relief, Ornament & Iconography | `b21fe70d-5ab2-42e4-92ec-21c87070ff9a` |

## 재개 방법 (셋 중 하나)

1. **쿼터 회복 대기** — 다음 주기에 `SELECT * FROM "collection://<id>"` 로 이어서 이관
2. **Notion Business 플랜** — 무제한 쿼리
3. **Notion 통합 토큰으로 직접 API 호출** — MCP 쿼터와 무관.
   `tools/herod-temple-v3/sync-from-notion.mjs` 를 만들면 재동기화가 명령 한 줄이 된다.
   `SYNC.md` 의 매핑표가 그 스크립트의 입력이다. **이 방법을 권장한다.**

## 참고 · Masonry Registry 스키마 (fetch 로 확보, 행 데이터는 미확보)

스키마만으로도 빌드 스크립트가 기대할 필드를 알 수 있어 기록해 둔다.

```
Fabric (title) · Fabric ID · Category · Material · Stone/Material Type
Applicable Geometry IDs · Phase ID · Primary Source · Source URL
Evidence Grade [A|B|C|D] · Status [Locked|Candidate|Hypothesis|Unresolved]

— 관찰/역사 —
Face Finish · Margin/Boss · Joint/Bond · Mortar · Weathering
Color/Tone · Observed Size/Thickness · Microgeometry Scale

— 구현(IMPLEMENTATION_ONLY) —
PBR Roughness Guidance · PBR Metallic (number) · Specular/IOR Guidance
Sheen/Anisotropy · Shader/Texture Contract · UV/Tile Rule
Texture Resolution/LOD · Scan/Procedural Rule · Color Management Note
```

Category 선택지: `Bedrock · Ashlar · Foundation Stone · Reused Masonry · Paving ·
Mortar/Bedding · Plaster · Fill · Metal · Wood · Decorative Stone ·
Textile Fiber · Pigment/Dye · Organic/Oil`

**주목** — 스키마 자체가 Constitution §10 의 *"historical facts 와 renderer 파라미터 분리"* 를
컬럼 수준에서 구현하고 있다. 관찰 필드와 PBR 필드가 물리적으로 나뉘어 있다.
