'use strict';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const G = 9.8;
const MASS = 68;
const PIPE_HALF = 17;
const PIPE_HEIGHT = 9.6;
const LIP_T = 0.9995;
const LIP_X = PIPE_HALF * LIP_T;
const PIPE_DENOM = 1 - Math.sqrt(1 - LIP_T * LIP_T);
const START_X = -LIP_X + 0.15;
const TARGET_LANDINGS = 5;
const RUN_TIME = 75;
const AIR_SLOWMO = 0.62;

const ui = {
  score: document.getElementById('score-value'),
  target: document.getElementById('target-value'),
  time: document.getElementById('time-value'),
  ep: document.getElementById('ep-value'),
  ek: document.getElementById('ek-value'),
  total: document.getElementById('total-value'),
  epBar: document.getElementById('ep-bar'),
  ekBar: document.getElementById('ek-bar'),
  totalBar: document.getElementById('total-bar'),
  energyNote: document.getElementById('energy-note'),
  epStack: document.getElementById('ep-stack'),
  ekStack: document.getElementById('ek-stack'),
  conservationBadge: document.getElementById('conservation-badge'),
  height: document.getElementById('height-value'),
  speed: document.getElementById('speed-value'),
  peak: document.getElementById('peak-value'),
  combo: document.getElementById('combo-value'),
  event: document.getElementById('event-text'),
  friction: document.getElementById('friction-slider'),
  frictionReadout: document.getElementById('friction-readout'),
  start: document.getElementById('start-btn'),
  reset: document.getElementById('reset-btn'),
  modal: document.getElementById('result-modal'),
  resultKicker: document.getElementById('result-kicker'),
  resultTitle: document.getElementById('result-title'),
  resultCopy: document.getElementById('result-copy'),
  resultScore: document.getElementById('result-score'),
  resultStyleScore: document.getElementById('result-style-score'),
  again: document.getElementById('again-btn'),
  complete: document.getElementById('complete-btn')
};

const input = {
  left: false,
  right: false,
  pump: false
};

const state = {
  mode: 'idle',
  phase: 'pipe',
  timeLeft: RUN_TIME,
  score: 0,
  landings: 0,
  x: 0,
  v: 9.5,
  px: 0,
  py: 0,
  vx: 0,
  vy: 0,
  boardAngle: 0,
  angularVelocity: 0,
  rotation: 0,
  airTime: 0,
  combo: 1,
  maxHeight: 0,
  maxSpeed: 0,
  pumpEnergy: 0,
  baseEnergy: 0,
  pumpCooldown: 0,
  lastDirection: 1,
  lastWall: 0,
  messageTimer: 0,
  particles: []
};

const tutorial = {
  active: false,
  step: 0,
  target: null,
  steps: [
    {
      selector: '.score-strip',
      kicker: 'Mission 01 - Training',
      title: '목표는 착지 5회',
      goal: '파이프를 오르내리며 공중 자세를 맞추고 착지 5회를 성공하면 미션을 완료할 수 있습니다.',
      controls: [
        ['목표', '착지 5회 성공'],
        ['점수', '착지 각도와 속도 보존이 좋을수록 상승'],
        ['시간', '75초 안에 최대한 안정적으로 착지']
      ],
      next: '조작 보기'
    },
    {
      selector: '.control-panel',
      kicker: 'Mission 01 - Controls',
      title: 'Space와 방향키를 씁니다',
      goal: '바닥이나 립 근처에서 Space를 누르면 에너지를 더하고, 공중에서는 방향키로 보드 각도를 조절합니다.',
      controls: [
        ['SPACE', '바닥 펌프 / 립 펌프'],
        ['← →', '공중에서 보드 각도 조절'],
        ['착지선', '초록 착지선과 보드 각도를 맞추기']
      ],
      next: '에너지 보기'
    },
    {
      selector: '.energy-panel',
      kicker: 'Mission 01 - Energy',
      title: 'Ep와 Ek를 관찰하세요',
      goal: '올라갈 때는 위치에너지 Ep가 커지고, 내려올 때는 운동에너지 Ek가 커집니다. 합이 어떻게 유지되는지 보세요.',
      controls: [
        ['Ep', '높이에 따른 위치에너지'],
        ['Ek', '속도에 따른 운동에너지'],
        ['Ep + Ek', '두 에너지의 합']
      ],
      next: '훈련 시작'
    }
  ]
};

const flakes = Array.from({ length: 90 }, (_, i) => ({
  x: fract(Math.sin(i * 91.7) * 43758.5453),
  y: fract(Math.sin(i * 43.2 + 8.1) * 24634.6345),
  r: 0.6 + fract(Math.sin(i * 12.9) * 1000) * 1.4,
  s: 0.18 + fract(Math.sin(i * 6.3) * 1000) * 0.45
}));

let raf = null;
let lastTs = 0;

let view = { w: 0, h: 0, scale: 1, cx: 0, base: 0 };
const THREE_PIPE_LENGTH = 78;
const T3 = {
  ready: false,
  scene: null,
  camera: null,
  renderer: null,
  pipe: null,
  rider: null,
  riderSpin: null,
  riderParts: [],
  riderPose: null,
  board: null,
  landingGuide: null,
  slopeGuide: null,
  boardGuide: null,
  snow: null,
  scoreboardTexture: null,
  scoreboardCtx: null,
  scoreboardMesh: null,
  lastScoreboardText: '',
};

function fract(n) {
  return n - Math.floor(n);
}

function pipeHeight(x) {
  const t = Math.min(LIP_T, Math.abs(x) / PIPE_HALF);
  return PIPE_HEIGHT * (1 - Math.sqrt(1 - t * t)) / PIPE_DENOM;
}

function pipeSlope(x) {
  const sign = Math.sign(x) || 1;
  const t = Math.min(LIP_T, Math.abs(x) / PIPE_HALF);
  const slopeMag = PIPE_HEIGHT * t / (PIPE_HALF * PIPE_DENOM * Math.sqrt(1 - t * t));
  return sign * slopeMag;
}

function toScreen(x, y) {
  return {
    x: view.cx + x * view.scale,
    y: view.base - y * view.scale
  };
}

function resize() {
  const ratio = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.floor(canvas.clientWidth * ratio);
  canvas.height = Math.floor(canvas.clientHeight * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  view.w = canvas.clientWidth;
  view.h = canvas.clientHeight;
  view.scale = Math.min(view.w / 52, view.h / 23);
  view.cx = view.w * 0.5;
  view.base = view.h * 0.76;
  resizeThree();
}

function resetRun(startMode = 'idle') {
  state.mode = startMode;
  state.phase = 'pipe';
  state.timeLeft = RUN_TIME;
  state.score = 0;
  state.landings = 0;
  state.x = START_X;
  state.v = 0;
  state.px = START_X;
  state.py = pipeHeight(START_X);
  state.vx = 0;
  state.vy = 0;
  state.boardAngle = Math.atan(pipeSlope(START_X));
  state.angularVelocity = 0;
  state.rotation = 0;
  state.airTime = 0;
  state.combo = 1;
  state.maxHeight = state.py;
  state.maxSpeed = 0;
  state.pumpEnergy = 0;
  state.baseEnergy = MASS * G * state.py + 0.5 * MASS * state.v * state.v;
  state.pumpCooldown = 0;
  state.lastDirection = 1;
  state.lastWall = 0;
  state.messageTimer = 0;
  state.particles = [];
  _ehIdx = 0; _ehLen = 0;
  ui.modal.classList.remove('show');
  setEvent(
    startMode === 'running'
      ? '위치에너지가 운동에너지로 바뀌며 자연스럽게 내려옵니다.'
      : '왼쪽 꼭대기에서 대기 중입니다. 시작을 누르면 내려옵니다.',
    1.8
  );
  updateUi();
}

function setEvent(text, seconds = 1.4) {
  ui.event.textContent = text;
  state.messageTimer = seconds;
}

function clearTutorialTarget() {
  if (tutorial.target) tutorial.target.classList.remove('m1-tutorial-target');
  tutorial.target = null;
}

function updateTutorialSpotlight(overlay) {
  if (!overlay || !tutorial.target) return;
  const rect = tutorial.target.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const r = Math.max(120, Math.min(360, Math.max(rect.width, rect.height) / 2 + 56));
  overlay.style.setProperty('--tutorial-x', `${x}px`);
  overlay.style.setProperty('--tutorial-y', `${y}px`);
  overlay.style.setProperty('--tutorial-r', `${r}px`);
}

function renderTutorial() {
  const overlay = document.getElementById('game-tutorial');
  if (!overlay) return;
  const item = tutorial.steps[tutorial.step];
  clearTutorialTarget();
  tutorial.target = document.querySelector(item.selector);
  if (tutorial.target) tutorial.target.classList.add('m1-tutorial-target');
  updateTutorialSpotlight(overlay);

  overlay.innerHTML = `
    <div class="gt-card">
      <div class="gt-kicker">${item.kicker}</div>
      <h2 class="gt-title">${item.title}</h2>
      <div class="gt-progress" aria-hidden="true">
        ${tutorial.steps.map((_, index) => `<span class="${index < tutorial.step ? 'is-done' : index === tutorial.step ? 'is-active' : ''}"></span>`).join('')}
      </div>
      <div class="gt-goal">
        <span class="gt-goal-icon">✓</span>
        <div>
          <strong>${item.title}</strong>
          <p>${item.goal}</p>
        </div>
      </div>
      <div class="gt-controls">
        ${item.controls.map(([key, desc]) => `
          <div class="gt-ctrl-row">
            <kbd>${key}</kbd>
            <div><strong>${key}</strong><span>${desc}</span></div>
          </div>
        `).join('')}
      </div>
      <div class="gt-action-row">
        <button id="gt-skip" class="gt-skip-btn" type="button">건너뛰기</button>
        <button id="gt-start" class="gt-start-btn" type="button">${item.next}</button>
      </div>
    </div>
  `;
  overlay.classList.remove('hidden');
  overlay.querySelector('#gt-skip').addEventListener('click', finishTutorial);
  overlay.querySelector('#gt-start').addEventListener('click', nextTutorialStep);
}

function startMission1Tutorial() {
  tutorial.active = true;
  tutorial.step = 0;
  renderTutorial();
}

function finishTutorial() {
  const overlay = document.getElementById('game-tutorial');
  tutorial.active = false;
  clearTutorialTarget();
  if (overlay) overlay.classList.add('hidden');
  setEvent('시작 버튼을 누르고 Space와 방향키로 착지 5회를 노려보세요.', 2.2);
}

function nextTutorialStep() {
  if (tutorial.step >= tutorial.steps.length - 1) {
    finishTutorial();
    return;
  }
  tutorial.step += 1;
  renderTutorial();
}

window.startMission1Tutorial = startMission1Tutorial;

function startRun() {
  resetRun('running');
}

function finishRun() {
  state.mode = 'finished';
  const cleared = state.landings >= TARGET_LANDINGS;

  ui.resultKicker.textContent = cleared ? 'Mission Clear' : 'Run Complete';
  ui.resultTitle.textContent = cleared ? '착지 목표 달성' : '라이딩 종료';
  ui.resultCopy.textContent = cleared
    ? 'Clean, Big Air, Spin, Energy Flow 보너스로 에너지 전환 흐름을 만들었습니다.'
    : '착지 각도와 속도 보존이 좋아질수록 Energy Flow 점수가 커집니다.';
  ui.resultScore.textContent = `${state.landings} / ${TARGET_LANDINGS}`;
  ui.resultStyleScore.textContent = Math.min(1000, Math.round(state.score / 40)).toLocaleString('ko-KR');
  ui.complete.classList.toggle('locked', !cleared);
  ui.modal.classList.add('show');
  updateUi();
}

function update(dt) {
  if (state.mode !== 'running') return;

  state.timeLeft -= dt;
  state.pumpCooldown = Math.max(0, state.pumpCooldown - dt);
  state.messageTimer = Math.max(0, state.messageTimer - dt);
  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    finishRun();
    return;
  }

  if (state.phase === 'pipe') updatePipe(dt);
  else updateAir(dt * AIR_SLOWMO);

  updateParticles(dt);
  updateUi();

  if (state.landings >= TARGET_LANDINGS) {
    finishRun();
  }
}

function updatePipe(dt) {
  const slope = pipeSlope(state.x);
  const dsDx = Math.sqrt(1 + slope * slope);
  const frictionLevel = 0;
  const previousV = state.v;
  const gravityAlong = -G * slope / dsDx;
  const drag = frictionLevel * state.v * Math.abs(state.v) * 0.045;
  let acc = gravityAlong - drag;

  const nearBottom = Math.abs(state.x) < 4.3;
  const movingFast = Math.abs(state.v) > 4.4;
  if (input.pump && nearBottom && movingFast && state.pumpCooldown <= 0) {
    const timing = 1 - Math.abs(state.x) / 4.3;
    const gain = 0.55 + timing * 0.75;
    state.v += Math.sign(state.v || state.lastDirection) * gain;
    state.pumpEnergy += MASS * Math.abs(state.v) * gain;
    state.pumpCooldown = 0.34;
    addScore(70 + timing * 95, '바닥 펌프');
    burst(state.x, pipeHeight(state.x), '#3ee68f', 18);
  }

  const oldX = state.x;
  state.v += acc * dt;
  state.x += (state.v / dsDx) * dt;
  state.px = state.x;
  state.py = pipeHeight(state.x);
  state.boardAngle = Math.atan(pipeSlope(state.x));

  const speed = Math.abs(state.v);
  state.maxSpeed = Math.max(state.maxSpeed, speed);
  state.maxHeight = Math.max(state.maxHeight, state.py);

  if (Math.abs(previousV) > 0.3 && Math.sign(previousV) !== Math.sign(state.v) && Math.abs(oldX) > 6) {
    scoreWallPeak(pipeHeight(oldX));
  }

  if (Math.abs(state.x) >= LIP_X && state.x * state.v > 0) {
    launchFromLip();
    return;
  }

  if (Math.abs(state.x) > LIP_X) {
    state.x = Math.sign(state.x) * LIP_X;
    state.v *= -0.72;
    state.combo = Math.max(1, state.combo * 0.82);
  }
}

function launchFromLip() {
  const x = Math.sign(state.x) * LIP_X;
  const slope = pipeSlope(x);
  const dsDx = Math.sqrt(1 + slope * slope);
  const tangentVx = state.v / dsDx;
  const tangentVy = slope * tangentVx;
  const normal = normalize({ x: -slope, y: 1 });
  let popImpulse = 0.45;
  if (input.pump && state.pumpCooldown <= 0) {
    popImpulse = 1.45;
    state.pumpEnergy += MASS * Math.abs(state.v) * popImpulse;
    state.pumpCooldown = 0.45;
    addScore(180, '립 팝');
  }
  state.phase = 'air';
  state.px = x - Math.sign(x) * 0.03;
  state.py = pipeHeight(x);
  state.vx = tangentVx + normal.x * popImpulse;
  state.vy = tangentVy + normal.y * popImpulse;
  state.x = x;
  state.airTime = 0;
  state.rotation = 0;
  state.angularVelocity = ((input.right ? 1 : 0) - (input.left ? 1 : 0)) * 3.6;
  state.boardAngle = Math.atan(slope);
  setEvent('초록 착지선과 보드 각도를 맞추세요.', 1.4);
}

function updateAir(dt) {
  const lean = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const frictionLevel = 0;
  const controlBoost = 1 / AIR_SLOWMO;
  state.airTime += dt;
  state.vy -= G * dt;
  state.vx *= 1 - frictionLevel * 0.18 * dt;
  state.vy *= 1 - frictionLevel * 0.12 * dt;
  state.angularVelocity += lean * dt * 5.2 * controlBoost;
  state.angularVelocity *= 0.997;
  state.boardAngle += state.angularVelocity * dt;
  state.rotation += Math.abs(state.angularVelocity * dt);
  state.px += state.vx * dt;
  state.py += state.vy * dt;
  state.maxSpeed = Math.max(state.maxSpeed, Math.hypot(state.vx, state.vy));
  state.maxHeight = Math.max(state.maxHeight, state.py);

  const landingX = Math.max(-LIP_X, Math.min(LIP_X, state.px));
  const surface = pipeHeight(landingX);
  const insidePipe = Math.abs(state.px) <= LIP_X + 1.2;
  if (insidePipe && state.py <= surface && state.vy < 0) {
    landOnPipe(landingX, surface);
  }

  if (Math.abs(state.px) > LIP_X + 5 || state.py < -2) {
    state.px = Math.sign(state.px) * LIP_X;
    state.py = pipeHeight(state.px);
    state.v = -Math.sign(state.px) * 4;
    state.phase = 'pipe';
    state.combo = 1;
    setEvent('파이프 밖으로 밀렸습니다. 속도를 다시 모으세요.', 1.4);
  }
}

function landOnPipe(x, surface) {
  const slope = pipeSlope(x);
  const tangent = normalize({ x: 1, y: slope });
  const incomingSpeed = Math.hypot(state.vx, state.vy);
  const velocityAlong = state.vx * tangent.x + state.vy * tangent.y;
  const tangentAngle = Math.atan(slope);
  const angleError = smallestAngle(state.boardAngle, tangentAngle);
  const impact = Math.abs(state.vy);
  const quality = Math.max(0, 1 - Math.abs(angleError) / 1.55) * Math.max(0.2, 1 - Math.max(0, impact - 9) / 12);

  state.x = x;
  state.py = surface;
  const frictionLoss = 1;
  state.v = velocityAlong * frictionLoss;
  state.phase = 'pipe';
  state.boardAngle = tangentAngle;

  const rotations = state.rotation / (Math.PI * 2);
  if (quality > 0.36) {
    state.landings += 1;
    if (rotations >= 2 && window.ElabBadges) window.ElabBadges.unlockWithToast('spin720');
    const landingScore = scoreLandingAction({
      quality,
      rotations,
      height: surface,
      incomingSpeed,
      exitSpeed: Math.abs(state.v),
      angleError
    });
    state.combo = Math.min(5, state.combo + 0.25 + rotations * 0.42);
    addScore(landingScore.total, landingScore.message);
    burst(x, surface + 0.4, quality > 0.72 ? '#30d5ff' : '#ffb347', 22);
  } else {
    state.v *= 0.45;
    state.combo = 1;
    addScore(-180, '착지 흔들림\n접선 각도가 맞지 않아 에너지 흐름이 끊겼습니다.');
    burst(x, surface + 0.2, '#ff4d5e', 16);
  }
}

function scoreLandingAction({ quality, rotations, height, incomingSpeed, exitSpeed, angleError }) {
  const parts = [];
  const base = 300;
  parts.push({ name: 'Landing', points: base });

  const clean = Math.round(520 * quality);
  if (quality > 0.68) parts.push({ name: 'Clean', points: clean });
  else if (quality > 0.48) parts.push({ name: 'Stable', points: Math.round(clean * 0.62) });

  const bigAir = Math.round(Math.max(0, height - 3.2) * 78);
  if (bigAir > 0) parts.push({ name: 'Big Air', points: bigAir });

  const fastTransfer = Math.round(Math.min(520, exitSpeed * 34));
  if (exitSpeed > 8.5) parts.push({ name: 'Fast Transfer', points: fastTransfer });

  let spin = 0;
  let spinName = '';
  if (rotations >= 3) {
    spin = 1600;
    spinName = '1080 Spin';
  } else if (rotations >= 2) {
    spin = 1000;
    spinName = '720 Spin';
  } else if (rotations >= 1) {
    spin = 500;
    spinName = '360 Spin';
  }
  if (spin > 0) parts.push({ name: spinName, points: spin });

  const energyRatio = incomingSpeed > 0.1 ? Math.abs(exitSpeed) / incomingSpeed : 0;
  let flow = 0;
  if (energyRatio > 0.9) flow = 520;
  else if (energyRatio > 0.75) flow = 270;
  else if (energyRatio > 0.58) flow = 110;
  if (flow > 0) parts.push({ name: 'Energy Flow', points: flow });

  const total = parts.reduce((sum, part) => sum + part.points, 0);
  const title = quality > 0.72 ? 'Clean Landing' : 'Stable Landing';
  const topPart = parts
    .filter((part) => part.name !== 'Landing')
    .sort((a, b) => b.points - a.points)
    [0];
  const concept = makeLandingConcept({ height, exitSpeed, energyRatio, angleError });
  const bonus = topPart ? `핵심 보너스: ${topPart.name}` : '기본 착지';
  return {
    total,
    title,
    message: `${title} +${Math.round(total / 15)}점\n${bonus} · ${concept}`
  };
}

function makeLandingConcept({ height, exitSpeed, energyRatio, angleError }) {
  if (energyRatio > 0.9) return '운동에너지가 다음 상승으로 잘 이어졌습니다.';
  if (height > 6.2) return '높은 위치의 Ep가 다시 Ek로 전환됩니다.';
  if (exitSpeed > 10.5) return '낮은 곳에서 Ek가 크게 살아났습니다.';
  if (Math.abs(angleError) < 0.28) return '접선 착지로 에너지 손실을 줄였습니다.';
  return '착지 각도가 에너지 흐름을 결정합니다.';
}

function scoreWallPeak(height) {
  if (height < 1.2) return;
  const freshWall = Math.sign(state.x) !== state.lastWall;
  state.lastWall = Math.sign(state.x);
  const points = height * 58 * (freshWall ? 1 : 0.55);
  state.combo = Math.min(5, state.combo + 0.08);
  addScore(points, `${height.toFixed(1)} m 벽타기`);
}

function addScore(raw, label) {
  const gained = Math.round(raw > 0 ? raw * state.combo : raw);
  state.score = Math.max(0, state.score + gained);
  if (!label) return;
  const alreadyShowsPoints = /[+-]\d+점/.test(label);
  const displayGained = Math.round(gained / 15);
  const suffix = alreadyShowsPoints ? '' : `  ${displayGained > 0 ? '+' : ''}${displayGained}점`;
  setEvent(`${label}${suffix}`, 1.15);
}

function normalize(v) {
  const len = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / len, y: v.y / len };
}

function smallestAngle(a, b) {
  let d = (a - b + Math.PI) % (Math.PI * 2) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function burst(x, y, color, count) {
  for (let i = 0; i < count; i += 1) {
    const a = -Math.PI / 2 + (fract(Math.sin(i * 28.91 + state.score) * 2000) - 0.5) * Math.PI * 1.2;
    const s = 1.5 + fract(Math.sin(i * 19.7 + state.timeLeft) * 500) * 4.4;
    state.particles.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: 0.75,
      color
    });
  }
}

function updateParticles(dt) {
  for (const p of state.particles) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy -= G * 0.28 * dt;
  }
  state.particles = state.particles.filter((p) => p.life > 0);
}

function currentHeight() {
  return state.phase === 'pipe' ? pipeHeight(state.x) : Math.max(0, state.py);
}

function currentSpeed() {
  return state.phase === 'pipe' ? Math.abs(state.v) : Math.hypot(state.vx, state.vy);
}

let _lastLandings = -1;

function updateUi() {
  const height = currentHeight();
  const speed = currentSpeed();
  const ep = MASS * G * height;
  const ek = 0.5 * MASS * speed * speed;
  const total = Math.max(1, ep + ek);
  const base = Math.max(1, state.baseEnergy);
  const conservationError = ((total - base) / base) * 100;

  const landingText = `${state.landings} / ${TARGET_LANDINGS}`;
  if (state.landings !== _lastLandings) {
    _lastLandings = state.landings;
    ui.score.textContent = landingText;
    ui.score.classList.remove('score-pop');
    void ui.score.offsetWidth; // reflow to restart animation
    ui.score.classList.add('score-pop');
  }
  ui.target.textContent = Math.min(1000, Math.round(state.score / 40)).toLocaleString('ko-KR');
  ui.time.textContent = state.timeLeft.toFixed(1);
  ui.ep.textContent = `${Math.round(ep).toLocaleString('ko-KR')} J`;
  ui.ek.textContent = `${Math.round(ek).toLocaleString('ko-KR')} J`;
  ui.total.textContent = `${Math.round(total).toLocaleString('ko-KR')} J`;
  ui.epBar.style.width = `${Math.min(100, (ep / total) * 100)}%`;
  ui.ekBar.style.width = `${Math.min(100, (ek / total) * 100)}%`;
  ui.totalBar.style.width = `${Math.min(100, (total / base) * 100)}%`;

  // 스택 바: ep와 ek를 같은 트랙에 표시 → 총합이 일정함을 시각적으로 증명
  const epPct = Math.min(100, (ep / base) * 100);
  const ekPct = Math.min(100, (ek / base) * 100);
  ui.epStack.style.width = `${epPct}%`;
  ui.ekStack.style.width = `${ekPct}%`;

  // 보존 배지
  const absErr = Math.abs(conservationError);
  if (state.mode === 'running' && state.pumpEnergy < 1) {
    if (absErr < 3) {
      ui.conservationBadge.textContent = '✓ 보존됨';
      ui.conservationBadge.className = 'badge-ok';
    } else {
      ui.conservationBadge.textContent = `오차 ${conservationError.toFixed(1)}%`;
      ui.conservationBadge.className = 'badge-warn';
    }
  } else {
    ui.conservationBadge.textContent = '';
    ui.conservationBadge.className = '';
  }

  if (Number(ui.friction.value) === 0 && state.pumpEnergy < 1) {
    ui.energyNote.textContent = `Ep + Ek = ${Math.round(base).toLocaleString('ko-KR')} J  ·  마찰 없음, 총합 보존`;
  } else if (Number(ui.friction.value) === 0) {
    ui.energyNote.textContent = `펌프로 한 일: +${Math.round(state.pumpEnergy).toLocaleString('ko-KR')} J 추가됨`;
  } else {
    ui.energyNote.textContent = '마찰 손실 적용: 역학적 에너지가 서서히 줄어듭니다.';
  }
  ui.height.textContent = height.toFixed(1);
  ui.speed.textContent = speed.toFixed(1);
  ui.peak.textContent = state.maxHeight.toFixed(1);
  ui.combo.textContent = state.combo.toFixed(1);
  ui.frictionReadout.textContent = ui.friction.value;

  if (state.mode === 'running') {
    _ehEp[_ehIdx] = ep;
    _ehEk[_ehIdx] = ek;
    _ehIdx = (_ehIdx + 1) % 160;
    if (_ehLen < 160) _ehLen++;
  }
  drawEnergyGraph();
}

const _ehEp = new Float32Array(160);
const _ehEk = new Float32Array(160);
let _ehIdx = 0;
let _ehLen = 0;

let _graphCanvas = null;
let _graphCtx = null;
let _graphW = 0;
let _graphH = 0;

function initEnergyGraph() {
  _graphCanvas = document.getElementById('energy-graph');
  if (!_graphCanvas) return;
  _graphCtx = _graphCanvas.getContext('2d');
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const rect = _graphCanvas.getBoundingClientRect();
  _graphW = rect.width;
  _graphH = rect.height;
  _graphCanvas.width = Math.floor(_graphW * dpr);
  _graphCanvas.height = Math.floor(_graphH * dpr);
  _graphCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawEnergyGraph() {
  if (!_graphCtx || !_graphW || _ehLen < 2) return;
  const w = _graphW;
  const h = _graphH;
  _graphCtx.clearRect(0, 0, w, h);
  _graphCtx.fillStyle = 'rgba(0,0,0,0.18)';
  _graphCtx.fillRect(0, 0, w, h);
  _graphCtx.strokeStyle = 'rgba(255,255,255,0.07)';
  _graphCtx.lineWidth = 1;
  for (let i = 1; i < 3; i++) {
    _graphCtx.beginPath();
    _graphCtx.moveTo(0, (h * i) / 3);
    _graphCtx.lineTo(w, (h * i) / 3);
    _graphCtx.stroke();
  }
  const base = Math.max(state.baseEnergy, 1);
  let maxE = base;
  for (let i = 0; i < _ehLen; i++) {
    const j = (_ehIdx - _ehLen + i + 160) % 160;
    const s = _ehEp[j] + _ehEk[j];
    if (s > maxE) maxE = s;
  }
  _drawEnergyLine(_ehEp, '#ffcf5b', maxE, w, h);
  _drawEnergyLine(_ehEk, '#3ee68f', maxE, w, h);
}

function _drawEnergyLine(arr, color, maxE, w, h) {
  _graphCtx.strokeStyle = color;
  _graphCtx.lineWidth = 1.8;
  _graphCtx.beginPath();
  for (let i = 0; i < _ehLen; i++) {
    const j = (_ehIdx - _ehLen + i + 160) % 160;
    const x = (w * i) / (_ehLen - 1);
    const y = h - (arr[j] / maxE) * (h - 6) - 3;
    if (i === 0) _graphCtx.moveTo(x, y);
    else _graphCtx.lineTo(x, y);
  }
  _graphCtx.stroke();
}

function loop(ts) {
  if (!lastTs) lastTs = ts;
  const dt = Math.min(0.033, (ts - lastTs) / 1000);
  lastTs = ts;

  update(dt);
  draw();

  raf = requestAnimationFrame(loop);
}

function bindControls() {
  window.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') input.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') input.right = true;
    if (e.code === 'Space') {
      input.pump = true;
      e.preventDefault();
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') input.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') input.right = false;
    if (e.code === 'Space') input.pump = false;
  });

  document.querySelectorAll('.touch-btn').forEach((button) => {
    const control = button.dataset.control;
    const down = (e) => {
      e.preventDefault();
      input[control] = true;
    };
    const up = (e) => {
      e.preventDefault();
      input[control] = false;
    };
    button.addEventListener('pointerdown', down);
    button.addEventListener('pointerup', up);
    button.addEventListener('pointercancel', up);
    button.addEventListener('pointerleave', up);
  });

  ui.start.addEventListener('click', startRun);
  ui.reset.addEventListener('click', () => resetRun('idle'));
  ui.again.addEventListener('click', startRun);
  ui.complete.addEventListener('click', () => {
    if (state.landings < TARGET_LANDINGS) {
      setEvent(`착지 ${TARGET_LANDINGS}회를 먼저 성공해야 합니다.`, 1.4);
      ui.modal.classList.remove('show');
      return;
    }
    const missionScore = ElabProgress.clampScore(Math.round(state.score / 40));
    ElabProgress.saveMission(1, 'clear', missionScore);
    if (window.ElabBadges) window.ElabBadges.unlockWithToast('conserve');
    MissionUI.askCoachQuestion({
      speaker: '코치 확인 퀴즈',
      question: '파이프 바닥에서 라이더 속도가 가장 빠른 이유는?',
      choices: [
        { label: 'Ek + Ep = 일정이라, 높이(Ep)가 낮을수록 속도(Ek)가 커진다', correct: true,
          feedback: '맞아. Ep = mgh가 줄어드는 만큼 Ek = ½mv²가 늘어나. 총합은 항상 일정해.' },
        { label: '마찰이 없어서 에너지가 새로 만들어지기 때문이다', correct: false,
          feedback: '새 에너지가 생기는 게 아니야. Ep가 Ek로 모습을 바꾸는 거야.' },
        { label: '무거울수록 아래에서 더 빠르게 움직이기 때문이다', correct: false,
          feedback: '질량은 속도에 직접 영향을 주지 않아. Ep와 Ek의 전환이 속도를 결정해.' }
      ],
      continueLabel: '미션 완료 →'
    }).then(() => {
      MissionUI.showClearAndReturn({
        score: missionScore,
        formula: 'Ek + Ep = 일정',
        desc: '에너지 보존 - 높이↑ 속도↓, 높이↓ 속도↑'
      });
    });
  });
  ui.friction.addEventListener('input', updateUi);
}
