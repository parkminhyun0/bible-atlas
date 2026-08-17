# assets/herod-temple/ad30 — 출처와 라이선스

## lod1.glb
- **지오메트리**: openbibleinfo/3D-Temple-Mount — **MIT License**
  Copyright (c) 2026 OpenBible.info. 전문은 vendor/3d-temple-mount/LICENSE.md.
- **변환**: bible-atlas `tools/herod-temple/export-glb.cjs`
  (레이어 base·roofs·sanct·interior 만, 정점 AO 를 COLOR_0 으로 옮김)
- **재질 값**: data/herod-temple/spec/temple_spec.json 의 materials 표에 따름.
  외부 사진 텍스처를 쓰지 않았다 — 현재 모델에는 텍스처 이미지가 없다.

## 세계좌표 정합
- `tools/herod-temple/solve-alignment.cjs` 산출 → data/herod-temple/spec/world_alignment.json
- 앵커 좌표 출처: OpenStreetMap (ODbL). **지도 정렬 보조로만** 쓴다 —
  학술 근거가 아니다(기획서 §3.3).

## 재구성 근거
미쉬나 『미돗』, 요세푸스 『유대 전쟁사』·『유대 고대사』, 리트마이어 재구성,
워렌·B.마자르·벤도브 발굴. 성전 건물 자체는 발굴된 적이 없다.

## 쓰지 않은 것
- BYU 『The Virtual New Testament』 등 저작권 있는 렌더·도면의 이미지·텍스처
- 상용 3D 모델
- AI 생성 지오메트리
