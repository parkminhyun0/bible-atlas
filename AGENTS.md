# AGENTS.md · BibleAtlas 작업 헌장

모든 AI 에이전트와 자동화는 작업 전에 이 파일을 읽고 준수합니다. 실제 Git·CI·배포 Evidence가 대화 기억보다 우선합니다.

## 전 디바이스 동시 적용 계약

별도 지시가 없는 한 신규 UI·UX·버그 수정·상호작용은 **같은 작업과 같은 PR에서 desktop + tablet + mobile에 동시에 적용**합니다. PC 구현만으로 완료 처리하지 않습니다.

- 핵심 기능과 정보는 모든 디바이스에서 동등해야 합니다. 레이아웃은 달라도 결과는 같아야 합니다.
- mouse/keyboard와 touch/pointer-coarse 입력을 모두 지원합니다. hover-only 핵심 기능과 44px 미만 주요 터치 대상을 금지합니다.
- desktop, tablet, mobile portrait, mobile landscape에서 overflow, 가림, 모달, 노치·홈 인디케이터 안전영역을 확인합니다.
- 지도·3D는 모바일 DPR, 대형 자산, GPU·메모리·네트워크 비용을 제한하고 기능을 없애지 않는 범위에서 품질을 점진적으로 조절합니다.
- 완료 Evidence에는 자동 verifier, desktop/mobile/tablet 확인, 배포 URL과 Live SHA를 포함합니다. 자동 브라우저가 없으면 실기기 확인 전 UI 작업을 100% 완료로 선언하지 않습니다.
- 사용자 화면이 없는 데이터·문서 변경만 제외할 수 있으며 PR에 사유를 기록합니다. UI의 desktop-only/mobile-only 범위는 사용자 명시 승인이 필요합니다.

## 역사 재구성 보호

- `data/herod-temple`의 사료, 치수표, canonical spec과 A/B/C confidence를 보존합니다.
- cubit, 성전 위치 가설, 제단 위치와 R3-sensitive 가정은 사람 승인 없이 변경하지 않습니다.
- 임의 치수·좌표·성물·역사 가정을 발명하지 않습니다.

## 작업과 릴리스

1. 최신 main, 현재 브랜치·diff·관련 task/checkpoint를 확인합니다.
2. 별도 브랜치에서 최소 변경을 구현합니다.
3. 관련 verifier와 `node tools/verify-cross-device.cjs`를 실행합니다.
4. PR의 전 디바이스 Evidence 체크리스트를 실제 결과에 맞게 작성합니다.
5. 병합 후 GitHub Pages 성공과 라이브 파일 반영을 확인합니다.
6. BibleAtlas 일일 브리핑에 모델·PR·SHA·검증·배포·다음 실기기 확인을 기록합니다.

테스트·정책·역사 보호 게이트를 완료를 위해 약화하거나 우회하지 않습니다.
