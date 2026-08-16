# Attribution / External Data

BibleAtlas prototype currently references the following external services/data in `index.html`.

- MapLibre GL JS — browser map rendering library.
- OpenStreetMap — optional road/place raster overlay. Map display must retain `© OpenStreetMap contributors` attribution.
- AWS / Mapzen Terrarium elevation tiles — DEM used for terrain rendering and elevation profile sampling.
- Esri World Imagery — satellite imagery background referenced by the prototype.
- Google Fonts — Noto Serif KR / Noto Sans KR web fonts.
- OpenMapTiles font endpoint — glyph endpoint referenced by the MapLibre style.

Before production-scale public release, re-check each provider's current usage/licensing/attribution requirements and replace prototype tile endpoints where necessary.
