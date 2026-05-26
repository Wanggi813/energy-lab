# 선수 성장 연구소 — 물리 교육 게임

## 프로젝트 개요

스포츠 현장을 배경으로 고등학교 물리 **에너지 단원**을 체험하는 교육용 게임.
"에너지 실험을 통해 선수를 계발한다. 4개 구역에서 에너지 전환 실험에 참여하며 물리 법칙을 직접 체험하라."

참고 사이트 스타일: https://phy-simul.com/muligo/index.html

---

## 기술 스택

- 순수 HTML + CSS + JavaScript (프레임워크 없음)
- Three.js (CDN) — mission1, mission3 3D 씬
- 외부 라이브러리 없음 (폰트만 Pretendard CDN)

---

## 폴더 구조

```
muligo2/
├── CLAUDE.md
├── index.html                  # 메인 로비 (구역 이동 + 미션 진입)
├── style.css                   # 공통 스타일
├── main.js                     # 구역 이동, 코치 스프라이트, 핫스팟, 랭킹
├── progress.js                 # 미션 진행도 저장/점수 보정 공통 유틸
├── missions/
│   ├── mission1.html           # 미션 1 — 하프파이프 (에너지 보존)
│   ├── mission1.css
│   ├── mission1.js             # 코어 물리 + 게임 흐름 + 루프
│   ├── mission1-three.js       # Three.js 3D 씬 (경기장, 라이더)
│   ├── mission1-draw.js        # 2D 캔버스 드로우 함수
│   ├── mission1-rider.js       # 스노보더 3D 모델
│   ├── mission2.html           # 미션 2 — 일과 에너지 (마찰 에너지 손실)
│   ├── mission2.css
│   ├── mission2.js
│   ├── mission3.html           # 미션 3 — 번지점프 설계 (탄성에너지)
│   ├── mission3.css
│   ├── mission3.js             # 번지점프 물리 시뮬레이션
│   ├── mission4.html           # 미션 4 — 챔피언십 결전 (에너지 통합 점검)
│   ├── mission4.css
│   ├── mission4.js             # 비주얼 노벨 + 판별 미니게임
│   ├── mission-ui.css          # 공통 미션 복귀 버튼/클리어 오버레이 스타일
│   └── mission-ui.js           # 공통 미션 UI 유틸
├── simulations/
│   └── jumper3d.js             # mission3용 Three.js 번지점프 3D 캐릭터
└── image/
    ├── 기초.png                 # 외부 광장 배경
    ├── 동계.png                 # 동계올림픽 훈련장 배경
    ├── 번지.png                 # 번지점프 타워 배경
    ├── 숙소.png                 # 선수 숙소 배경
    ├── 랭킹.png                 # 랭킹 기록실 배경
    ├── 코치-idle.png            # 코치 스프라이트 (정지, 5×5 스프라이트 시트)
    ├── 코치-walk.png            # 코치 스프라이트 (이동)
    ├── 로비.png / 수영장.png / 트랙.png / 허들.png  # mission4 배경
    ├── 수영.png / 육상.png / 높이뛰기.png           # mission4 캐릭터
    └── 수영_만족.png / 육상_만족.png / 높이뛰기_만족.png  # mission4 캐릭터(성공)
```

---

## 각 미션의 교육 목표

| 미션 | 배경 | 핵심 물리 개념 |
|------|------|----------------|
| 1 — 하프파이프 | 동계올림픽 훈련장 | **에너지 보존**: Ek + Ep = 일정 (마찰 없는 이상 조건) |
| 2 — 일과 에너지 | 동계올림픽 훈련장 | **마찰 에너지 손실**: 역학적 에너지 → 열에너지 전환 (마찰력 = F) |
| 3 — 번지점프 설계 | 번지점프 타워 | **탄성에너지**: Ep + Ek + Ee = 일정, Ee = ½kx² |
| 4 — 챔피언십 결전 | 선수 숙소 | **에너지 통합 점검**: Ek + Ep + Q = E₀ |

---

## 전체 게임 흐름

```
index.html (로비)
  — 구역(zone) 단위로 배경 이미지 전환
  — 핫스팟 포털 클릭으로 구역 이동 또는 미션 진입
  — 미션 포털 입장 직전 코치 사색 질문 표시(세션당 포털별 1회)
  — localStorage('elab-progress-v2')로 클리어 상태·점수 저장
  — 구역 잠금: bungee(미션3) requires winter 완료, dorm(미션4) requires bungee 완료
  — 첫 진입 시 4단계 튜토리얼 (TUTORIAL_KEY = 'elab-tutorial-v1')
  — 물리 개념 노트 버튼 (📓 노트) — 클리어한 미션의 개념 카드 표시

미션 진입:
  인트로 화면 (미션 소개 + 물리 개념 설명)
    ↓
  게임플레이
    ↓
  미션 완료 → 2.2초 클리어 오버레이(점수/1000 표시) → index.html?back=1 복귀
```

---

## 로비 (index.html / main.js)

### 구역(ZONES) 목록
| 구역 ID | 이름 | 포함 미션 | 잠금 조건 |
|---------|------|-----------|-----------|
| outside | 외부 광장 | 없음 (허브) | 없음 |
| winter | 동계올림픽 훈련장 | 미션 1, 2 | 없음 |
| bungee | 번지점프 타워 | 미션 3 | winter 완료 |
| dorm | 선수 숙소 | 미션 4 | bungee 완료 |
| ranking | 랭킹 기록실 | 점수 저장 | 없음 |

### 저장 키 (localStorage)
- `elab-progress-v2` — 미션 클리어 상태·점수 배열 `[{ id, status, score }]`
- `athlete-lab-ranking-v1` — 랭킹 기록
- `athlete-lab-return-zone` — 미션에서 돌아올 구역
- `athlete-lab-last-zone` — 마지막 방문 구역
- `elab-tutorial-v1` — 튜토리얼 완료 여부

### 로비 기능 (main.js)
- 코치 idle 스프라이트: 1→25→1 핑퐁 루프 (`state.spriteDir`)
- 구역 전환 시 코치 스토리 대사 버블 표시 (`showStoryBubble`)
- 잠긴 구역 클릭 시 잠금 안내 메시지 (`showLockedMessage`)
- 미션 포털 입장 전 코치 사색 질문:
  - 미션 1: 역학적 에너지 보존(Ep + Ek)
  - 미션 2: 마찰로 인한 열손실(Q)
  - 미션 3: 탄성에너지(Ee)
  - 미션 4: 에너지 전환 통합 관점
- 랭킹 화면: 총점 기준 등급 표시 S(3500+) / A(2500+) / B(1500+) / C(500+) / D
- 랭킹 목록은 **상위 3개 기록만 표시**
- 랭킹 저장 후 **새 도전 시작** 버튼으로 미션 진행도만 초기화 가능(랭킹 기록은 유지)

---

## 점수 시스템 — 전 미션 공통 0–1000 스케일

모든 미션은 **저장값과 인게임 표시값 모두 0–1000** 범위로 통일.

| 미션 | 인게임 스케일 | 만점 기준 | 변환 방식 |
|------|------------|-----------|-----------|
| 1 하프파이프 | 표시 시 `÷40, cap 1000` | raw / 40 → 1,000 | 내부 물리 그대로, 표시·저장만 변환 |
| 2 컬링 | 200/160/120/80/30/0 per shot | 5 × 200 = 1,000 | `calculateShotScore` 값 ×2 |
| 3 번지점프 | 정밀도·G 각 0–167, 라운드 만점 333 | 3 × 333 ≈ 999 | `calcScore` 내부 스케일 ×3.33 |
| 4 챔피언십 | 신뢰도 250씩 증가 | 4 × 250 = 1,000 | `vnTrust` 단위 250, 진행바 `÷10 %` |

총점 최대 **4,000점** (미션 4개 × 1,000).

---

## 미션 1 — 하프파이프 에너지 트랜스퍼

**핵심 개념:** 운동에너지 ↔ 위치에너지 전환 (에너지 보존)

- Three.js 3D 경기장 + 2D 캔버스 폴백
- 스노보더 라이더 물리 시뮬레이션 (파이프 위 + 공중)
- 실시간 Ep / Ek 에너지 막대 표시
- 목표: 착지 5회 성공
- **마찰 손실 고정 0%** — `frictionLevel = 0` 하드코딩, 슬라이더 UI 숨김

### 스핀 점수 체계
공중에서 보드 시각 회전량(`state.rotation / (Math.PI * 2)`)으로 판정:
| 회전 기준 | 이름 | 점수 |
|-----------|------|------|
| rotations ≥ 3 | 1080 Spin | +1600 |
| rotations ≥ 2 | 720 Spin | +1000 |
| rotations ≥ 1 | 360 Spin | +500 |

- AIR_SLOWMO = 0.62 로 공중 dt 축소 → 최대 회전은 1.85회 정도 (720은 고득점 스킬)
- 각속도 상수: 발사 v0 ×3.6, 가속 a ×5.2, 감쇠 0.997 (원래 값 유지)

### 결과 모달
- **최고 점수(결과 모달 표시) 제거** — `result-best-score` 요소 및 관련 로직 삭제
- 결과 통계: 착지 성공 + 이번 점수 2행만 표시

### 텔레메트리 CSS
`.telemetry-grid strong span { font-size: 1.6rem; font-weight: 900 }` — 값 span을 레이블 span과 분리하여 크게 표시

### 파일 의존성
```
mission1.html
  ├── three.min.js (CDN)
  ├── progress.js
  ├── mission-ui.css / mission-ui.js
  ├── mission1-rider.js    — 스노보더 3D 모델 생성 함수
  ├── mission1.js          — 상수, 상태, 물리 엔진, 루프, 컨트롤
  ├── mission1-three.js    — Three.js 씬 초기화 및 업데이트
  └── mission1-draw.js     — 2D 캔버스 드로우 함수 전체
```

---

## 미션 2 — 일과 에너지

**핵심 개념:** 마찰력(F)으로 인한 에너지 전환 (역학적 에너지 → 열에너지)

- `mission2.html` / `mission2.css` / `mission2.js`로 분리
- 컬링 스톤 밀기 시뮬레이션, 마찰력별 에너지 손실 비교
- 실시간 에너지 그래프
- UI에서 **마찰계수(μ) 대신 마찰력(F, 단위 N)** 표시 — 내부 계산은 μ 유지
- 5라운드, 라운드당 최대 200점 (PERFECT 200 / 160 / 120 / 80 / 30 / MISS 0)

---

## 미션 3 — 번지점프 구조 설계

**핵심 개념:** 탄성 위치에너지 (Ee = ½kx²) + 세 에너지 전환

- Three.js 3D 환경 + 2D 캔버스 폴백
- 줄 탄성(k), 원래 길이(L) 설정 → 최저점 예측
- 3명의 손님을 대상으로 3라운드 점수 경쟁

### 레이아웃 — 3열 구조
```
[좌 패널 260px]  [캔버스 1fr]  [우 패널 300px]
손님 인적사항     시뮬레이션     설계 조건 슬라이더
라운드 도트                    에너지 막대·그래프
요구사항                       낙하 시작 버튼
```
- 좌 패널 배경: `rgba(10,38,62,0.68)` + `backdrop-filter: blur(18px)`
- 손님 전환 시 좌 패널 페이드인 애니메이션 (`clientFadeIn`) — 라운드 변경 시에만 발동
- 상단 HUD(속력·늘어남·G·여유) 제거됨

### 파일 의존성
```
mission3.html
  ├── three.min.js (CDN)
  ├── progress.js
  ├── mission-ui.css / mission-ui.js
  ├── simulations/jumper3d.js
  ├── mission3.css
  └── mission3.js
```

---

## 미션 4 — 챔피언십 결전

**핵심 개념:** 에너지 보존 법칙 통합 검증 (Ek + Ep + Q = E₀)

- 비주얼 노벨 형식 인트로 → 선수별 판별 미니게임 → 컷신 → 완료
- 3명의 캐릭터(서윤·지훈·민재)가 각자 챔피언십 상황 제시
- 계산 문제보다 스포츠 장면과 에너지 원리를 연결하는 대사 중심:
  - 다이빙: 높이의 위치에너지가 착수 직전 운동에너지로 전환
  - 단거리: 공기 저항/마찰로 운동에너지 일부가 열과 흔들림으로 손실
  - 장대높이뛰기: 도움닫기 운동에너지 → 장대 탄성에너지 → 높이
- 정답 선택 시 신뢰도(vnTrust) +250, 최대 1000
- **시뮬레이션 단계 없음** — 컷신 마지막 슬라이드 "미션 완료 →" 클릭 시 저장+복귀
- 선수 이미지: `image/수영.png`, `image/육상.png`, `image/높이뛰기.png`

### 파일 의존성
```
mission4.html
  ├── Pretendard (CDN)
  ├── progress.js
  ├── mission-ui.css / mission-ui.js
  ├── image/수영*.png, 육상*.png, 높이뛰기*.png
  ├── image/로비.png, 수영장.png, 트랙.png, 허들.png
  ├── mission4.css
  └── mission4.js
```

---

## 공통 미션 UI

- `missions/mission-ui.js` / `missions/mission-ui.css`에서 미션 공통 UI를 관리
- 클리어 오버레이, 점수 표시, 로비 복귀 버튼을 공통화
- 미션 1은 제목과 겹치지 않도록 로비 복귀 버튼을 제목 아래 전용 슬롯에 배치
- 인트로 중에는 복귀 버튼을 숨기고, 플레이가 시작되면 표시

---

## 공통 규칙

- 모든 미션은 완료 시 `localStorage('elab-progress-v2')`에 `{ id, status:'clear', score }` 저장
- 진행도 저장/점수 보정은 `progress.js`의 `ElabProgress` 사용
- 클리어 후 **2.2초 클리어 오버레이** (`showClearAndReturn(score)`) → `../index.html?back=1` 복귀
- 로컬 서버 필요: `python -m http.server` (Three.js CORS 정책)
- 데스크탑 가로 레이아웃 기준, 모바일 미지원
- 한국어 전용
