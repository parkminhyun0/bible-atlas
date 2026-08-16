# BibleAtlas — 1세기 예수 사역 지형도

사용자가 제공한 `jerusalem-terrain-section-v22.html`을 기반으로 GitHub Pages에서 독립적으로 배포할 수 있도록 정리한 BibleAtlas 정적 웹앱입니다.

## 현재 기준

- 독립 저장소: `parkminhyun0/bible-atlas`
- 진입점: `index.html`
- 지도 엔진: MapLibre GL JS 4.7.1 (CDN)
- 지형 DEM: AWS/Mapzen Terrarium tiles
- 위성 배경: Esri World Imagery
- OSM 도로·지명 레이어: OpenStreetMap raster tiles (기본 OFF)
- 별도 서버/API 키/DB 없이 브라우저에서 실행되는 정적 앱
- `<성경 마인드맵>`과의 런타임 연결·딥링크·동기화는 현재 하지 않음

## 원본 보존 원칙

업로드된 단일 HTML의 CSS/JavaScript를 유지보수가 가능한 정적 파일로 분리했습니다. 역사·고고학 좌표, 사역 경로, 분봉왕 영역, 건축 재구성 데이터는 이 분리 작업에서 새로 재해석하거나 임의 수정하지 않았습니다.

배포 화면의 문서 제목은 업로드 파일명에 맞춰 `v22`로 정규화했습니다. 원본 내부에 남아 있던 과거 버전 주석(`v10` 등)은 변경 이력의 일부로 유지될 수 있습니다.

## 주요 기능

- MapLibre 기반 3D terrain
- Terrarium DEM을 이용한 고도 샘플링
- 해안→예루살렘→요단→베레아 등 고도 단면
- 사용자가 직접 그리는 단면 경로
- 예수님 사역 경로·포인트
- 세례 요한 사역 경로·포인트
- 분봉왕 행정구역 개별 토글·불투명도
- 1세기 육로 회랑
- 주요 지명 및 A/B/C 고증 등급 HUD
- 헤롯 성전산·안토니아·헤롯 궁전·성벽 등 3D 재구성
- 선택형 OSM 도로·현대 지명 오버레이

## GitHub Pages

`.github/workflows/pages.yml`은 `main`에 변경이 들어오면 정적 파일 전체를 GitHub Pages에 배포하도록 구성되어 있습니다.

저장소의 **Settings → Pages → Build and deployment → Source**가 **GitHub Actions**여야 합니다.

## 로컬 확인

```bash
python3 -m http.server 8765
```

브라우저에서 `http://localhost:8765/`를 엽니다.

## 파일 구조

```text
.
├── index.html
├── styles.css
├── scripts/
│   ├── 00-env.js
│   ├── 10-app.js
│   ├── 20-profile.js
│   ├── 21-routes.js
│   ├── 22-view.js
│   ├── 23-sites.js
│   ├── 24-keyplaces.js
│   ├── 25-pilgrim.js
│   ├── 26-territories.js
│   ├── 27-ministry.js
│   ├── 28-buildings.js
│   └── 29-ui.js
├── .nojekyll
├── .github/workflows/pages.yml
├── README.md
└── ATTRIBUTION.md
```

## 배포 전/후 검증 항목

- MapLibre CSS/JS CDN 로드
- Esri 위성 타일 로드
- Terrarium DEM 로드 및 3D 지형 표시
- 고도 단면 샘플링 및 확대/이동
- 직접 그리기
- OSM 레이어 ON/OFF 및 opacity 조절
- 분봉왕 영역 토글/불투명도
- 예수님·세례 요한 사역선/포인트
- 포인트 HUD와 A/B/C 고증 등급 표시
- 헤롯 성전/건축 레이어
- 모바일/태블릿/데스크톱 UI

## 알려진 운영 주의

- 외부 지도/타일/CDN 서비스는 각 서비스의 이용정책과 가용성에 영향을 받습니다.
- OpenStreetMap의 공개 `tile.openstreetmap.org` 서버는 운영용 무제한 CDN으로 사용하지 않습니다. 현재 앱에서는 OSM 오버레이가 기본 OFF이며, 정식 서비스 확대 전 OSM-derived vector tile/PMTiles 또는 별도 타일 공급 구조를 검토합니다.
- 이 저장소 분리·배포 작업은 HTML에 포함된 역사·고고학 좌표/설명을 새로 학술 검증한 작업은 아닙니다.
- BibleAtlas의 기존 대규모 canonical 장소 데이터 파이프라인(`~/bibleatlas-data`)을 이 웹앱에 통합하는 작업은 별도 단계입니다.
