# Attribution / External Data

BibleAtlas prototype currently references the following external services/data in `index.html`.

- MapLibre GL JS — browser map rendering library.
- OpenStreetMap — optional road/place raster overlay. Map display must retain `© OpenStreetMap contributors` attribution.
- AWS / Mapzen Terrarium elevation tiles — DEM used for terrain rendering and elevation profile sampling.
- Esri World Imagery — satellite imagery background referenced by the prototype.
- Google Fonts — Noto Serif KR / Noto Sans KR web fonts.
- OpenMapTiles font endpoint — glyph endpoint referenced by the MapLibre style.

Before production-scale public release, re-check each provider's current usage/licensing/attribution requirements and replace prototype tile endpoints where necessary.

## 고대 지명 전거 (2026-08-16 추가)

핵심 지명 47곳의 좌표를 **Pleiades** 고대 지명 gazetteer와 대조하고, 각 지점에
Pleiades 항목 ID(`pid`)를 연결했습니다. 지도에서 지명을 클릭하면 해당 항목으로
바로 이동합니다.

- Pleiades: https://pleiades.stoa.org/ — CC BY 3.0
  (Roger Bagnall et al., *Pleiades: A Gazetteer of Past Places*)
- 대조 방법: 각 좌표 반경 15km 내 Pleiades 지점을 검색해 고대 지명(라틴·그리스어)
  별칭이 일치하는 항목을 선택. 47곳 전부 매칭됐고 대부분 1km 이내로 일치했습니다.
- 좌표 차이가 2km를 넘는 곳: 아리마대(2.6km) · 살렘(2.6km) · 가사(2.5km) ·
  브엘세바(4.8km). 앞의 셋은 비정 논쟁지이고, 브엘세바는 현대 도시와 고대 텔의
  거리 차입니다.

## 태양 위치 계산

조명·하늘색은 NOAA Solar Position Algorithm으로 계산한 실제 태양 방위·고도를
사용합니다(`scripts/05-sun.js`). 외부 라이브러리를 쓰지 않으며, 하지·동지·춘분
정오 고도를 이론값과 대조해 오차 0.02° 이내를 확인했습니다.
