# vendor/3d-temple-mount

헤롯 성전산 3D 지오메트리 빌더 — openbibleinfo/3D-Temple-Mount 에서 가져왔다.

- 출처: https://github.com/openbibleinfo/3D-Temple-Mount
- 라이선스: MIT (LICENSE.md 원문 보존)
- 가져온 커밋: `$(cat UPSTREAM.txt)` → UPSTREAM.txt 참조
- 가져온 범위: 지오메트리 빌더(src/10~55)와 상류 검증기(util/verify.js)만.
  렌더러(60-gl.js)·앱(70-app.js)·셸(01-shell.html)은 우리가 Cesium 을 쓰므로 제외했다.

## 왜 그대로 두는가
치수를 우리가 손대면 상류 검증기(util/verify.js, 약 30개 기하 검증)가 무의미해진다.
그래서 이 폴더는 **읽기 전용**으로 취급한다. 수정이 필요하면 상류에 반영하거나
우리 쪽 spec 에서 덮어쓴다.

## 쓰는 법
    node vendor/3d-temple-mount/util/verify.js     # 상류 기하 검증
    node tools/herod-temple/export-glb.cjs         # GLB 로 변환

## 이 재구성이 무엇인지
상류 프로젝트도 하나의 재구성안이다(미돗·요세푸스·리트마이어 기반, 규빗 0.525 m,
500규빗 정방형과 4.2° 스큐 채택). 정답 모델이 아니라 출발점으로 쓴다.
요소별 채택·수정·기각 판단은 우리 Evidence Registry 에 남긴다.
