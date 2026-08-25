# Canonical Package Index · SHA-256 대조표

Notion 에 기록된 canonical package 목록과 그 SHA-256.
**현재 이 디렉터리에는 실물 ZIP 이 하나도 없다.** GPT export 대기 중.

Constitution v1.3 §5: canonical package = `ZIP + MANIFEST.json + SHA-256 + Library canonical path`
Notion 본문에는 package id / path / SHA / verdict / Gate 만 기록하고 대용량 data 는 복제하지 않는다(§5).
따라서 아래 SHA 에 대응하는 payload 는 Notion 밖에 있으며, 이 저장소가 그 보관처가 된다.

---

## STEP07B · Final Drawing Package

| package | SHA-256 | 적재 |
|---|---|---|
| `Drawing_Index_v0_5` (64 views) | `735d8273a6dd6ca34e33e9a4fff8a97646d0ec4b10f9210ca53560816af0369e` | ☐ |
| `STEP07B5-RELIEF-MOULDING-ORNAMENT-AUTHORITY v0.1` | `120c99cbbf46db5eba9853a202950fe668a5f4391b330a3609e5d52dfccaae32` | ☐ |
| `Drawing_Index_v0_4` (60 views) | `594a45c70b79d387aad7a960b79572674635663a52c8857942e2a0759aa160f7` | ☐ |
| `STEP07B4-OUTER-PORTICO-FINAL-DRAWING-v0.1` | `5b74e497608d50c129ec41ec1fe891e3a3121c9816aff0b80548b2c155b65325` | ☐ |
| `Drawing_Index_v0_3` (56 views) | `edda9dbf23fb09a79025511644f7db473717c0ccf154ed8f00c2d7dd7627f2d8` | ☐ |
| `STEP07B3-ROYAL-STOA-FINAL-DRAWING-v0.1` | `863a1cc4650ac0a035e944e5953896dc48cb289b2ac668b951b56341d0c60264` | ☐ |
| `STEP07B-MACRO-ORIENTATION-LOCK-v0.1` | `0e5677f5bf498dac7416b041d844062cfbcc06cf5db78c972cfa7295e9176861` | ☐ |
| `STEP07B2-SANCTUARY-HERO-DETAIL-v0.1` | `23e5f8938bd87c669347b4a082dfbe2575c286f73ad944540163ca4e1080ee13` | ☐ |
| `STEP07B-DRAWING-INDEX-v0.2` (48 views) | `79d00533eaa1a4ca68ff8ac554eeafcae612b0ebaad851bd0c6992a674388e39` | ☐ |
| `STEP07B-DRAWING-INDEX-v0.1` (24 views) | `107610610ae6e39f827c3c61938ce97293781da48672ce193bb234a86adbc41f` | ☐ |

fingerprint 도 함께 기록된 항목:
- v0.1 `af71c668da6013bee8b04266a88416dbcced0d487a8be185d83fd838ac4399b8`
- v0.2 `e76f7fee4c300e3de7501afe15f3f1d865e4be9673d98103be1ac8fc5b9c65c2`
- B2 `9078872723760ef8396b0f4d727a17c2a8bb8155cf43acc182302d796c83da75`

## STEP07A · Data Completeness Audit

| package | SHA-256 | 적재 |
|---|---|---|
| `STEP07A_Closure_Audit_v0_1` | `7de14bd1c3ec6d78fbd4c3adfe2c471bc6e80c115750911eced1a6a5f6859c97` | ☐ |
| `STEP07A-DETACHED-ATOMIC-v0.1` | `c69f4c6a62439e92f8d6c6241018a2a0181f96eb95fdf1d6fecb1de8cf87e986` | ☐ |
| `v0_3_Runtime_Hardened_Kit` | `bda9626851018cd0519bc2a1875b3804c1456ea6df9bb357f925a1dbf32b3175` | ☐ |

fingerprint:
- closure `15413a2da7b9b2b6ffa22c73c73ffae3a907700afa983ba8732d68c4f4efe7d1`
- detached `779ff0a38eb9bf82cc38c16c5f5ee25fe79464a8a30d364885ccae287eda5c91`
- runtime kit `de755a382b4faece96acb8bcb0f9eb80c02f446f7732e33d55ff52911d996a61`

## Correctness Audit (native lane)

| package | SHA-256 | 적재 |
|---|---|---|
| `CMUX_04QA_Native_Correctness_Handoff_v0_1` | `cb5637d7a1a07d1a4e6734bb5592020855a894b781ee048b74323546c8b4058f` | ☐ |
| native regression v0.5 | `8b303bf37a3b8fcd38c7e5e68af004e8c31b80f01bc444bb31542f3e66321a9c` | ☐ |
| audit supplement v0.6 | `79caf28bfb5060f72192860421ebf1abf46cf0ebd8d9127260d0aa0597bc6abb` | ☐ |

---

## STEP07A 상태 집계 (detached 171)

```
BUILD             3
GUIDE            60
VARIANT           2
CANDIDATE_ONLY    5
NO_MESH          32
BLOCKED          69
────────────────────
                171
```

atomic master index `199` = hero/final-target `28` + detached `171`
carry-forward gap `13` (P0 `9` / P1 `4`) · closure invariant `12/12 PASS`

## 적재 절차

1. GPT 에서 package export
2. SHA-256 대조 — 일치분만 `packages/` 에 원본 그대로 적재
3. 불일치·누락은 `MANIFEST.json` 에 `MISMATCH` / `MISSING` 으로 기록
4. `registry/` 추출 시 199 atomic ID 와 state 를 **그대로 상속**. 새 ID 체계 생성 금지
