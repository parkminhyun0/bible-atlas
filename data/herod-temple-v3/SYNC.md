# V3 · Notion ↔ git 동기화 계약

## 방향 규칙 (중요)

```
Notion = 저작 · 거버넌스        (authoring / governance)
git    = 발행된 스냅샷          (published snapshot)
방향   = Notion → git 단방향
```

- **git 쪽 `registry/` 파일을 손으로 고치지 않는다.** 값을 고칠 일이 있으면 Notion 에서 고치고 다시 내린다.
- 손으로 고치는 순간 진실이 두 곳이 되고, Constitution v1.3 §0A 가 막으려던 surface drift 가 시스템 경계를 넘어 재발한다.
- 예외: `sources/*.md`, `FIREWALL.md`, `README.md`, 이 파일은 git 에서 저작한다 (Notion 원본이 없는 파생 문서).

## Notion 원본 · data source 매핑

허브: `🗄️ SSOT Registries · Evidence / Measurement / Geometry`
(`https://app.notion.com/p/3c60b963e600812080a9f6ba96a0a90a`)

| # | Notion DB | collection id | git 파일 | 상태 |
|---|---|---|---|---|
| 1 | Evidence Registry | `d0f66314-6df5-4d09-9af7-d0011323f175` | `registry/evidence_registry.json/.csv` | ✅ 57행 |
| 2 | Measurement Registry | `b4dc7879-072f-4aa8-8a4d-716ced0bd781` | `registry/measurement_registry.json/.csv` | ✅ 200행 |
| 3 | Structure Registry | `bf4a1e1e-a10d-4002-a568-0c5e7c2dab52` | `registry/structure_registry.json` | ✅ 28행 |
| 4 | Drawing Registry | `5805f5c2-3d04-4073-85b4-6f690e104a56` | `registry/drawing_registry.json` | ☐ |
| 5 | Reconstruction Gates | `790af98b-5e0d-443a-9e11-0f21172c9a6d` | `registry/reconstruction_gates.json` | ☐ |
| 6 | Substructure & Construction | `d2c5bc3c-276f-4878-a56d-cce6dbe8dedc` | `registry/substructure_registry.json` | ✅ 18행 |
| 7 | Circulation & Access | `e9a56425-4cc5-4b20-b217-ad406854b659` | `registry/circulation_registry.json` | ☐ |
| 8 | Datum & Control Point | `2de78169-eee0-4525-82bd-58d0f99a0041` | `registry/datum_control_registry.json` | ✅ 18행 |
| 9 | 3D Geometry Input | `d42535ab-566b-4744-88ef-d665c2a3ac4c` | `registry/geometry_input_registry.json` | ✅ 13행 |
| 10 | Masonry, Material & Surface | `12092486-0975-4277-8f3f-4dd58ffd7548` | `registry/masonry_material_registry.json` | ☐ |
| 11 | Construction Phase | `4c178529-2592-4964-8c4e-c24240f7e11a` | `registry/construction_phase_registry.json` | ☐ |
| 12 | Architectural Profile | `543d517e-0025-41f9-8247-b36529734937` | `registry/architectural_profile_registry.json` | ☐ |
| 13 | 3D Data Completeness Matrix | `98b7b023-0875-4f66-bc57-ad5f3b0d4c7a` | `registry/data_completeness_matrix.json` | ☐ |
| 14 | Textile, Veil & Weave | `4773d020-b711-4f12-98a8-cf61e6feaa49` | `registry/textile_registry.json` | ☐ |
| 15 | Sacred Furnishings & Ritual Objects | `7ae07e6e-f689-4e0c-b27e-47d250deb09f` | `registry/sacred_furnishings_registry.json` | ☐ |
| 16 | Relief, Ornament & Iconography | `b21fe70d-5ab2-42e4-92ec-21c87070ff9a` | `registry/relief_ornament_registry.json` | ☐ |

부속: `작업 이력 · Daily Work Log` = `ce0cba77-e824-4f83-aced-0de1330b6894` (history, 이관 대상 아님)

## 서술 문서 출처

| git 파일 | Notion 출처 |
|---|---|
| `sources/dimensions.md` | Dashboard · Master Roadmap · STEP07B Work Package |
| `sources/f02j.md` | CMUX Control §8 · Roadmap P0 override · STEP07B WP · SSOT Measurement update |
| `sources/orientation_lock.md` | CMUX Control §18B · STEP07B WP §9 |
| `packages/INDEX.md` | CMUX Control · STEP07B WP 전반의 package SHA 기록 |

## 재동기화 방법

현재는 **수작업**이다. Notion MCP 로 각 collection 을 `SELECT *` 하고 JSON/CSV 로 변환했다.
200행 초과 시 `LIMIT 100 OFFSET n` 페이지네이션이 필요하다 (Measurement 가 그 경우).

**개선 예정** — Notion 통합 토큰을 발급받아 `tools/herod-temple-v3/sync-from-notion.mjs` 를 만들면
재동기화가 명령 한 줄이 된다. 그때까지는 이 표가 매핑의 SSOT 다.

수작업 이관은 전사 오류 위험이 있다. `id` / `url` / `createdTime` 같은 Notion 내부 필드는
일부 파일에서 생략했으므로, 행 대조가 필요하면 `Measurement ID` · `Structure ID` ·
`Evidence ID` · `Geometry ID` · `Element ID` · `Datum ID` 를 키로 쓴다.

## 스냅샷 시각

모든 이관은 **2026-08-25** 기준 fresh-read 다.
당시 합의 Gate = `STEP07B-6` · STEP07B `84%` · Drawing Index `v0.5 · 64 views`.

## 알려진 결함

- **ID 표기 분기 18건** — `ALTAR_MID` ↔ `ALTAR-MID`, `ALTAR_RAMP` ↔ `ALTAR-RAMP`,
  `SANCT_HEIGHT` ↔ `SANCT-HEIGHT` 등. Measurement 와 Structure 가 같은 대상을 다르게 부른다.
  자동 조인이 끊긴다. **Notion 쪽 통일이 필요하며 git 에서 고치지 않는다** (단방향 규칙).
- **cross-registry 참조 159건** — Measurement 의 `Structure ID` 중 상당수가 Substructure /
  Textile / Sacred Furnishings 등 다른 레지스트리 소속이다. 16종이 모두 이관되면 재검증한다.
