'use strict';

const SAVE_KEY = 'elab-progress-v2';
const RANK_KEY = 'athlete-lab-ranking-v1';
const RETURN_ZONE_KEY = 'athlete-lab-return-zone';
const TUTORIAL_KEY = 'elab-tutorial-v1';
const NOTEBOOK_AI_STATS_KEY = 'elab-notebook-ai-question-count-v1';
const TEST_NOTEBOOK_AI_STATS_KEY = 'elab-notebook-ai-question-count-test-v1';
const NOTEBOOK_AI_API = '/api/gemini';
const TEST_MODE_KEY = 'elab-evaluation-mode-v1';

const TUTORIAL_STEPS = [
  '안녕! 나는 에너지 연구소 코치야. 에너지 스포츠 챔피언십까지 딱 한 달 남았어.',
  '← → 키 (또는 A, D)로 이동하고, 포털 근처에서 SPACE를 누르면 입장할 수 있어.',
  '각 구역에서 에너지 실험을 완료하며 서윤, 지훈, 민재를 훈련시켜봐!',
  '우측 하단의 📓 노트 버튼으로 완료한 미션의 개념과 점수를 다시 볼 수 있고, 🏅 배지 버튼으로 지금까지 모은 배지를 확인할 수 있어.',
  '번지 타워와 선수 숙소는 이전 훈련을 마쳐야 열려. 우선 동계 훈련장부터 가보자!'
];

const CONCEPTS = [
  {
    missionId: 1,
    athlete: '서윤 · 미션 1',
    icon: '🏂',
    training: '하프파이프 훈련',
    concept: '에너지 보존',
    formula: 'Ek + Ep = 일정',
    formulaSub: 'Ek = ½mv²   Ep = mgh',
    variables: [
      { sym: 'm', desc: '질량 (kg)' },
      { sym: 'v', desc: '속도 (m/s)' },
      { sym: 'g = 9.8', desc: '중력 가속도 (m/s²)' },
      { sym: 'h', desc: '기준점에서의 높이 (m)' },
    ],
    flow: 'Ep(최대) → Ek(최대) → Ep(최대) → …',
    desc: '마찰이 없을 때 위치에너지와 운동에너지의 합은 항상 일정하다. 높이가 낮아질수록 속도가 빨라지고, 올라갈수록 속도가 줄어든다.',
    color: '#4fc3ff'
  },
  {
    missionId: 2,
    athlete: '지훈 · 미션 2',
    icon: '🥌',
    training: '컬링 마찰 실험',
    concept: '마찰 에너지 손실',
    formula: 'Q = F × d',
    formulaSub: 'F = μmg   역학적에너지 = Ek - Q',
    variables: [
      { sym: 'F', desc: '마찰력 (N)' },
      { sym: 'd', desc: '이동 거리 (m)' },
      { sym: 'μ', desc: '마찰 계수 (단위 없음)' },
      { sym: 'Q', desc: '열에너지 손실 (J)' },
    ],
    flow: 'Ek(출발) → Ek(남음) + Q(열)',
    desc: '마찰력은 운동에너지를 열에너지로 전환한다. 마찰력이 클수록, 이동 거리가 길수록 에너지 손실이 커진다.',
    color: '#ff6b6b'
  },
  {
    missionId: 3,
    athlete: '민재 · 미션 3',
    icon: '🪂',
    training: '번지점프 설계',
    concept: '탄성 위치에너지',
    formula: 'Es = ½kx²',
    formulaSub: 'Ep + Ek + Es = 일정',
    variables: [
      { sym: 'k', desc: '탄성 계수 (N/m)' },
      { sym: 'x', desc: '줄 늘어난 길이 (m)' },
      { sym: 'Es', desc: '탄성 위치에너지 (J)' },
    ],
    flow: 'Ep → Ek → Es → Ek → Ep → …',
    desc: '늘어난 줄에 탄성에너지가 저장된다. 낙하 시 위치에너지가 운동에너지와 탄성에너지로 나뉘며, 세 에너지의 합은 보존된다.',
    color: '#45d18c'
  },
  {
    missionId: 4,
    athlete: '세 선수 · 미션 4',
    icon: '🏅',
    training: '챔피언십 종합',
    concept: '에너지 보존 통합',
    formula: 'Ek + Ep + Es + Q = E₀',
    formulaSub: '어떤 에너지도 사라지지 않는다',
    variables: [
      { sym: 'Ek', desc: '운동에너지 (J)' },
      { sym: 'Ep', desc: '위치에너지 (J)' },
      { sym: 'Es', desc: '탄성에너지 (J)' },
      { sym: 'Q', desc: '열에너지 (마찰 손실, J)' },
      { sym: 'E₀', desc: '처음 역학적 에너지 (J)' },
    ],
    flow: '어떤 형태로든 전환되며, 총합 E₀는 불변',
    desc: '운동·위치·탄성·열에너지를 모두 더하면 항상 처음 에너지와 같다. 에너지는 형태만 바뀔 뿐 절대 사라지지 않는다.',
    color: '#f3c451'
  }
];
const MOVE_SPEED = 0.09;
const RUN_SPEED = 0.18;
const DEFAULT_SCENE_ASPECT = 8 / 3;

const MISSIONS = [
  {
    id: 1,
    title: '하프파이프',
    label: '첫 번째 미션',
    route: 'missions/mission1.html',
    zone: 'winter',
    short: '서윤과 함께 하프파이프를 타며 위치에너지·운동에너지 전환을 체험합니다.'
  },
  {
    id: 2,
    title: '컬링',
    label: '두 번째 미션',
    route: 'missions/mission2.html',
    zone: 'winter',
    short: '지훈과 컬링 실험을 통해 마찰이 에너지를 어떻게 열로 전환하는지 탐구합니다.'
  },
  {
    id: 3,
    title: '번지점프',
    label: '세 번째 미션',
    route: 'missions/mission3.html',
    zone: 'bungee',
    short: '민재를 위해 줄의 탄성계수를 설계하며 탄성에너지 전환을 실험합니다.'
  },
  {
    id: 4,
    title: '종합 점검',
    label: '네 번째 미션',
    route: 'missions/mission4.html',
    zone: 'dorm',
    short: '서윤·지훈·민재 세 선수의 에너지 실험 결과를 종합 분석합니다.'
  }
];

const ZONES = {
  outside: {
    name: '외부 이동 구역',
    image: 'image/기초.png',
    summary: '연구소의 중심 광장 — 각 훈련 구역으로 이동하세요.',
    desc: '에너지 스포츠 챔피언십까지 D-30일. 동계 훈련장에서 서윤·지훈, 번지 타워에서 민재를 훈련시키고 숙소에서 종합 점검을 완료하세요.',
    spawnX: 50,
    floor: 12,
    hotspots: [
      { x: 19, type: 'zone', target: 'winter', title: '동계올림픽 훈련장', subtitle: '미션 1 · 2' },
      { x: 36, type: 'zone', target: 'bungee', title: '번지점프 타워', subtitle: '미션 3' },
      { x: 63, type: 'zone', target: 'dorm', title: '선수 숙소', subtitle: '미션 4' },
      { x: 83, type: 'zone', target: 'ranking', title: '랭킹 기록실', subtitle: '점수 저장' }
    ]
  },
  winter: {
    name: '동계올림픽 훈련장',
    image: 'image/동계.png',
    summary: '서윤·지훈의 에너지 전환 훈련 구역',
    desc: '서윤이 하프파이프에서 에너지 보존을, 지훈이 컬링장에서 마찰 에너지 손실을 배웁니다. 두 실험을 모두 완료해야 다음 구역으로 나아갈 수 있어요.',
    spawnX: 50,
    floor: 10,
    hotspots: [
      { x: 8, type: 'zone', target: 'outside', title: '외부 광장', subtitle: '돌아가기' },
      {
        x: 24,
        type: 'mission',
        missionId: 1,
        title: '하프파이프',
        subtitle: '서윤 · 미션 1',
        reflection: {
          question: '하프파이프 포털 앞에서 코치가 눈밭의 곡선을 바라본다. “마찰이 거의 없다면 서윤이가 내려오고 다시 올라가는 동안 역학적 에너지, 그러니까 Ep + Ek는 어떤 이야기를 들려줄까?”',
          choices: [
            { label: '속도가 커지는 순간 역학적 에너지가 새로 만들어진다', correct: false, feedback: '속도가 커지는 건 새 에너지가 생긴 것이라기보다, 위치에너지가 운동에너지로 모습을 바꾼 거야.' },
            { label: '높이와 속도는 바뀌어도 Ep + Ek의 합은 거의 일정하게 이어진다', correct: true, feedback: '맞아. 서윤이의 높이와 속도는 계속 바뀌지만, 이상적인 조건에서는 위치에너지와 운동에너지의 합이 보존돼.' },
            { label: '최고점에서는 운동에너지가 가장 커져서 총합도 커진다', correct: false, feedback: '최고점에서는 보통 속도가 줄어 운동에너지는 작아져. 대신 위치에너지가 커지며 총합을 이어가.' }
          ]
        }
      },
      {
        x: 80,
        type: 'mission',
        missionId: 2,
        title: '컬링',
        subtitle: '지훈 · 미션 2',
        reflection: {
          question: '컬링장 포털 앞에서 코치가 얼음 표면을 손끝으로 훑는다. “지훈이의 스톤이 마찰 때문에 천천히 멈춘다면, 사라진 것처럼 보이는 운동에너지는 어떤 흔적으로 남을까?”',
          choices: [
            { label: '마찰이 일을 하며 운동에너지를 열에너지 Q로 바꾼다', correct: true, feedback: '좋아. 마찰은 스톤의 운동에너지를 열에너지로 전환해. 그래서 Q = 마찰력 × 이동거리로 손실을 생각할 수 있어.' },
            { label: '스톤이 멈췄으니 운동에너지도 아무 흔적 없이 사라진다', correct: false, feedback: '멈춤은 사라짐이 아니라 전환의 결과야. 에너지는 열처럼 덜 보이는 형태로 남을 수 있어.' },
            { label: '마찰이 클수록 열손실은 줄어들고 스톤은 더 멀리 간다', correct: false, feedback: '마찰이 클수록 같은 거리에서 열로 바뀌는 에너지가 커져. 그래서 스톤은 더 빨리 느려져.' }
          ]
        }
      }
    ]
  },
  bungee: {
    requires: [1, 2],
    name: '번지점프 실험 타워',
    image: 'image/번지.png',
    summary: '민재의 탄성에너지 실험 구역',
    desc: '민재가 번지점프를 통해 탄성에너지 전환 원리를 체험합니다. 줄의 탄성계수(k)와 원래 길이(L)를 설계해 안전하고 짜릿한 점프를 완성해주세요.',
    spawnX: 16,
    floor: 11,
    hotspots: [
      { x: 8, type: 'zone', target: 'outside', title: '외부 광장', subtitle: '돌아가기' },
      {
        x: 38,
        type: 'mission',
        missionId: 3,
        title: '번지점프',
        subtitle: '민재 · 미션 3',
        reflection: {
          question: '번지점프 포털 앞에서 코치가 줄을 한참 바라본다. “민재가 아래로 내려갈수록 줄은 점점 늘어나. 그 늘어남 속에 어떤 에너지가 조용히 저장될까?”',
          choices: [
            { label: '줄이 늘어날수록 위치에너지만 계속 커진다', correct: false, feedback: '아래로 내려갈수록 위치에너지는 줄어들고, 그 일부가 운동에너지와 탄성에너지로 전환돼.' },
            { label: '가장 아래에서 속도가 작으면 저장된 에너지도 없다', correct: false, feedback: '속도가 작아져도 에너지가 사라진 건 아니야. 그 순간 줄에 탄성에너지가 크게 저장되어 있을 수 있어.' },
            { label: '줄이 늘어난 만큼 탄성에너지 Ee가 저장된다', correct: true, feedback: '정확해. 늘어난 줄에는 탄성에너지가 저장되고, Ee = 1/2kx²처럼 늘어난 길이와 탄성계수가 중요해.' }
          ]
        }
      }
    ]
  },
  dorm: {
    requires: [3],
    name: '선수 숙소',
    image: 'image/숙소.png',
    summary: '세 선수의 에너지 종합 분석 구역',
    desc: '서윤·지훈·민재가 훈련에서 배운 에너지 전환 원리를 통합 점검합니다. 챔피언십 직전 최종 분석 — 모든 에너지가 보존됨을 확인하세요.',
    spawnX: 22,
    floor: 14,
    hotspots: [
      { x: 15, type: 'zone', target: 'outside', title: '외부 광장', subtitle: '돌아가기' },
      {
        x: 63,
        type: 'mission',
        missionId: 4,
        title: '종합 에너지 점검',
        subtitle: '미션 4',
        reflection: {
          question: '마지막 포털 앞에서 코치가 세 선수의 기록을 천천히 넘긴다. “높이, 속도, 마찰, 늘어난 줄. 서로 다른 장면처럼 보이지만, 어쩌면 같은 에너지가 다른 얼굴을 하고 지나간 것 아닐까?”',
          choices: [
            { label: '가장 눈에 잘 보이는 속도만 따라가며 판단한다', correct: false, feedback: '속도는 선명하지만 전부는 아니야. 높이, 줄의 늘어남, 열처럼 조용한 형태도 같이 봐야 해.' },
            { label: '종목마다 완전히 다른 이야기라고 생각하고 서로 연결하지 않는다', correct: false, feedback: '겉모습은 달라도 에너지가 모습을 바꾸며 이동한다는 점에서는 같은 이야기로 묶을 수 있어.' },
            { label: '보이는 에너지와 숨어 있는 에너지까지 함께 따라가며 하나의 흐름으로 읽는다', correct: true, feedback: '좋아. 에너지 보존은 숫자 공식이기 전에, 사라진 것처럼 보이는 것을 끝까지 따라가는 태도이기도 해.' }
          ]
        }
      }
    ]
  },
  ranking: {
    name: '랭킹 기록실',
    image: 'image/랭킹.png',
    summary: '훈련 성과를 저장하고 순위를 확인합니다.',
    desc: '챔피언십을 대비한 훈련 점수를 이곳에 저장할 수 있어요. 최고 점수를 남기고 다른 코치들과 실력을 겨뤄보세요.',
    spawnX: 16,
    floor: 16,
    hotspots: [
      { x: 8, type: 'zone', target: 'outside', title: '외부 광장', subtitle: '돌아가기' },
      { x: 52, type: 'rank', title: '랭킹 전광판', subtitle: '점수 저장' }
    ]
  }
};

const state = {
  zoneId: 'outside',
  x: 50,
  facing: 1,
  walking: false,
  running: false,
  nearest: null,
  cameraX: 0,
  worldWidth: 0,
  viewportWidth: 0,
  missionState: new Map(),
  keys: new Set(),
  spriteFrame: 0,
  spriteTick: 0,
  spriteDir: 1,
  spritesReady: false,
  storyTimeout: null,
  tutorialStep: -1,
  reflectionOpen: false,
  reflectionsSeen: new Set()
};

const el = {
  stage: document.getElementById('stage'),
  sceneWorld: document.getElementById('sceneWorld'),
  hotspotLayer: document.getElementById('hotspotLayer'),
  coach: document.getElementById('coach'),
  coachCanvas: document.getElementById('coachCanvas'),
  coachBubble: document.getElementById('coachBubble'),
  coachBubbleText: document.getElementById('coachBubbleText'),
  storyBubble: document.getElementById('storyBubble'),
  storyBubbleText: document.getElementById('storyBubbleText'),
  storyBubbleClose: document.getElementById('storyBubbleClose'),
  zoneName: document.getElementById('zoneName'),
  zoneSummary: document.getElementById('zoneSummary'),
  panelTitle: document.getElementById('panelTitle'),
  panelDesc: document.getElementById('panelDesc'),
  missionProgress: document.getElementById('missionProgress'),
  totalScore: document.getElementById('totalScore'),
  notebookModal: document.getElementById('notebookModal'),
  notebookCards: document.getElementById('notebookCards'),
  openNotebook: document.getElementById('openNotebook'),
  closeNotebook: document.getElementById('closeNotebook'),
  openBadges: document.getElementById('openBadges'),
  openHelp: document.getElementById('openHelp'),
  toggleTestMode: document.getElementById('toggleTestMode'),
  closeBadge: document.getElementById('closeBadge'),
  badgeModal: document.getElementById('badgeModal'),
  badgeGrid: document.getElementById('badgeGrid'),
  rankModal: document.getElementById('rankModal'),
  rankName: document.getElementById('rankName'),
  rankList: document.getElementById('rankList'),
  saveRank: document.getElementById('saveRank'),
  rankPostSave: document.getElementById('rankPostSave'),
  resetRunAfterRank: document.getElementById('resetRunAfterRank'),
  closeRank: document.getElementById('closeRank'),
  resetProgress: document.getElementById('resetProgress'),
  touchLeft: document.getElementById('touchLeft'),
  touchRight: document.getElementById('touchRight'),
  touchAction: document.getElementById('touchAction')
};

const sprite = {
  idle: new Image(),
  walk: new Image(),
  run: new Image(),
  frameSize: 256,
  frames: 25
};

const STORY_LINES = {
  outside(cleared) {
    if (cleared.length === 0)
      return 'D-30일. 에너지 스포츠 챔피언십이 한 달 후야. 동계 훈련장에서 서윤이와 지훈이 먼저 만나보자.';
    if (cleared.includes(1) && !cleared.includes(2))
      return '서윤이가 Ek + Ep = 일정을 몸으로 익혔어. 이제 지훈이랑 컬링에서 그 에너지가 마찰로 어떻게 열로 손실되는지 확인해봐.';
    if (cleared.includes(1) && cleared.includes(2) && !cleared.includes(3))
      return '보존(M1)과 손실(M2)을 모두 봤지. 번지 타워에서 탄성에너지가 세 번째 변수로 합류해 — 같은 법칙, 다른 모습이야.';
    if (cleared.includes(3) && !cleared.includes(4))
      return '하프파이프의 Ek+Ep, 컬링의 Q, 번지의 Es. 이 셋이 사실 하나야: Ek + Ep + Es + Q = E₀. 챔피언십에서 직접 연결해봐.';
    if (cleared.includes(4))
      return '모든 훈련 완료! 챔피언십 준비 완벽해. 랭킹 기록실에 최고 성과를 남겨봐.';
    return '동계 훈련장 실험이 진행 중이야. 서윤이와 지훈이 에너지 전환을 열심히 배우고 있어.';
  },
  winter(cleared) {
    if (!cleared.includes(1))
      return '서윤이가 하프파이프에서 기다리고 있어. 위치에너지가 운동에너지로 바뀌는 순간을 직접 체험해봐.';
    if (!cleared.includes(2))
      return '하프파이프 완료! Ek + Ep가 보존되는 걸 느꼈지? 이번엔 컬링에서 마찰이 그 에너지를 어떻게 열(Q)로 바꾸는지 확인해봐.';
    return '동계 훈련 끝! 에너지 보존(M1)과 마찰 손실(M2)을 모두 체험했어. 이제 탄성에너지가 기다리는 번지 타워로 가보자.';
  },
  bungee(cleared) {
    if (!cleared.includes(3))
      return '하프파이프와 컬링에서 에너지가 보존되고 손실되는 걸 봤지. 번지줄에서는 탄성에너지(Es = ½kx²)가 세 번째로 합류해 — 세 에너지가 동시에 움직여.';
    return '완벽한 설계야! 민재가 탄성에너지 전환을 몸소 익혔어. 이제 숙소에서 세 에너지가 하나의 방정식으로 합쳐지는 것을 확인해봐.';
  },
  dorm(cleared) {
    if (!cleared.includes(4))
      return '하프파이프의 Ek+Ep, 컬링의 Q, 번지의 Es — 세 미션의 에너지가 사실 하나야: Ek + Ep + Es + Q = E₀. 챔피언십에서 직접 연결해봐.';
    return '완벽해! 세 선수 모두 에너지 법칙을 실전에서 완벽하게 써냈어. 챔피언십 우승이야!';
  },
  ranking() {
    return '훈련 기록실이야. 지금까지의 성과를 저장하고 다른 코치들과 실력을 비교해봐.';
  }
};

function getStoryLine(zoneId) {
  const cleared = MISSIONS
    .filter(m => (state.missionState.get(m.id) || {}).status === 'clear')
    .map(m => m.id);
  const fn = STORY_LINES[zoneId];
  return fn ? fn(cleared) : '';
}

function showStoryBubble(text) {
  if (state.tutorialStep >= 0) return;
  clearTimeout(state.storyTimeout);
  el.storyBubbleText.textContent = text;
  el.storyBubbleClose.textContent = '확인 ▸';
  el.storyBubble.classList.remove('hidden');
  state.storyTimeout = setTimeout(() => el.storyBubble.classList.add('hidden'), 12000);
}

function showLockedMessage(text) {
  clearTimeout(state.storyTimeout);
  el.storyBubbleText.textContent = text;
  el.storyBubbleClose.textContent = '확인 ▸';
  el.storyBubble.classList.remove('hidden');
  state.storyTimeout = setTimeout(() => el.storyBubble.classList.add('hidden'), 8000);
}

function hideStoryBubble() {
  clearTimeout(state.storyTimeout);
  el.storyBubble.classList.add('hidden');
}

function openHelp() {
  state.keys.clear();
  state.tutorialStep = 0;
  showTutorialStep();
}

function openNotebookModal() {
  state.keys.clear();
  loadProgress();
  renderNotebook();
  el.notebookModal.classList.remove('hidden');
  requestAnimationFrame(() => el.closeNotebook.focus());
}

function closeNotebookModal() {
  el.notebookModal.classList.add('hidden');
  state.keys.clear();
  el.openNotebook.focus();
}

function openBadgeModal() {
  state.keys.clear();
  renderBadges();
  el.badgeModal.classList.remove('hidden');
  requestAnimationFrame(() => el.closeBadge.focus());
}

function closeBadgeModal() {
  el.badgeModal.classList.add('hidden');
  state.keys.clear();
  el.openBadges.focus();
}

function renderBadges() {
  if (!window.ElabBadges) return;
  const BADGE_COLORS = {
    conserve:   '#d48c18',
    spin720:    '#8844cc',
    friction5:  '#cc3e20',
    precision:  '#148898',
    full_trust: '#b87010',
    all_clear:  '#3448c8',
    champion:   '#a06808'
  };
  const badges = window.ElabBadges.getAll();
  const unlockedCount = badges.filter(b => b.unlocked).length;
  el.badgeGrid.innerHTML = badges.map(b => {
    const col = BADGE_COLORS[b.id] || '#888';
    const cls = b.unlocked ? 'badge-stamp--on' : 'badge-stamp--off';
    const styleAttr = b.unlocked ? ` style="--sc:${col}"` : '';
    return `<div class="badge-stamp ${cls}"${styleAttr}>
  <div class="bs-circle"><div class="bs-icon">${b.icon}</div></div>
  <div class="bs-name">${b.name}</div>
  <div class="bs-cond">${b.desc}</div>
</div>`;
  }).join('');
  const countEl = document.getElementById('bn-count');
  if (countEl) countEl.textContent = `${unlockedCount} / 7 배지 수집`;
}

function checkBadgesOnLoad() {
  if (isTestMode()) return;
  if (!window.ElabBadges) return;
  const allCleared = MISSIONS.every(m => getMissionRecord(m.id).status === 'clear');
  if (allCleared) window.ElabBadges.unlockWithToast('all_clear');
  if (getTotalScore() >= 3500) window.ElabBadges.unlockWithToast('champion');
}

function downloadCertificate() {
  loadProgress();
  const name = (el.rankName && el.rankName.value.trim()) || '탐구자';
  const total = getTotalScore();
  const grade = getGrade(total);
  const missions = MISSIONS.map(m => getMissionRecord(m.id));
  const dateStr = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

  const W = 900, H = 640;
  const cvs = document.createElement('canvas');
  cvs.width = W; cvs.height = H;
  const ctx = cvs.getContext('2d');

  // 배경
  ctx.fillStyle = '#07101d';
  ctx.fillRect(0, 0, W, H);

  // 테두리 글로우
  ctx.strokeStyle = grade.color;
  ctx.lineWidth = 3;
  ctx.shadowColor = grade.color;
  ctx.shadowBlur = 18;
  ctx.strokeRect(18, 18, W - 36, H - 36);
  ctx.shadowBlur = 0;

  // 상단 로고
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('PHYSICAL ENERGY LAB', W / 2, 60);

  ctx.fillStyle = 'rgba(200,230,255,0.45)';
  ctx.font = '11px Courier New';
  ctx.fillText('선수 성장 연구소', W / 2, 80);

  // 구분선
  ctx.strokeStyle = `${grade.color}66`;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(60, 95); ctx.lineTo(W - 60, 95); ctx.stroke();

  // 인증서 제목
  ctx.fillStyle = grade.color;
  ctx.shadowColor = grade.color;
  ctx.shadowBlur = 12;
  ctx.font = 'bold 28px Malgun Gothic, Apple SD Gothic Neo, sans-serif';
  ctx.fillText('에너지 탐구 완료 인증서', W / 2, 148);
  ctx.shadowBlur = 0;

  // 이름
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 42px Malgun Gothic, Apple SD Gothic Neo, sans-serif';
  ctx.fillText(name, W / 2, 218);

  ctx.fillStyle = 'rgba(168,189,208,0.8)';
  ctx.font = '14px Malgun Gothic, Apple SD Gothic Neo, sans-serif';
  ctx.fillText('위 탐구자는 물리 에너지 실험 4개 미션을 수행하고 에너지 보존 법칙을 체득하였음을 인증합니다.', W / 2, 248);

  // 구분선
  ctx.strokeStyle = 'rgba(200,230,255,0.15)';
  ctx.beginPath(); ctx.moveTo(60, 268); ctx.lineTo(W - 60, 268); ctx.stroke();

  // 미션별 점수
  const missionColors = ['#4fc3ff', '#ff6b6b', '#45d18c', '#f3c451'];
  const missionIcons  = ['🏂', '🥌', '🪂', '🏅'];
  const missionNames  = ['하프파이프', '마찰 실험', '번지점프', '챔피언십'];
  const colW = (W - 120) / 4;

  missions.forEach((m, i) => {
    const x = 60 + i * colW + colW / 2;
    const s = m.score || 0;
    const pct = s / 1000;
    const col = missionColors[i];

    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.beginPath();
    ctx.roundRect(60 + i * colW + 8, 280, colW - 16, 160, 8);
    ctx.fill();

    ctx.font = '22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(missionIcons[i], x, 316);

    ctx.fillStyle = col;
    ctx.font = `bold 11px Courier New`;
    ctx.fillText(`MISSION ${i + 1}`, x, 336);

    ctx.fillStyle = 'rgba(200,230,255,0.6)';
    ctx.font = `10px Malgun Gothic, sans-serif`;
    ctx.fillText(missionNames[i], x, 352);

    // 점수 바
    const bx = 60 + i * colW + 20, bw = colW - 40, bh = 6, by = 364;
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 3); ctx.fill();
    if (pct > 0) {
      ctx.fillStyle = col;
      ctx.shadowColor = col; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.roundRect(bx, by, bw * pct, bh, 3); ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.fillStyle = m.status === 'clear' ? col : 'rgba(168,189,208,0.4)';
    ctx.font = `bold 20px Courier New`;
    ctx.fillText(s, x, 406);

    ctx.fillStyle = 'rgba(168,189,208,0.5)';
    ctx.font = `9px Courier New`;
    ctx.fillText('/ 1000', x, 420);
  });

  // 총점 & 등급
  ctx.strokeStyle = 'rgba(200,230,255,0.15)';
  ctx.beginPath(); ctx.moveTo(60, 460); ctx.lineTo(W - 60, 460); ctx.stroke();

  ctx.fillStyle = grade.color;
  ctx.shadowColor = grade.color; ctx.shadowBlur = 16;
  ctx.font = `bold 52px Courier New`;
  ctx.textAlign = 'center';
  ctx.fillText(grade.label, W / 2 - 80, 530);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#fff';
  ctx.font = `bold 36px Courier New`;
  ctx.fillText(total.toLocaleString('ko-KR'), W / 2 + 40, 520);

  ctx.fillStyle = 'rgba(168,189,208,0.6)';
  ctx.font = `12px Courier New`;
  ctx.fillText('/ 4,000 pt', W / 2 + 40, 540);

  // 날짜
  ctx.fillStyle = 'rgba(168,189,208,0.45)';
  ctx.font = `11px Malgun Gothic, Apple SD Gothic Neo, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(dateStr, W / 2, 590);

  // 다운로드
  const link = document.createElement('a');
  link.download = `energy-lab-${name}-${dateStr}.png`;
  link.href = cvs.toDataURL('image/png');
  link.click();
}

function isTestMode() {
  return localStorage.getItem(TEST_MODE_KEY) === '1';
}

function updateTestModeButton() {
  if (!el.toggleTestMode) return;
  const active = isTestMode();
  el.toggleTestMode.textContent = active ? '평가 종료' : '평가용';
  el.toggleTestMode.setAttribute('aria-pressed', active ? 'true' : 'false');
  el.toggleTestMode.title = active
    ? '평가용 모드를 끄고 실제 진행도로 돌아갑니다.'
    : '모든 미션을 완료 상태로 보여주고 랭킹 저장은 막습니다.';
}

function setTestMode(active) {
  if (active) {
    localStorage.setItem(TEST_MODE_KEY, '1');
    localStorage.removeItem(TEST_NOTEBOOK_AI_STATS_KEY);
  } else {
    localStorage.removeItem(TEST_MODE_KEY);
  }
  document.documentElement.classList.toggle('is-test-mode', active);
  updateTestModeButton();
}

function applyTestMissionState() {
  for (const mission of MISSIONS) {
    state.missionState.set(mission.id, { status: 'clear', score: 1000 });
  }
}

function toggleTestMode() {
  const next = !isTestMode();
  setTestMode(next);
  loadProgress();
  renderHotspots();
  renderProgress();
  if (el.rankModal && !el.rankModal.classList.contains('hidden')) {
    renderMyScorePanel();
    renderRanks();
  }
  if (el.notebookModal && !el.notebookModal.classList.contains('hidden')) {
    renderNotebook();
  }
  showStoryBubble(next
    ? '평가용 모드가 켜졌습니다. 모든 미션이 완료 상태로 표시되고 랭킹 저장은 막힙니다.'
    : '평가용 모드가 꺼졌습니다. 실제 저장된 진행도로 돌아갑니다.');
}


function renderNotebook() {
  el.notebookCards.innerHTML = CONCEPTS.map(c => {
    const rec = getMissionRecord(c.missionId);
    const cleared = rec.status === 'clear';

    if (!cleared) {
      return `<div class="nb-flip-card nb-locked-card" style="--c:${c.color}">
        <div class="nb-locked-icon">🔒</div>
        <span class="nb-locked-mission">MISSION 0${c.missionId}</span>
        <span class="nb-locked-label">클리어하면 기록됩니다</span>
      </div>`;
    }

    const mScore = rec.score || 0;
    const aiCount = getNotebookAiQuestionCount(c.missionId);
    const aiDifficulty = getNotebookAiDifficulty(mScore, aiCount);
    const tagsHtml = (c.variables || []).map(v =>
      `<span class="nb-tag"><em>${escapeHtml(v.sym)}</em><span class="nb-tag-desc">${escapeHtml(v.desc)}</span></span>`
    ).join('');

    return `
      <div class="nb-flip-card" data-mission="${c.missionId}" style="--c:${c.color}">
        <div class="nb-flip-inner">

          <div class="nb-flip-front">
            <span class="nb-mission-num">0${c.missionId}</span>
            <div class="nb-front-header">
              <div class="nb-icon-wrap">${c.icon}</div>
              <div>
                <span class="nb-concept-label">${escapeHtml(c.concept)}</span>
                <span class="nb-training">${escapeHtml(c.training)}</span>
              </div>
            </div>
            <div class="nb-formula-block-new">
              <div class="nb-formula-big">${escapeHtml(c.formula)}</div>
              ${c.formulaSub ? `<div class="nb-formula-sub-text">${escapeHtml(c.formulaSub)}</div>` : ''}
            </div>
            <div class="nb-score-display">
              <span class="nb-score-num">${mScore}</span>
              <span class="nb-score-unit">pt / 1,000</span>
            </div>
            <span class="nb-flip-hint">탭해서 자세히 보기 ↻</span>
          </div>

          <div class="nb-flip-back">
            <span class="nb-back-header">${escapeHtml(c.concept)}</span>
            ${tagsHtml ? `<div class="nb-tag-grid">${tagsHtml}</div>` : ''}
            ${c.flow ? `<div class="nb-flow">${escapeHtml(c.flow)}</div>` : ''}
            <p class="nb-desc">${escapeHtml(c.desc)}</p>
            <div class="nb-ai-box" data-ai-box="${c.missionId}">
              <div class="nb-ai-head">
                <span class="nb-ai-kicker">AI 문제 풀어보기</span>
                <span class="nb-ai-meta">${escapeHtml(aiDifficulty.label)} · ${aiCount}회</span>
              </div>
              <button class="nb-ai-btn" type="button" data-mission="${c.missionId}">AI 질문 받기</button>
              <div class="nb-ai-response" aria-live="polite"></div>
            </div>
            <span class="nb-flip-hint">↻ 돌아가기</span>
          </div>

        </div>
      </div>`;
  }).join('');
}

function readNotebookAiStats() {
  try {
    const data = JSON.parse(localStorage.getItem(getNotebookAiStatsKey()) || '{}');
    return data && typeof data === 'object' ? data : {};
  } catch (_) {
    return {};
  }
}

function writeNotebookAiStats(stats) {
  localStorage.setItem(getNotebookAiStatsKey(), JSON.stringify(stats));
}

function getNotebookAiStatsKey() {
  return isTestMode() ? TEST_NOTEBOOK_AI_STATS_KEY : NOTEBOOK_AI_STATS_KEY;
}

function getNotebookAiQuestionCount(missionId) {
  const stats = readNotebookAiStats();
  return Math.max(0, Number(stats[String(missionId)] || 0));
}

function setNotebookAiQuestionCount(missionId, count) {
  const stats = readNotebookAiStats();
  stats[String(missionId)] = Math.max(0, Number(count) || 0);
  writeNotebookAiStats(stats);
}

function getNotebookAiDifficulty(score, count) {
  if (score >= 930 || count >= 6) {
    return {
      level: 'advanced',
      label: '심화',
      instruction: '새로운 스포츠 상황에 개념을 전이하고, 조건 변화가 에너지 흐름에 미치는 영향을 판단하게 해줘.'
    };
  }
  if (score >= 800 || count >= 4) {
    return {
      level: 'challenge',
      label: '도전',
      instruction: '짧은 계산과 이유 설명을 함께 요구하고, 흔한 오개념을 스스로 점검하게 해줘.'
    };
  }
  if (score >= 600 || count >= 2) {
    return {
      level: 'intermediate',
      label: '적용',
      instruction: '공식의 변인 관계를 실제 미션 장면에 적용하고, 한 가지 조건이 바뀌면 결과가 어떻게 달라지는지 묻게 해줘.'
    };
  }
  return {
    level: 'basic',
    label: '기초',
    instruction: '처음 복습하는 학생도 풀 수 있게 핵심 개념 확인 중심으로 물어봐줘.'
  };
}

function getConceptByMissionId(missionId) {
  return CONCEPTS.find(c => c.missionId === missionId);
}

function renderNotebookAiQuiz(quiz) {
  const choices = Array.isArray(quiz?.choices) ? quiz.choices.slice(0, 3) : [];
  if (!quiz?.question || choices.length !== 3) {
    return '<p class="nb-ai-error">퀴즈 형식이 올바르지 않습니다. 다시 시도해주세요.</p>';
  }
  const answerIndex = Number.isInteger(quiz.answerIndex) ? quiz.answerIndex : -1;
  const labels = ['A', 'B', 'C'];
  const choicesHtml = choices.map((choice, index) => `
    <button
      class="nb-ai-choice"
      type="button"
      data-correct="${index === answerIndex ? '1' : '0'}"
      data-choice-label="${labels[index]}"
      data-explanation="${escapeHtml(quiz.explanation || '')}"
    >
      <span>${labels[index]}</span>
      <strong>${escapeHtml(choice)}</strong>
    </button>
  `).join('');

  return `
    <div class="nb-ai-quiz" data-answered="0">
      <p class="nb-ai-question">${escapeHtml(quiz.question)}</p>
      <div class="nb-ai-choices">${choicesHtml}</div>
      ${quiz.hint ? `<p class="nb-ai-hint">힌트: ${escapeHtml(quiz.hint)}</p>` : ''}
      <p class="nb-ai-feedback" aria-live="polite"></p>
    </div>
  `;
}

function handleNotebookAiChoice(button) {
  const quiz = button.closest('.nb-ai-quiz');
  if (!quiz || quiz.dataset.answered === '1') return;

  quiz.dataset.answered = '1';
  const choices = Array.from(quiz.querySelectorAll('.nb-ai-choice'));
  const feedback = quiz.querySelector('.nb-ai-feedback');
  const correctButton = choices.find(choice => choice.dataset.correct === '1');
  const isCorrect = button.dataset.correct === '1';
  const explanation = button.dataset.explanation || correctButton?.dataset.explanation || '';
  const correctLabel = correctButton?.dataset.choiceLabel || '';

  choices.forEach(choice => {
    choice.disabled = true;
    if (choice.dataset.correct === '1') choice.classList.add('is-correct');
  });
  button.classList.add('is-selected');
  if (!isCorrect) button.classList.add('is-wrong');

  if (feedback) {
    feedback.className = `nb-ai-feedback ${isCorrect ? 'is-correct' : 'is-wrong'}`;
    feedback.textContent = isCorrect
      ? `정답입니다. ${explanation}`
      : `다시 볼 포인트가 있어요. 정답은 ${correctLabel}입니다. ${explanation}`;
  }
}

async function requestNotebookAiQuestion(button) {
  const missionId = Number(button.dataset.mission);
  const concept = getConceptByMissionId(missionId);
  if (!concept) return;

  const card = button.closest('.nb-flip-card');
  const box = button.closest('.nb-ai-box');
  const response = box ? box.querySelector('.nb-ai-response') : null;
  const meta = box ? box.querySelector('.nb-ai-meta') : null;
  const record = getMissionRecord(missionId);
  const score = record.score || 0;
  const questionCount = getNotebookAiQuestionCount(missionId);

  button.disabled = true;
  button.textContent = '질문 만드는 중...';
  if (response) {
    response.classList.add('is-loading');
    response.innerHTML = 'AI 코치가 점수와 복습 횟수에 맞춰 문제를 고르는 중입니다.';
  }

  try {
    const res = await fetch(NOTEBOOK_AI_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        missionId,
        score,
        questionCount,
        quizSeed: Date.now() % 1000000
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || data.error || 'AI 질문을 가져오지 못했습니다.');

    const nextCount = questionCount + 1;
    const nextDifficulty = getNotebookAiDifficulty(score, nextCount);
    setNotebookAiQuestionCount(missionId, nextCount);

    if (response) {
      response.classList.remove('is-loading');
      response.innerHTML = renderNotebookAiQuiz(data.quiz);
    }
    if (meta) meta.textContent = `${nextDifficulty.label} · ${nextCount}회`;
    button.textContent = '다른 AI 질문 받기';
    if (card) card.classList.add('has-ai-question');
  } catch (err) {
    if (response) {
      response.classList.remove('is-loading');
      response.innerHTML = escapeHtml(err.message || 'AI 질문을 불러오는 중 문제가 생겼습니다.');
    }
    button.textContent = '다시 시도';
  } finally {
    button.disabled = false;
  }
}

function initTutorial() {
  if (localStorage.getItem(TUTORIAL_KEY)) return;
  state.tutorialStep = 0;
  showTutorialStep();
}

function showTutorialStep() {
  clearTimeout(state.storyTimeout);
  el.storyBubbleText.textContent = TUTORIAL_STEPS[state.tutorialStep];
  el.storyBubbleClose.textContent =
    state.tutorialStep < TUTORIAL_STEPS.length - 1 ? '다음 →' : '시작! →';
  el.storyBubble.classList.remove('hidden');
}

function advanceTutorial() {
  state.tutorialStep += 1;
  if (state.tutorialStep >= TUTORIAL_STEPS.length) {
    state.tutorialStep = -1;
    localStorage.setItem(TUTORIAL_KEY, '1');
    hideStoryBubble();
    setTimeout(() => showStoryBubble(getStoryLine('outside')), 600);
  } else {
    showTutorialStep();
  }
}

function loadProgress() {
  state.missionState.clear();
  for (const mission of MISSIONS) {
    state.missionState.set(mission.id, { status: 'ready', score: null });
  }

  if (isTestMode()) {
    applyTestMissionState();
    return;
  }

  try {
    const saved = window.ElabProgress
      ? window.ElabProgress.readProgress()
      : JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!Array.isArray(saved)) return;
    for (const item of saved) {
      if (!state.missionState.has(item.id)) continue;
      state.missionState.set(item.id, {
        status: item.status === 'clear' ? 'clear' : 'ready',
        score: Number.isFinite(Number(item.score))
          ? (window.ElabProgress ? window.ElabProgress.clampScore(item.score) : Math.round(Number(item.score)))
          : null
      });
    }
  } catch (_) {
    // Ignore malformed localStorage data.
  }
}

function getMission(id) {
  return MISSIONS.find(mission => mission.id === id);
}

function getMissionRecord(id) {
  return state.missionState.get(id) || { status: 'ready', score: null };
}

function getTotalScore() {
  return MISSIONS.reduce((sum, mission) => sum + (getMissionRecord(mission.id).score || 0), 0);
}

function setZone(zoneId, spawnX) {
  const zone = ZONES[zoneId] || ZONES.outside;
  state.zoneId = zoneId in ZONES ? zoneId : 'outside';
  state.x = Number.isFinite(spawnX) ? spawnX : zone.spawnX;
  state.nearest = null;

  el.sceneWorld.style.setProperty('--scene-image', `url("${zone.image}")`);
  el.stage.style.setProperty('--floor-bottom', `${zone.floor}%`);
  el.zoneName.textContent = zone.name;
  el.zoneSummary.textContent = zone.summary;
  el.panelTitle.textContent = zone.name;
  el.panelDesc.textContent = zone.desc;

  renderHotspots();
  renderProgress();
  prepareSceneImage(zone);
  updateWorldMetrics(true);
  render();

  const line = getStoryLine(zoneId);
  if (line) showStoryBubble(line);
}

function prepareSceneImage(zone) {
  if (zone.aspect) return;

  const image = new Image();
  image.onload = () => {
    zone.aspect = image.naturalWidth / image.naturalHeight;
    if (ZONES[state.zoneId] === zone) {
      updateWorldMetrics(true);
      render();
    }
  };
  image.src = zone.image;
}

function updateWorldMetrics(jump = false) {
  const zone = ZONES[state.zoneId];
  const viewportWidth = el.stage.clientWidth || window.innerWidth;
  const viewportHeight = el.stage.clientHeight || window.innerHeight;
  const aspect = zone.aspect || DEFAULT_SCENE_ASPECT;
  const worldWidth = Math.max(viewportWidth, Math.round(viewportHeight * aspect));

  state.viewportWidth = viewportWidth;
  state.worldWidth = worldWidth;
  el.sceneWorld.style.width = `${worldWidth}px`;

  updateCamera(jump);
}

function updateCamera(jump = false) {
  const maxCamera = Math.max(0, state.worldWidth - state.viewportWidth);
  const charPx = state.worldWidth * state.x / 100;
  const target = Math.max(0, Math.min(maxCamera, charPx - state.viewportWidth / 2));
  state.cameraX = jump ? target : state.cameraX + (target - state.cameraX) * 0.12;
  el.sceneWorld.style.transform = `translateX(${-Math.round(state.cameraX)}px)`;
}

function renderHotspots() {
  const zone = ZONES[state.zoneId];
  el.hotspotLayer.innerHTML = '';

  for (const spot of zone.hotspots) {
    const button = document.createElement('button');
    button.type = 'button';
    const portalKey = spot.type === 'zone'
      ? spot.target
      : spot.type === 'mission'
        ? `mission-${spot.missionId}`
        : spot.type;
    button.className = `hotspot hotspot-${spot.type} portal-${portalKey}`;
    button.style.left = `${spot.x}%`;
    button.dataset.x = String(spot.x);
    const runes = Array.from({ length: 16 }, (_, i) =>
      `<i style="--a:${i * 22.5}deg;--delay:${(i * -0.07).toFixed(2)}s"></i>`
    ).join('');
    const sparks = Array.from({ length: 22 }, (_, i) => {
      const angle = (i * 137.5) % 360;
      const distance = 34 + (i % 5) * 7;
      const duration = 1.2 + (i % 6) * 0.18;
      const delay = (i * -0.11).toFixed(2);
      return `<i style="--a:${angle}deg;--r:${distance}px;--dur:${duration.toFixed(2)}s;--delay:${delay}s"></i>`;
    }).join('');
    button.innerHTML = `
      <span class="portal-shell" aria-hidden="true">
        <span class="portal-aura"></span>
        <span class="portal-depth"></span>
        <span class="portal-ring portal-ring-outer"></span>
        <span class="portal-ring portal-ring-mid"></span>
        <span class="portal-ring portal-ring-inner"></span>
        <span class="portal-runes">${runes}</span>
        <span class="portal-sparks">${sparks}</span>
        <span class="portal-ground"></span>
      </span>
      <span class="hotspot-copy">
        <strong>${spot.title}</strong>
        <small>${statusLine(spot)}</small>
      </span>
    `;
    if (spot.type === 'zone' && ZONES[spot.target]?.requires) {
      const locked = ZONES[spot.target].requires.some(id => getMissionRecord(id).status !== 'clear');
      if (locked) button.classList.add('is-locked');
    }
    button.addEventListener('click', event => {
      event.preventDefault();
      showStoryBubble('포털은 가까이 다가간 뒤 SPACE로 입장할 수 있습니다.');
    });
    el.hotspotLayer.appendChild(button);
  }
}

function statusLine(spot) {
  if (spot.type !== 'mission') return spot.subtitle;
  const record = getMissionRecord(spot.missionId);
  return record.status === 'clear'
    ? `완료 · ${record.score ?? 0} pt`
    : spot.subtitle;
}

function renderProgress() {
  const total = getTotalScore();
  el.totalScore.textContent = isTestMode()
    ? `평가용 · ${total.toLocaleString('ko-KR')} / 4,000 pt`
    : `${total.toLocaleString('ko-KR')} / 4,000 pt`;
  el.missionProgress.innerHTML = MISSIONS.map(mission => {
    const record = getMissionRecord(mission.id);
    const done = record.status === 'clear';
    return `
      <div class="progress-item ${done ? 'is-clear' : ''}">
        <span>0${mission.id}</span>
        <strong>${mission.title}</strong>
        <small>${done ? `${record.score ?? 0} pt` : mission.label}</small>
      </div>
    `;
  }).join('');
}

function checkNearest() {
  const zone = ZONES[state.zoneId];
  let nearest = null;
  let best = 7;

  for (const spot of zone.hotspots) {
    const distance = Math.abs(state.x - spot.x);
    if (distance < best) {
      nearest = spot;
      best = distance;
    }
  }

  state.nearest = nearest;
}

function render() {
  checkNearest();

  el.coach.style.left = `${state.x}%`;
  el.coach.style.transform = 'translateX(-50%)';

  const near = state.nearest;
  if (near) {
    el.coachBubble.classList.remove('hidden');
    el.coachBubbleText.textContent = near.type === 'mission'
      ? `${near.title} 시작`
      : near.type === 'rank'
        ? '랭킹 저장'
        : `${near.title} 이동`;
  } else {
    el.coachBubble.classList.add('hidden');
  }

  for (const node of el.hotspotLayer.querySelectorAll('.hotspot')) {
    const x = Number(node.dataset.x);
    node.classList.toggle('is-near', near && Math.abs(x - near.x) < 0.1);
  }
}

function activateNearest() {
  if (state.nearest) activateSpot(state.nearest);
}

function activateSpot(spot) {
  if (spot.type === 'zone') {
    const target = ZONES[spot.target];
    if (target?.requires) {
      const missing = target.requires.filter(id => getMissionRecord(id).status !== 'clear');
      if (missing.length > 0) {
        const names = missing.map(id => {
          const m = getMission(id);
          return m ? `미션 ${id} (${m.title})` : `미션 ${id}`;
        });
        showLockedMessage(`🔒 ${names.join(', ')}을(를) 먼저 클리어해야 이 구역이 열려!`);
        return;
      }
    }
    setZone(spot.target);
    return;
  }

  if (spot.type === 'rank') {
    openRankModal();
    return;
  }

  if (spot.type === 'mission' && shouldReflectBeforePortal(spot)) {
    openReflection(spot, () => enterMission(spot));
    return;
  }

  enterMission(spot);
}

function enterMission(spot) {
  const mission = getMission(spot.missionId);
  if (!mission) return;
  localStorage.setItem(RETURN_ZONE_KEY, state.zoneId);
  window.location.href = mission.route;
}

function reflectionKey(spot) {
  return `${state.zoneId}:${spot.type}:${spot.missionId || spot.target || spot.x}`;
}

function shouldReflectBeforePortal(spot) {
  if (!spot.reflection) return false;
  const key = reflectionKey(spot);
  if (state.reflectionsSeen.has(key)) return false;
  state.reflectionsSeen.add(key);
  return true;
}

function updateMovement() {
  if (state.reflectionOpen) {
    state.walking = false;
    state.running = false;
    return;
  }

  const left = state.keys.has('ArrowLeft') || state.keys.has('KeyA') || state.keys.has('TouchLeft');
  const right = state.keys.has('ArrowRight') || state.keys.has('KeyD') || state.keys.has('TouchRight');
  const arrowLeft = state.keys.has('ArrowLeft');
  const arrowRight = state.keys.has('ArrowRight');
  const shift = state.keys.has('ShiftLeft') || state.keys.has('ShiftRight');
  const running = shift && ((arrowLeft && !right) || (arrowRight && !left));
  const speed = running ? RUN_SPEED : MOVE_SPEED;

  if (left && !right) {
    state.x = Math.max(4, state.x - speed);
    state.facing = -1;
    state.walking = true;
    state.running = running;
  } else if (right && !left) {
    state.x = Math.min(96, state.x + speed);
    state.facing = 1;
    state.walking = true;
    state.running = running;
  } else {
    state.walking = false;
    state.running = false;
  }
}

function loadSprites() {
  let loaded = 0;
  const done = () => {
    loaded += 1;
    state.spritesReady = loaded === 3;
  };
  sprite.idle.onload = done;
  sprite.walk.onload = done;
  sprite.run.onload = done;
  sprite.run.src = 'image/코치-run.png';
  sprite.idle.src = 'image/코치-idle.png';
  sprite.walk.src = 'image/코치-walk.png';
}

function drawCoach() {
  const canvas = el.coachCanvas;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!state.spritesReady) return;

  state.spriteTick += 1;
  const speed = state.running ? 5 : state.walking ? 7 : 9;
  if (state.spriteTick >= speed) {
    if (state.walking) {
      state.spriteFrame = (state.spriteFrame + 1) % sprite.frames;
    } else {
      state.spriteFrame += state.spriteDir;
      if (state.spriteFrame >= sprite.frames - 1) {
        state.spriteFrame = sprite.frames - 1;
        state.spriteDir = -1;
      } else if (state.spriteFrame <= 0) {
        state.spriteFrame = 0;
        state.spriteDir = 1;
      }
    }
    state.spriteTick = 0;
  }

  const image = state.running ? sprite.run : state.walking ? sprite.walk : sprite.idle;
  const col = state.spriteFrame % 5;
  const row = Math.floor(state.spriteFrame / 5);
  if (state.facing < 0) {
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(
      image,
      col * sprite.frameSize,
      row * sprite.frameSize,
      sprite.frameSize,
      sprite.frameSize,
      0,
      0,
      canvas.width,
      canvas.height
    );
    ctx.restore();
    return;
  }

  ctx.drawImage(
    image,
    col * sprite.frameSize,
    row * sprite.frameSize,
    sprite.frameSize,
    sprite.frameSize,
    0,
    0,
    canvas.width,
    canvas.height
  );
}

function loop() {
  updateMovement();
  updateCamera();
  render();
  drawCoach();
  requestAnimationFrame(loop);
}

function openRankModal() {
  state.keys.clear();
  loadProgress();
  renderProgress();
  renderMyScorePanel();
  el.rankModal.classList.remove('hidden');
  el.rankPostSave.classList.add('hidden');
  if (isTestMode()) {
    el.saveRank.disabled = true;
    el.saveRank.textContent = '평가용 저장 불가';
    el.rankPostSave.classList.remove('hidden');
    el.rankPostSave.querySelector('span').textContent = '평가용 모드에서는 랭킹에 기록되지 않습니다.';
  } else {
    el.saveRank.disabled = false;
    el.saveRank.textContent = '이 점수 저장';
    el.rankPostSave.querySelector('span').textContent = '랭킹에 저장되었습니다. 기록은 남기고 새 도전을 시작할 수 있어요.';
  }
  fetchRanks();
  requestAnimationFrame(() => {
    el.rankName.focus();
    el.rankName.select();
  });
}

function closeRankModal() {
  el.rankModal.classList.add('hidden');
  state.keys.clear();
}

const RANKING_API = '/api/ranking';
let rankCache = null; // 서버에서 받아온 랭킹 캐시

function readRanks() {
  if (rankCache !== null) return rankCache;
  try {
    const ranks = JSON.parse(localStorage.getItem(RANK_KEY));
    return Array.isArray(ranks) ? ranks : [];
  } catch (_) {
    return [];
  }
}

async function fetchRanks() {
  el.rankList.innerHTML = '<p class="empty-rank">불러오는 중...</p>';
  try {
    const r = await fetch(RANKING_API);
    if (!r.ok) throw new Error('fetch failed');
    const data = await r.json();
    rankCache = Array.isArray(data) ? data : [];
    localStorage.setItem(RANK_KEY, JSON.stringify(rankCache));
  } catch (_) {
    rankCache = readRanks(); // 실패 시 로컬 캐시 사용
  }
  renderRanks();
}

const GRADE_CONFIG = [
  { min: 3500, label: 'S', color: '#f3c451', bg: 'rgba(243,196,81,.15)' },
  { min: 2500, label: 'A', color: '#3ee68f', bg: 'rgba(62,230,143,.12)' },
  { min: 1500, label: 'B', color: '#4fc3ff', bg: 'rgba(79,195,255,.12)' },
  { min: 500,  label: 'C', color: '#9fb5c8', bg: 'rgba(159,181,200,.1)' },
  { min: 0,    label: 'D', color: '#608090', bg: 'rgba(96,128,144,.08)' },
];

function getGrade(score) {
  return GRADE_CONFIG.find(g => score >= g.min) || GRADE_CONFIG[GRADE_CONFIG.length - 1];
}

const MISSION_COLORS = ['#4fc3ff', '#ff6b6b', '#45d18c', '#f3c451'];
const MISSION_ICONS  = ['🏂', '🥌', '🪂', '🏅'];

function missionBarsHTML(missions) {
  return MISSIONS.map((m, i) => {
    const rawScore = missions ? (missions[i] || 0) : (getMissionRecord(m.id).score || 0);
    const score = window.ElabProgress ? window.ElabProgress.clampScore(rawScore) : Math.max(0, Math.min(1000, rawScore));
    const pct = Math.round((score / 1000) * 100);
    const cleared = score > 0;
    return `<div class="mission-bar-row" title="${m.title}: ${score}pt">
      <span class="mission-bar-icon">${MISSION_ICONS[i]}</span>
      <div class="mission-bar-track">
        <div class="mission-bar-fill" style="width:${pct}%;background:${cleared ? MISSION_COLORS[i] : 'rgba(255,255,255,.1)'}"></div>
      </div>
      <span class="mission-bar-score" style="color:${cleared ? MISSION_COLORS[i] : 'var(--muted)'}">${score}</span>
    </div>`;
  }).join('');
}

function renderMyScorePanel() {
  loadProgress();
  const total = getTotalScore();
  const g = getGrade(total);
  document.getElementById('myGradeBadge').textContent = g.label;
  document.getElementById('myGradeBadge').style.cssText = `color:${g.color};background:${g.bg};border-color:${g.color}55`;
  document.getElementById('myTotalScore').textContent = `${total.toLocaleString('ko-KR')} / 4,000 pt`;
  document.getElementById('myMissionBars').innerHTML = missionBarsHTML(null);
}

function renderRanks() {
  const ranks = readRanks()
    .sort((a, b) => b.score - a.score || a.savedAt.localeCompare(b.savedAt))
    .slice(0, 3);

  if (ranks.length === 0) {
    el.rankList.innerHTML = '<p class="empty-rank">아직 저장된 기록이 없습니다.</p>';
    return;
  }

  const medals = ['🥇', '🥈', '🥉'];
  const placeLabels = ['Champion', 'Runner-up', 'Third place'];
  el.rankList.innerHTML = ranks.map((rank, index) => {
    const s = Number(rank.score || 0);
    const g = getGrade(s);
    const indexLabel = medals[index] || `${index + 1}`;
    const date = rank.savedAt ? new Date(rank.savedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : '';
    return `
    <div class="rank-row rank-row-v2 rank-place-${index + 1}" data-rank="${index + 1}" style="border-color:${g.color}33;animation:rankSlideIn .35s ${index * 0.06}s ease both">
      <span class="rank-index-v2">${indexLabel}</span>
      <div class="rank-trophy-wrap" aria-hidden="true">
        <span class="rank-trophy">🏆</span>
        <span class="rank-place-label">${placeLabels[index] || `${index + 1} place`}</span>
      </div>
      <div class="rank-info">
        <strong class="rank-name">${escapeHtml(rank.name || '코치')}</strong>
        <div class="rank-mission-bars">${missionBarsHTML(rank.missions)}</div>
      </div>
      <div class="rank-right">
        <span class="grade-badge" style="color:${g.color};background:${g.bg};border-color:${g.color}55">${g.label}</span>
        <span class="rank-score" style="color:${g.color}">${s.toLocaleString('ko-KR')}</span>
        <span class="rank-date">${date}</span>
      </div>
    </div>`;
  }).join('');
}

async function saveRank() {
  loadProgress();
  if (isTestMode()) {
    el.rankPostSave.classList.remove('hidden');
    el.rankPostSave.querySelector('span').textContent = '평가용 모드에서는 랭킹에 기록되지 않습니다.';
    return;
  }
  const name = el.rankName.value.trim() || '코치';
  const missions = MISSIONS.map(m => getMissionRecord(m.id).score || 0);
  const total = getTotalScore();
  const prevBest = readRanks().reduce((m, r) => Math.max(m, Number(r.score || 0)), 0);
  const entry = { name, score: total, missions, savedAt: new Date().toISOString() };

  el.saveRank.disabled = true;
  el.saveRank.textContent = '저장 중...';

  try {
    const r = await fetch(RANKING_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!r.ok) throw new Error('save failed');
    rankCache = null; // 캐시 무효화 → 재조회
    await fetchRanks();
  } catch (_) {
    // 서버 실패 시 로컬에만 저장
    const ranks = readRanks();
    ranks.push(entry);
    rankCache = ranks;
    localStorage.setItem(RANK_KEY, JSON.stringify(ranks));
    renderRanks();
  } finally {
    el.saveRank.disabled = false;
    el.saveRank.textContent = '이 점수 저장';
  }

  el.rankPostSave.classList.toggle('hidden', total <= 0);
  el.rankPostSave.querySelector('span').textContent = '랭킹에 저장되었습니다. 기록은 남기고 새 도전을 시작할 수 있어요.';

  if (total > 0) {
    const badge = document.getElementById('myGradeBadge');
    badge.classList.remove('grade-new-best');
    void badge.offsetWidth;
    badge.classList.add('grade-new-best');
    showSaveCelebration(getGrade(total), total > prevBest);
  }
}

function showSaveCelebration(grade, isNewBest) {
  const panel = document.querySelector('#rankModal .rank-modal-panel') || document.querySelector('#rankModal .modal-panel');
  if (!panel) return;

  const label = isNewBest ? '🎉 신기록!' : '✅ 저장 완료!';
  const msg = document.createElement('div');
  msg.className = `save-toast save-toast-${grade.label.toLowerCase()}`;
  msg.innerHTML = `<span class="save-toast-grade">${grade.label}</span><span>${label}</span>`;
  msg.style.setProperty('--grade-color', grade.color);
  panel.appendChild(msg);
  setTimeout(() => msg.remove(), 2200);

  if (grade.label === 'S' || grade.label === 'A') {
    burstConfetti(panel, grade.label === 'S' ? 70 : 40);
  }
}

const CONFETTI_COLORS = ['#f3c451', '#3ee68f', '#4fc3ff', '#ff6b6b', '#ffffff'];

function burstConfetti(panel, count) {
  const layer = document.createElement('div');
  layer.className = 'confetti-layer';
  for (let i = 0; i < count; i += 1) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    const left = Math.random() * 100;
    const delay = Math.random() * 0.3;
    const duration = 1.6 + Math.random() * 1.1;
    const drift = (Math.random() - 0.5) * 160;
    const rotate = Math.random() * 720 - 360;
    const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    piece.style.setProperty('--left', `${left}%`);
    piece.style.setProperty('--delay', `${delay}s`);
    piece.style.setProperty('--duration', `${duration}s`);
    piece.style.setProperty('--drift', `${drift}px`);
    piece.style.setProperty('--rotate', `${rotate}deg`);
    piece.style.setProperty('--color', color);
    layer.appendChild(piece);
  }
  panel.appendChild(layer);
  setTimeout(() => layer.remove(), 3200);
}

function resetRunAfterRanking() {
  const ok = window.confirm('랭킹 기록은 남기고 미션 진행도만 초기화할까요?');
  if (!ok) return;

  setTestMode(false);
  localStorage.removeItem(SAVE_KEY);
  localStorage.removeItem(RETURN_ZONE_KEY);
  loadProgress();
  setZone('outside');
  renderMyScorePanel();
  renderRanks();
  el.rankPostSave.classList.add('hidden');
  el.rankName.focus();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function openReflection(spot, onContinue) {
  state.keys.clear();
  state.reflectionOpen = true;
  const reflection = spot.reflection || spot;

  const overlay = document.createElement('section');
  overlay.className = 'reflection-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML = `
    <div class="reflection-panel">
      <span class="reflection-kicker">COACH REFLECTION</span>
      <h2>${escapeHtml(spot.title)}</h2>
      <p>${escapeHtml(reflection.question)}</p>
      <div class="reflection-choices"></div>
      <div class="reflection-feedback" hidden></div>
      <button class="reflection-continue" type="button" hidden>포털 들어가기</button>
    </div>
  `;

  const choices = overlay.querySelector('.reflection-choices');
  const feedback = overlay.querySelector('.reflection-feedback');
  const next = overlay.querySelector('.reflection-continue');

  reflection.choices.forEach(choice => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = choice.label;
    button.className = 'reflection-choice';
    button.addEventListener('click', () => {
      choices.querySelectorAll('button').forEach(node => {
        node.disabled = true;
        const isCorrect = node.dataset.correct === 'true';
        node.classList.toggle('is-correct', isCorrect);
      });
      button.classList.toggle('is-wrong', !choice.correct);
      feedback.hidden = false;
      feedback.textContent = choice.feedback;
      next.hidden = false;
      next.focus();
    });
    button.dataset.correct = choice.correct ? 'true' : 'false';
    choices.appendChild(button);
  });

  next.addEventListener('click', () => {
    overlay.remove();
    state.reflectionOpen = false;
    state.keys.clear();
    if (typeof onContinue === 'function') onContinue();
  });

  document.body.appendChild(overlay);
  const firstChoice = choices.querySelector('button');
  if (firstChoice) firstChoice.focus();
}

function isModalOpen(modal) {
  return !modal.classList.contains('hidden');
}

function getActiveModal() {
  if (isModalOpen(el.rankModal)) return el.rankModal;
  if (isModalOpen(el.notebookModal)) return el.notebookModal;
  if (isModalOpen(el.badgeModal)) return el.badgeModal;
  return null;
}

function isTextEntryTarget(target) {
  return target instanceof HTMLInputElement
    || target instanceof HTMLTextAreaElement
    || target instanceof HTMLSelectElement
    || target?.isContentEditable;
}

function focusableNodes(root) {
  return Array.from(root.querySelectorAll('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'))
    .filter(node => !node.disabled && node.offsetParent !== null);
}

function trapModalFocus(modal, event) {
  const nodes = focusableNodes(modal);
  if (nodes.length === 0) return;
  const first = nodes[0];
  const last = nodes[nodes.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function bindInput() {
  document.addEventListener('keydown', event => {
    if (state.reflectionOpen) {
      const inReflection = event.target?.closest?.('.reflection-overlay');
      if (inReflection && (event.code === 'Enter' || event.code === 'Space' || event.code === 'Tab')) {
        return;
      }
      event.preventDefault();
      state.keys.clear();
      return;
    }

    const activeModal = getActiveModal();
    if (activeModal) {
      if (event.code === 'Escape') {
        event.preventDefault();
        if (activeModal === el.rankModal) closeRankModal();
        else if (activeModal === el.badgeModal) closeBadgeModal();
        else closeNotebookModal();
        return;
      }
      if (event.code === 'Tab') {
        trapModalFocus(activeModal, event);
        return;
      }
      state.keys.clear();
      return;
    }

    if (isTextEntryTarget(event.target)) return;

    if (event.code === 'Space') {
      event.preventDefault();
      activateNearest();
      return;
    }
    state.keys.add(event.code);
  });

  document.addEventListener('keyup', event => {
    state.keys.delete(event.code);
  });

  const hold = (button, code) => {
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      state.keys.add(code);
      button.setPointerCapture(event.pointerId);
    });
    button.addEventListener('pointerup', () => state.keys.delete(code));
    button.addEventListener('pointercancel', () => state.keys.delete(code));
    button.addEventListener('pointerleave', () => state.keys.delete(code));
  };

  hold(el.touchLeft, 'TouchLeft');
  hold(el.touchRight, 'TouchRight');
  el.touchAction.addEventListener('click', activateNearest);

  el.storyBubbleClose.addEventListener('click', () => {
    if (state.tutorialStep >= 0) advanceTutorial();
    else hideStoryBubble();
  });

  el.openNotebook.addEventListener('click', openNotebookModal);
  el.closeNotebook.addEventListener('click', closeNotebookModal);
  el.openBadges.addEventListener('click', openBadgeModal);
  el.openHelp.addEventListener('click', openHelp);
  if (el.toggleTestMode) el.toggleTestMode.addEventListener('click', toggleTestMode);
  el.closeBadge.addEventListener('click', closeBadgeModal);
  el.badgeModal.addEventListener('click', event => {
    if (event.target === el.badgeModal) closeBadgeModal();
  });
  document.getElementById('downloadCert').addEventListener('click', downloadCertificate);
  el.notebookCards.addEventListener('click', e => {
    const choiceButton = e.target.closest('.nb-ai-choice');
    if (choiceButton) {
      e.stopPropagation();
      handleNotebookAiChoice(choiceButton);
      return;
    }
    const aiButton = e.target.closest('.nb-ai-btn');
    if (aiButton) {
      e.stopPropagation();
      requestNotebookAiQuestion(aiButton);
      return;
    }
    if (e.target.closest('.nb-ai-box')) {
      e.stopPropagation();
      return;
    }
    const card = e.target.closest('.nb-flip-card[data-mission]');
    if (card) card.classList.toggle('is-flipped');
  });
  el.notebookModal.addEventListener('click', event => {
    if (event.target === el.notebookModal) closeNotebookModal();
  });

  el.closeRank.addEventListener('click', closeRankModal);
  el.saveRank.addEventListener('click', saveRank);
  el.resetRunAfterRank.addEventListener('click', resetRunAfterRanking);
  el.rankModal.addEventListener('click', event => {
    if (event.target === el.rankModal) closeRankModal();
  });

  el.resetProgress.addEventListener('click', () => {
    const ok = window.confirm('미션 점수와 랭킹을 모두 초기화할까요?');
    if (!ok) return;
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(RANK_KEY);
    localStorage.removeItem(TUTORIAL_KEY);
    localStorage.removeItem(RETURN_ZONE_KEY);
    setTestMode(false);
    if (window.ElabBadges) window.ElabBadges.reset();
    loadProgress();
    setZone('outside');
    renderHotspots();
    renderProgress();
    renderRanks();
  });

  window.addEventListener('pageshow', () => {
    loadProgress();
    renderHotspots();
    renderProgress();
    checkBadgesOnLoad();
    const line = getStoryLine(state.zoneId);
    if (line) showStoryBubble(line);
  });

  window.addEventListener('resize', () => {
    updateWorldMetrics(true);
    render();
  });
}

function init() {
  setTestMode(isTestMode());
  loadProgress();
  loadSprites();
  bindInput();

  const params = new URLSearchParams(window.location.search);
  const fromMission = params.get('back');
  const savedZone = fromMission ? localStorage.getItem(RETURN_ZONE_KEY) : null;

  if (fromMission) {
    window.history.replaceState({}, '', window.location.pathname);
  }

  setZone(savedZone && ZONES[savedZone] ? savedZone : 'outside');
  initTutorial();
  requestAnimationFrame(loop);
}

init();
