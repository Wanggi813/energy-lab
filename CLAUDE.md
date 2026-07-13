# Physical Energy Lab - 선수 성장 연구소

## 프로젝트 개요

스포츠 훈련장을 배경으로 고등학생이 에너지 보존과 전환을 체험하는 순수 HTML/CSS/JavaScript 교육 게임이다.

플레이어는 로비에서 코치를 움직여 훈련 구역을 방문하고, 4개의 미션을 완료하면서 운동에너지, 위치에너지, 열에너지, 탄성에너지의 관계를 배운다. 미션 점수는 모두 0~1,000점으로 정규화되고, 총점은 4,000점 만점이다.


## 기술 스택

- 순수 HTML, CSS, JavaScript
- Three.js CDN: 미션 1, 미션 3의 3D 장면
- Pretendard CDN: 일부 미션 UI 폰트
- Vercel Serverless Function: `/api/ranking`
- Vercel Serverless Function: `/api/gemini`
- GitHub Contents API: 서버 랭킹 저장소로 `ranking.json` 갱신
- Gemini API: 물리 노트 뒷면의 AI 3지선다 퀴즈 생성
- 빌드 도구 없음. 정적 파일 중심 프로젝트

## 실행 방법

정적 화면만 확인할 때는 로컬 정적 서버로 실행할 수 있다.

```bash
python -m http.server
```

Three.js와 이미지 경로 확인을 위해 파일 직접 열기보다 로컬 서버 실행을 권장한다.

단, `/api/ranking`과 `/api/gemini` 같은 Vercel Serverless Function까지 로컬에서 확인하려면 Vercel 개발 서버로 실행해야 한다.

```bash
npx vercel dev
```

로컬 Gemini 테스트용 `.env.local`에는 다음 값이 필요하다. 이 파일은 `.gitignore` 대상이며 배포에는 자동 반영되지 않는다.

- `GEMINI_API_KEY`: Gemini API 키
- `GEMINI_MODEL`: 기본값 `gemini-flash-latest`

Vercel 배포 시 랭킹 API를 쓰려면 환경 변수가 필요하다.

- `GITHUB_TOKEN`: `ranking.json`을 읽고 쓸 수 있는 토큰
- `GITHUB_REPO`: `owner/repo` 형식
- `GITHUB_BRANCH`: 기본값 `main`
- `RANKING_FILE`: 기본값 `ranking.json`

Vercel 배포 시 Gemini AI 퀴즈를 쓰려면 Vercel Dashboard의 Environment Variables에 별도로 환경 변수를 넣고 재배포해야 한다.

- `GEMINI_API_KEY`: 필수
- `GEMINI_MODEL`: 선택, 기본값 `gemini-flash-latest`

`.env.local`은 로컬 전용이므로 Vercel 배포 사이트가 읽지 않는다. 환경 변수를 추가/수정한 뒤에는 새 Production 배포가 필요하다.

## 폴더 구조

```text
muligo2/
├─ index.html                  # 로비, 로딩/인트로, 모달 진입점
├─ style.css                   # 로비 공통 스타일
├─ ranking-podium.css          # 랭킹 기록실 전용 가로형 리더보드 스타일
├─ main.js                     # 로비 상태, 구역 이동, 모달, 랭킹, 노트, 배지
├─ progress.js                 # 미션 진행도 저장/점수 보정 API
├─ badges.js                   # 배지 정의/해금/토스트 API
├─ ranking.json                # GitHub 기반 서버 랭킹 데이터
├─ vercel.json                 # /api 라우팅과 index.html fallback 설정
├─ api/
│  ├─ ranking.js               # GET/POST 랭킹 서버리스 함수
│  └─ gemini.js                # Gemini 기반 AI 3지선다 퀴즈 서버리스 함수
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
| `elab-tutorial-v1` | 로비 튜토리얼 완료 여부 |
| `elab-notebook-ai-question-count-v1` | 일반 모드의 노트 AI 퀴즈 시도 횟수 |
| `elab-notebook-ai-question-count-test-v1` | 평가용 모드의 노트 AI 퀴즈 시도 횟수 |
| `elab-evaluation-mode-v1` | 평가용 모드 활성 여부 |
| `curlingWorkEnergyBest` | 미션 2 로컬 최고점 |

## 로비 흐름

`index.html`은 로딩 화면, 인트로 화면, 로비, 랭킹 모달, 배지 모달, 물리 노트 모달을 포함한다. `main.js`가 로비 전체 상태를 관리한다.

- 배경 이미지를 미리 로드한 뒤 인트로 화면을 보여준다.
- 코치는 좌우 방향키, A/D, 터치 버튼으로 이동한다.
- `SPACE` 또는 터치 액션으로 가까운 hotspot에 진입한다.
- 포털/hotspot을 마우스로 클릭해도 진입하지 않는다. 클릭 시에는 "포털은 가까이 다가간 뒤 SPACE로 입장할 수 있습니다." 안내만 표시한다.
- 이동 중에는 `NOTEBOOK_REMINDER_LINES` 중 하나가 story bubble로 표시되어 노트 복습과 AI 문제 풀이를 자연스럽게 권한다. 첫 복습 안내는 조건이 맞으면 3~5초 뒤, 이후에는 7~10초 간격으로 뜬다. 복습 안내 말풍선은 6초 뒤 자동으로 닫히며, 튜토리얼, 반성 질문, 모달, 기존 말풍선이 열려 있을 때는 표시하지 않는다.
- 구역은 `outside`, `winter`, `bungee`, `dorm`, `ranking`이다.
- `bungee`는 미션 1, 2 완료 후 해금된다.
- `dorm`은 미션 3 완료 후 해금된다.
- 미션 hotspot 진입 전에는 1회성 코치 반성 질문을 보여준다.
- 첫 방문 시 `TUTORIAL_STEPS` 기반 로비 튜토리얼을 보여준다.
- 물리 노트는 완료한 미션의 개념 카드와 점수를 보여주며 인증서 다운로드 기능을 제공한다.
- 물리 노트 뒷면에는 `AI 문제 풀어보기`가 있다. 버튼을 누르면 `/api/gemini`가 점수와 시도 횟수를 바탕으로 3지선다 퀴즈를 반환하고, 학생은 A/B/C 중 하나를 고른다.
- AI 퀴즈 난이도는 점수와 질문 횟수에 따라 `기초 -> 적용 -> 도전 -> 심화`로 올라간다. 질문 유형도 핵심 확인, 변인 변화, 짧은 계산, 오개념 진단, 상황 전이 순으로 달라진다.
- `/api/gemini`는 Gemini 응답이 JSON 형식을 깨거나 모델 호출이 실패해도 500으로 화면을 깨지 않고 fallback 3지선다 퀴즈를 반환한다.
- AI 퀴즈 UI의 텍스트는 카드 대표색을 따라가지 않도록 어두운 글씨색을 강하게 고정한다. 하프파이프 카드의 하늘색이 문제/선택지 글씨에 새어 들어가면 `style.css`의 `.nb-ai-*` 색상 override를 확인한다.
- 배지 모달은 `ElabBadges.getAll()` 결과를 노트 형태로 렌더링한다.
- 미션에서 `?back=1`으로 돌아올 때만 `athlete-lab-return-zone`에 저장된 구역으로 복귀한다. 그 외 일반 새로고침/재진입 시에는 항상 `outside` 구역에서 시작한다.
- 상단 HUD의 `❓ 도움말` 버튼(`#openHelp`)을 누르면 `elab-tutorial-v1` 저장 여부와 무관하게 로비 튜토리얼을 처음부터 다시 볼 수 있다. 튜토리얼 문구에는 노트(📓)·배지(🏅) 버튼 안내도 포함된다.
- 상단 HUD의 `평가용` 버튼(`#toggleTestMode`)을 누르면 평가용 모드가 켜진다. 이 모드는 실제 `elab-progress-v2` 저장값을 바꾸지 않고 화면상의 미션 상태만 4개 모두 clear, 각 1,000점으로 보여준다.
- 평가용 모드에서는 총점이 `평가용 · 4,000 / 4,000 pt`로 표시되고, 구역 잠금 조건도 완료 상태처럼 통과한다.
- 평가용 모드 진입 시 `elab-notebook-ai-question-count-test-v1`만 초기화되어 AI 퀴즈 시도 횟수가 0부터 시작한다. 일반 모드의 `elab-notebook-ai-question-count-v1`은 보존한다.
- 평가용 모드를 다시 누르면 실제 저장된 진행도로 돌아간다.
- "미션 점수와 랭킹을 모두 초기화" 버튼은 `athlete-lab-return-zone`도 함께 지우고 구역을 `outside`로 되돌린다.

## 랭킹 시스템

로비의 랭킹 구역에서 현재 점수와 상위 기록을 확인하고 저장한다.

- 클라이언트 API 경로: `/api/ranking`
- GET: GitHub의 `ranking.json`을 읽어 반환
- POST: `{ name, score, missions, savedAt }` 저장 후 점수순 정렬, 최대 200개 유지
- POST 저장 전 서버에서 `sanitizeRankEntry()`로 이름, 총점, 미션 점수, 저장 시각을 정규화한다. `score`는 0~4,000 범위이며, 반드시 미션별 점수 합계 이하로 제한된다. `missions`는 4개 항목으로 보정되고 각 항목은 0~1,000 범위로 clamp된다.
- 서버 실패 시 `athlete-lab-ranking-v1` 로컬 캐시를 사용한다.
- 평가용 모드에서는 랭킹 저장을 막는다. `openRankModal()`은 저장 버튼을 `평가용 저장 불가`로 비활성화하고, `saveRank()`도 `isTestMode()`이면 즉시 반환한다.
- 화면에는 상위 3개 기록만 표시한다.
- 랭킹 모달의 전용 스타일은 `ranking-podium.css`가 담당한다. 이 파일은 `style.css` 뒤에 로드되어 기존 랭킹/모달 스타일을 덮어쓴다.
- 현재 랭킹 UI는 단상형이 아니라 가로형 아케이드 리더보드다. 1등, 2등, 3등은 한 줄씩 위에서 아래로 표시한다.
- `main.js`의 `renderRanks()`는 각 행에 `rank-place-1`, `rank-place-2`, `rank-place-3` 클래스와 `data-rank`를 붙인다. 스타일 조정은 이 클래스를 기준으로 한다.
- 1등은 이름 옆에 왕관(`👑`)을 CSS `::after`로 표시한다. 트로피는 `main.js`의 `.rank-trophy` 이모지(`🏆`)를 사용하며, CSS 도형 트로피를 다시 만들지 않는다.
- 점수 영역은 박스형 테두리 없이 숫자만 강조한다. `style.css` 하단의 예전 `#rankModal .rank-row-v2:nth-child(...) .rank-score` 규칙과 충돌할 수 있으므로 `ranking-podium.css` 마지막의 score reset 규칙을 유지한다.
- 등급 기준:
  - S: 3,500점 이상
  - A: 2,500점 이상
  - B: 1,500점 이상
  - C: 500점 이상
  - D: 0점 이상
- 랭킹 저장 후 `이번 도전 시작`은 랭킹 기록은 유지하고 미션 진행도만 초기화한다.
- 점수 저장 시 등급에 따라 축하 효과가 다르다. S/A 등급은 컨페티(색종이) 애니메이션과 큰 팝업 토스트가, B 이하는 작은 토스트만 뜬다. 관련 로직은 `main.js`의 `showSaveCelebration()`/`burstConfetti()`, 스타일은 `ranking-podium.css`의 `.save-toast`/`.confetti-piece`가 담당한다.

## 진행도 API

`progress.js`는 `window.ElabProgress`를 제공한다.

- `MAX_MISSION_SCORE = 1000`
- `clampScore(value)`: 점수를 0~1,000 범위로 정규화
- `readProgress()`, `writeProgress(records)`
- `saveMission(id, status = 'clear', score = null)`
- 미션을 clear로 저장하면 다음 미션이 `anomaly` 상태로 추가된다.

## Gemini AI 퀴즈

`api/gemini.js`는 물리 노트 뒷면의 AI 3지선다 퀴즈를 제공한다.

- 클라이언트 API 경로: `/api/gemini`
- 프론트 요청: `{ missionId, score, questionCount, quizSeed }`
- 서버는 클라이언트가 보낸 임의 개념 설명을 신뢰하지 않고, `api/gemini.js` 내부의 미션별 개념 데이터만 사용한다.
- 서버는 `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY`를 환경 변수에서 읽는다.
- 모델은 `GEMINI_MODEL` 환경 변수를 우선 사용하고, 없으면 `gemini-flash-latest`를 사용한다.
- Gemini 응답은 JSON 객체 하나여야 한다.

```json
{
  "difficulty": "기초",
  "question": "문제",
  "choices": ["선택지1", "선택지2", "선택지3"],
  "answerIndex": 0,
  "hint": "힌트",
  "explanation": "정답 확인 설명"
}
```

- 서버는 `normalizeQuiz()`로 `choices`가 정확히 3개인지, `answerIndex`가 0~2인지 검사한다.
- Gemini가 비JSON 텍스트를 반환하거나 모델 호출이 실패하면 `createFallbackQuiz()`로 기본 퀴즈를 반환한다. 이 경우에도 HTTP 200으로 응답해 학생 화면이 깨지지 않게 한다.
- fallback 퀴즈는 `questionCount % templates.length`로 순환하므로 `다른 AI 질문 받기`를 눌렀을 때 같은 문제만 반복되지 않아야 한다.
- 프론트는 `renderNotebookAiQuiz()`로 퀴즈를 그리고, `handleNotebookAiChoice()`에서 선택지를 잠그고 정답/오답 피드백을 표시한다.
- 노트 카드 클릭과 AI 퀴즈 클릭이 충돌하지 않도록 `.nb-ai-btn`, `.nb-ai-choice`, `.nb-ai-box` 클릭은 카드 flip 이벤트로 전파하지 않는다.

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
- 3라운드 완료 시 점수 정산창의 "완료 →" 버튼을 누르면 별도의 미션 완료 버튼 없이 곧바로 코치 확인 퀴즈 → 로비 복귀로 이어진다. 3라운드 합산 점수가 900점 이상이면 `precision` 배지를 해금한다.
- 손님별 G 조건은 전역 블랙아웃 임계값 `BLACKOUT_G = 4.3`을 넘지 않는 범위에서 설계되어야 한다. 탄성력 구간(`extension > 0`)에서 G가 이 값을 넘으면 무조건 실패(`blackout`) 처리되므로, `idealG`/`minG`/`maxG`를 임계값 이상으로 두면 해당 라운드가 이론상 불가능해진다.
- 안전/위험 판정(최저점 여유, 최대 G, 최소 G)은 색상(초록/빨강)뿐 아니라 ✓/⚠ 아이콘도 함께 표시해 색맹 사용자도 구분할 수 있다.
- `minG`가 0인 손님(김지수, 이순자)은 "최소 G (스릴)" 행(`#min-g-row`)이 보이지 않아야 한다. `.status[hidden] { display: none; }` 규칙이 없으면 `.status { display: flex; }`가 `[hidden]` 속성을 덮어써서 항상 보이는 버그가 나므로 이 규칙을 유지해야 한다.
- 미션 튜토리얼(`startBungeeTutorial()`)은 `localStorage` 저장 여부와 무관하게 미션을 시작할 때마다 항상 표시된다. 우측 패널의 "훈련 안내" 버튼(`#tutorial-replay`, `.guide-btn`)으로도 언제든 다시 볼 수 있다.

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
- 코치 스프라이트: `코치-idle.png`, `코치-walk.png`, `코치-run.png`(Shift+방향키 달리기)

## 개발 시 주의사항

- 한글 파일명과 한글 UI 문자열이 많으므로 파일 인코딩은 UTF-8로 유지한다.
- `index.html`의 `style.css?v=N`, `main.js?v=N`, `ranking-podium.css?v=N`은 배포 캐시 무효화에 쓰인다. CSS/JS를 바꿨으면 해당 버전을 올린다.
- 점수 저장은 반드시 `ElabProgress.clampScore()` 또는 `saveMission()` 경로를 사용한다.
- 미션 완료 후 로비 복귀는 `MissionUI.showClearAndReturn()`을 우선 사용한다.
- 랭킹 서버가 실패해도 로컬 캐시로 동작해야 한다.
- 랭킹 기록실 UI를 수정할 때는 `ranking-podium.css`를 우선 수정한다. `style.css`에는 과거 랭킹 실험 스타일이 남아 있으므로 새 랭킹 스타일은 `style.css` 뒤에 로드되는 전용 파일에서 강하게 덮어써야 한다.
- `main.js`의 로비 구역 해금 조건과 각 미션의 저장 id가 어긋나면 진행이 막힌다.
- 평가용 모드는 실제 진행도 저장값을 쓰지 않고 `loadProgress()`에서 `applyTestMissionState()`로 화면 상태만 덮는다. 평가용 기능을 수정할 때 실제 `elab-progress-v2`와 서버 랭킹이 오염되지 않는지 확인한다.
- 포털/hotspot 클릭은 입장 동작을 하면 안 된다. 입장은 `activateNearest()`를 거치는 SPACE 키와 터치 액션 버튼만 허용한다.
- `/api/gemini` 관련 배포 문제를 볼 때 `.env.local`은 로컬 전용임을 먼저 확인한다. Vercel Dashboard에 `GEMINI_API_KEY`가 있어야 하고, 환경 변수 변경 후에는 반드시 새 배포가 필요하다.
- Gemini 모델명은 오래된 고정 버전이 신규 사용자에게 막힐 수 있으므로 기본 alias `gemini-flash-latest`를 우선 사용한다. Vercel에 `GEMINI_MODEL`이 따로 있다면 이 값과 충돌하지 않는지 확인한다.
- 공통 UI를 수정할 때는 4개 미션의 인트로, 복귀 버튼, 완료 오버레이를 함께 확인한다.
- `style.css`, `missions/mission-ui.css`, `missions/mission-intro.css`에 `prefers-reduced-motion: reduce` 대응 규칙이 있다. 새 애니메이션을 추가해도 이 규칙(`animation-duration`/`transition-duration`을 강제로 줄임) 덕분에 모션 감소 사용자에게는 자동으로 완화된다.
- 포커스 표시(`:focus-visible`)를 `outline: none`으로 지우는 경우, 대신 명시적인 `outline` 색상/두께를 지정해 키보드 사용자가 포커스 위치를 알 수 있게 한다.
- 브라우저 동작을 실제로 검증할 때는 `python -m http.server`로 띄운 로컬 서버에 Playwright(`npm install --no-save playwright` 후 headless Chromium)로 접속해 확인한다. 검증용 스크립트/스크린샷/`node_modules`는 확인 후 반드시 삭제한다.
