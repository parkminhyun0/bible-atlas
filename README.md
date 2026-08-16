# BibleAtlas — 1세기 예수 사역 지형도

GitHub Pages에서 바로 게시할 수 있도록 정리한 BibleAtlas 독립 정적 웹앱 패키지입니다.

## 현재 기준

- 진입점: `index.html`
- 원본 보관: `archive/jerusalem-terrain-section-v22.html`
- 지도 엔진: MapLibre GL JS 4.7.1 (CDN)
- 지형 DEM: AWS/Mapzen Terrarium tiles
- 위성 배경: Esri World Imagery
- OSM 도로·지명 레이어: OpenStreetMap raster tiles (기본 OFF)
- 별도 서버/API 키/DB 없이 브라우저에서 실행되는 정적 앱
- `<성경 마인드맵>`과의 런타임 연결은 현재 하지 않음

## GitHub Pages 배포

1. 독립 GitHub 저장소(권장 이름: `bible-atlas`)를 만든다.
2. 이 폴더의 파일 전체를 저장소 `main` 브랜치 루트에 올린다.
3. GitHub 저장소의 **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 선택한다.
4. `.github/workflows/pages.yml`의 배포가 성공하면 Pages URL에서 앱을 연다.

## 로컬 확인

```bash
python3 -m http.server 8765
```

그 다음 브라우저에서 `http://localhost:8765/`를 연다.

## 배포 전/후 확인 항목

- MapLibre CSS/JS CDN 로드
- Esri 위성 타일 로드
- Terrarium DEM 로드 및 3D 지형 표시
- 고도 단면 샘플링
- OSM 레이어 ON/OFF 및 opacity 조절
- 분봉왕 영역 토글/불투명도
- 예수님·세례 요한 사역선/포인트
- 포인트 HUD와 A/B/C 고증 등급 표시
- 모바일/태블릿/데스크톱 UI

## 알려진 점검 사항

- 업로드 파일명은 `v22`이지만 HTML `<title>` 및 일부 내부 주석에는 `v10` 표기가 남아 있습니다. 기능 변경 없이 원본을 보존하기 위해 이번 패키지에서는 그대로 유지했습니다.
- 외부 지도/타일/CDN 서비스는 각 서비스의 이용정책과 가용성에 영향을 받습니다.
- OpenStreetMap의 공개 `tile.openstreetmap.org` 서버는 운영용 무제한 CDN이 아닙니다. 현재 파일에서는 OSM 오버레이가 기본 OFF이지만, 정식 서비스 확대 전에는 교체 가능한 OSM-derived tile/vector provider 또는 자체 타일 구조를 검토해야 합니다.
- 이 패키징 작업은 HTML에 포함된 역사·고고학 좌표/설명 자체를 학술적으로 재검증한 작업은 아닙니다.

## 파일 구조

```text
.
├── index.html
├── archive/
│   └── jerusalem-terrain-section-v22.html
├── .nojekyll
├── .github/
│   └── workflows/
│       └── pages.yml
├── README.md
└── ATTRIBUTION.md
```
