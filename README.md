# Physical Energy Lab - 선수 성장 연구소

## 프로젝트 개요

스포츠 훈련장을 배경으로 고등학생이 에너지 보존과 전환을 체험하는 순수 HTML/CSS/JavaScript 교육 게임이다.

플레이어는 로비에서 코치를 움직여 훈련 구역을 방문하고, 4개의 미션을 완료하면서 운동에너지, 위치에너지, 열에너지, 탄성에너지의 관계를 배운다. 미션 점수는 모두 0~1,000점으로 정규화되고, 총점은 4,000점 만점이다.


## 기술 스택

- 순수 HTML, CSS, JavaScript
- Three.js CDN: 미션 1, 미션 3의 3D 장면
- Pretendard CDN: 일부 미션 UI 폰트
- Vercel Serverless Function: `/api/ranking`
- GitHub Contents API: 서버 랭킹 저장소로 `ranking.json` 갱신
- 빌드 도구 없음. 정적 파일 중심 프로젝트

## 실행 방법

로컬에서는 정적 서버로 실행한다.

```bash
python -m http.server
```

Three.js와 이미지 경로 확인을 위해 파일 직접 열기보다 로컬 서버 실행을 권장한다.

Vercel 배포 시 랭킹 API를 쓰려면 환경 변수가 필요하다.

- `GITHUB_TOKEN`: `ranking.json`을 읽고 쓸 수 있는 토큰
- `GITHUB_REPO`: `owner/repo` 형식
- `GITHUB_BRANCH`: 기본값 `main`
- `RANKING_FILE`: 기본값 `ranking.json`

## 폴더 구조

```text
muligo2/
├─ index.html                  # 로비, 로딩/인트로, 모달 진입점
├─ style.css                   # 로비 공통 스타일
├─ main.js                     # 로비 상태, 구역 이동, 모달, 랭킹, 노트, 배지
├─ progress.js                 # 미션 진행도 저장/점수 보정 API
├─ badges.js                   # 배지 정의/해금/토스트 API
├─ ranking.json                # GitHub 기반 서버 랭킹 데이터
├─ vercel.json                 # /api rewrite 설정
├─ api/
│  └─ ranking.js               # GET/POST 랭킹 서버리스 함수
├─ image/                      # 로비/미션 배경, 선수/코치 스프라이트
└─ missions/
   ├─ mission-intro.css        # 미션 공통 인트로 스타일
   ├─ mission-ui.css           # 미션 공통 복귀/완료/질문 UI 스타일
   ├─ mission-ui.js            # 미션 공통 UI API
   ├─ mission1.html/css/js     # 하프파이프
   ├─ mission1-three.js        # 미션 1 Three.js 경기장
   ├─ mission1-draw.js         # 미션 1 2D 캔버스 드로잉
   ├─ mission1-rider.js        # 미션 1 라이더 3D 모델
   ├─ mission2.html/css/js     # 컬링 마찰/일-에너지
   ├─ mission3.html/css/js     # 번지점프 탄성에너지
   ├─ mission3-jumper.js       # 미션 3 점퍼 3D 모델
   └─ mission4.html/css/js     # 챔피언십 비주얼 노벨/총정리
```

## 핵심 저장 키

| 키 | 용도 |
| --- | --- |
| `elab-progress-v2` | 미션 진행도 배열 `[{ id, status, score }]` |
| `elab-badges-v1` | 해금된 배지 id 목록 |
| `athlete-lab-ranking-v1` | 서버 API 실패 시 사용하는 로컬 랭킹 캐시 |
| `athlete-lab-return-zone` | 미션 완료 후 돌아갈 로비 구역 |
| `athlete-lab-last-zone` | 마지막 방문 로비 구역 |
| `elab-tutorial-v1` | 로비 튜토리얼 완료 여부 |
| `curlingWorkEnergyBest` | 미션 2 로컬 최고점 |

## 로비 흐름

`index.html`은 로딩 화면, 인트로 화면, 로비, 랭킹 모달, 배지 모달, 물리 노트 모달을 포함한다. `main.js`가 로비 전체 상태를 관리한다.

- 배경 이미지를 미리 로드한 뒤 인트로 화면을 보여준다.
- 코치는 좌우 방향키, A/D, 터치 버튼으로 이동한다.
- `SPACE` 또는 터치 액션으로 가까운 hotspot에 진입한다.
- 구역은 `outside`, `winter`, `bungee`, `dorm`, `ranking`이다.
- `bungee`는 미션 1, 2 완료 후 해금된다.
- `dorm`은 미션 3 완료 후 해금된다.
- 미션 hotspot 진입 전에는 1회성 코치 반성 질문을 보여준다.
- 첫 방문 시 `TUTORIAL_STEPS` 기반 로비 튜토리얼을 보여준다.
- 물리 노트는 완료한 미션의 개념 카드와 점수를 보여주며 인증서 다운로드 기능을 제공한다.
- 배지 모달은 `ElabBadges.getAll()` 결과를 노트 형태로 렌더링한다.

## 랭킹 시스템

로비의 랭킹 구역에서 현재 점수와 상위 기록을 확인하고 저장한다.

- 클라이언트 API 경로: `/api/ranking`
- GET: GitHub의 `ranking.json`을 읽어 반환
- POST: `{ name, score, missions, savedAt }` 저장 후 점수순 정렬, 최대 200개 유지
- 서버 실패 시 `athlete-lab-ranking-v1` 로컬 캐시를 사용한다.
- 화면에는 상위 3개 기록만 표시한다.
- 등급 기준:
  - S: 3,500점 이상
  - A: 2,500점 이상
  - B: 1,500점 이상
  - C: 500점 이상
  - D: 0점 이상
- 랭킹 저장 후 `이번 도전 시작`은 랭킹 기록은 유지하고 미션 진행도만 초기화한다.

## 진행도 API

`progress.js`는 `window.ElabProgress`를 제공한다.

- `MAX_MISSION_SCORE = 1000`
- `clampScore(value)`: 점수를 0~1,000 범위로 정규화
- `readProgress()`, `writeProgress(records)`
- `saveMission(id, status = 'clear', score = null)`
- 미션을 clear로 저장하면 다음 미션이 `anomaly` 상태로 추가된다.

## 배지 시스템

`badges.js`는 `window.ElabBadges`를 제공한다.

| id | 조건 |
| --- | --- |
| `conserve` | 미션 1 하프파이프 착지 5회 성공 후 완료 |
| `spin720` | 미션 1에서 720도 이상 회전 착지 |
| `friction5` | 미션 2 만점 1,000점 |
| `precision` | 미션 3에서 900점 이상 |
| `full_trust` | 미션 4 만점 1,000점 |
| `all_clear` | 4개 미션 모두 완료 |
| `champion` | 총점 3,500점 이상 |

배지 해금 시 공통 토스트가 뜬다. 토스트 문구는 `배지 획득!`으로 표시한다. 로비 초기화 버튼은 진행도, 로컬 랭킹, 튜토리얼, 배지를 모두 초기화한다.

배지 모달 UI는 `index.html`의 `#badgeModal`과 `style.css`의 `.badge-notebook` 계열 스타일이 담당한다.

- 로비 버튼과 모달 용어는 모두 `배지`로 통일한다.
- 모달 상단 테이프 문구는 `BADGE COLLECTION`이다.
- 모달 제목은 `에너지 실험 배지판`이다.
- 수집 카운터는 `N / 7 배지 수집` 형식이다.
- `.badge-notebook`은 `width: min(740px, calc(100vw - 24px))`, `max-height: 92vh`로 설정되어 있다.
- `.bn-tape`는 잘림 방지를 위해 페이지 내부 `top: 12px`에 배치한다.

## 공통 미션 UI

`missions/mission-ui.js`는 `window.MissionUI`를 제공한다.

- `bindBackButtons()`: `[data-mission-back]` 버튼에 로비 복귀 확인 연결
- `returnToLobby()`: `../index.html?back=1`로 이동
- `showClearAndReturn({ score, formula, desc, ... })`: 완료 오버레이를 띄우고 기본 3.5초 뒤 로비 복귀
- `askCoachQuestion(options)`: 객관식 코치 질문 오버레이

각 미션은 공통 인트로 오버레이(`#mission-intro`)를 가지고, 미션 시작 버튼을 누르면 실제 플레이 화면이 활성화된다.

## 미션 요약

| 미션 | 파일 | 핵심 개념 | 점수 |
| --- | --- | --- | --- |
| 1. 하프파이프 | `mission1.*` | `Ek + Ep = 일정` | 내부 스타일 점수 `/ 40`, 최대 1,000 |
| 2. 컬링 | `mission2.*` | `Q = F × d`, 마찰 손실 | 5라운드 × 200점 |
| 3. 번지점프 | `mission3.*` | `Ep + Ek + Ee = 일정`, `Ee = 1/2kx²` | 3라운드 × 333점 |
| 4. 챔피언십 | `mission4.*` | 에너지 보존 통합 | 정답 4개 × 250점 |

## 미션 1 - 하프파이프

- 파일: `mission1.html`, `mission1.css`, `mission1.js`, `mission1-three.js`, `mission1-draw.js`, `mission1-rider.js`
- Three.js 3D 경기장과 2D 캔버스 드로잉을 함께 사용한다.
- 제한 시간은 75초, 목표는 착지 5회 성공이다.
- 실시간 Ep/Ek/총합 바와 에너지 그래프를 표시한다.
- 마찰은 숨겨진 슬라이더가 있지만 현재 기본 0으로 교육 개념은 에너지 보존에 맞춘다.
- 공중 회전 점수:
  - 360도 이상: 추가 점수
  - 720도 이상: `spin720` 배지
  - 1080도 이상: 더 큰 스타일 점수
- 완료 시 `ElabProgress.saveMission(1, 'clear', missionScore)`를 호출하고 `conserve` 배지를 해금한다.

## 미션 2 - 컬링 마찰 손실

- 파일: `mission2.html`, `mission2.css`, `mission2.js`
- 스톤을 밀고 스위핑하며 하우스에 최대한 가깝게 멈추는 게임이다.
- 빙질은 라운드마다 달라지고 마찰계수 `mu`가 변한다.
- 미는 힘 슬라이더는 10~80 N 범위다.
- 실시간으로 현재 속도, 마찰력, 목표까지 거리, 운동에너지 K, 마찰 손실 Q, 목표 에너지를 표시한다.
- 점수 기준은 타깃 거리 오차에 따라 200/160/120/80/30/0점이다.
- 5라운드가 끝나면 미션 완료 버튼이 나타난다.
- 만점이면 `friction5` 배지를 해금한다.

## 미션 3 - 번지점프 설계

- 파일: `mission3.html`, `mission3.css`, `mission3.js`, `mission3-jumper.js`
- Three.js 배경과 2D 캔버스 시뮬레이션을 함께 사용한다.
- 손님 3명의 체중, 최소 여유 높이, 최대 G, 이상 G 조건에 맞춰 줄의 탄성계수 `k`와 자연 길이 `L`을 설계한다.
- 실시간으로 Ep, Ek, Ee, 총합 에너지 바와 그래프를 표시한다.
- 이론 최저점 예측, 안전 구역, 리플레이 분석, 연습 모드를 제공한다.
- 점수는 여유 높이와 G값이 이상 조건에 가까울수록 높고, 재시도 횟수에 따라 감점된다.
- 3라운드 합산 후 완료하며 900점 이상이면 `precision` 배지를 해금한다.

## 미션 4 - 챔피언십 결전

- 파일: `mission4.html`, `mission4.css`, `mission4.js`
- 비주얼 노벨 형식의 최종 점검 미션이다.
- 서윤(다이빙), 지훈(육상), 민재(장대높이뛰기), 단체 장면까지 4개 질문을 진행한다.
- 정답을 고르면 신뢰도 `vnTrust`가 250점씩 증가한다.
- 선수별 만족 이미지와 배경 이미지가 상황에 따라 렌더링된다.
- 마지막에는 4장짜리 개념 정리 컷신이 있고, 완료 시 점수를 저장한다.
- 만점이면 `full_trust` 배지를 해금한다.

## 이미지 자산

주요 자산은 `image/`에 있다.

- 로비/구역 배경: `인트로.png`, `기초.png`, `동계.png`, `번지.png`, `숙소.png`, `랭킹.png`
- 미션 4 배경: `로비.png`, `수영장.png`, `트랙.png`, `허들.png`
- 선수 이미지: `수영.png`, `육상.png`, `높이뛰기.png`
- 선수 만족 이미지: `수영_만족.png`, `육상_만족.png`, `높이뛰기_만족.png`
- 코치 스프라이트: `코치-idle.png`, `코치-walk.png`
- 코치 애니메이션 JSON: `코치-idle-v1.json`, `코치-walk-v1.json`

## 개발 시 주의사항

- 한글 파일명과 한글 UI 문자열이 많으므로 파일 인코딩은 UTF-8로 유지한다.
- 점수 저장은 반드시 `ElabProgress.clampScore()` 또는 `saveMission()` 경로를 사용한다.
- 미션 완료 후 로비 복귀는 `MissionUI.showClearAndReturn()`을 우선 사용한다.
- 랭킹 서버가 실패해도 로컬 캐시로 동작해야 한다.
- `main.js`의 로비 구역 해금 조건과 각 미션의 저장 id가 어긋나면 진행이 막힌다.
- 공통 UI를 수정할 때는 4개 미션의 인트로, 복귀 버튼, 완료 오버레이를 함께 확인한다.
