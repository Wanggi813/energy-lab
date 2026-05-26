'use strict';

/* ══════════════════════════════════
   VN SCRIPT DATA
══════════════════════════════════ */
const SCENES = [
  {
    id: 'seoyun',
    bg: 'pool',
    charColor: '#30d5ff',
    charName: '서윤',
    sport: '다이빙',
    lines: [
      { speaker: null, text: '대회 당일 아침. 수영장 가장자리에 서윤이 서 있었다.' },
      { speaker: '서윤', emotion: 'neutral', text: '코치님! 잠깐요.' },
      { speaker: '서윤', emotion: 'troubled', text: '높은 플랫폼에 서면 몸이 먼저 긴장해요. 내려오는 동안 속도가 확 붙는 느낌이 있거든요.' },
      { speaker: '서윤', emotion: 'neutral', text: '다이빙에서는 높이와 착수 속도를 어떻게 연결해서 생각해야 할까요?' },
    ],
    choicePrompt: '서윤의 다이빙을 에너지 흐름으로 설명하면 무엇이 가장 자연스러울까?',
    choices: [
      { text: '"회전을 많이 넣으면 떨어지는 동안 에너지가 줄어서 속도도 자연스럽게 낮아져."', correct: false, wrongExplain: '회전(자세)은 에너지를 소모하지 않아요. 마찰이 없다면 낙하 중에는 Ep → Ek 전환만 일어납니다.' },
      { text: '"높은 곳일수록 출발 전에 가진 위치에너지가 크고, 내려오며 운동에너지로 더 많이 바뀌어."', correct: true },
      { text: '"입수 각도만 수직이면 높이와 속도는 거의 상관없어."', correct: false, wrongExplain: '입수 각도는 저항에 영향을 주지만, 착수 직전 속도는 높이(Ep = mgh)에 의해 결정됩니다.' },
      { text: '"공중에서 힘을 빼면 중력이 약하게 작용해서 착수 속도가 줄어."', correct: false, wrongExplain: '힘을 빼도 중력 가속도 g = 9.8 m/s²는 변하지 않아요. 속도는 오직 높이에만 의존합니다.' },
    ],
    afterCorrect: [
      { speaker: '서윤', emotion: 'surprised', text: '그러니까 플랫폼 높이는 그냥 배경이 아니라, 제가 처음 들고 출발하는 에너지의 크기군요.' },
      { speaker: '서윤', emotion: 'surprised', text: '높은 곳에서 뛰면 더 큰 운동에너지로 물에 닿으니, 자세를 안정시키는 시간이 더 중요해지겠어요.' },
      { speaker: '서윤', emotion: 'happy', text: '낮은 플랫폼에서 착수 감각을 먼저 만들고, 높이를 올리며 에너지 흐름에 적응해볼게요!' },
    ],
    afterWrong: [
      { speaker: '서윤', emotion: 'troubled', text: '회전이나 자세도 중요하지만, 물에 닿기 전 속도는 높은 곳에서 시작한 에너지가 운동으로 바뀐 결과예요.' },
      { speaker: '서윤', emotion: 'neutral', text: '높은 플랫폼일수록 더 큰 에너지를 다뤄야 하니까, 낮은 곳에서 안정적인 자세부터 만들어볼게요.' },
    ],
  },
  {
    id: 'jihun',
    bg: 'track',
    charColor: '#ff6b6b',
    charName: '지훈',
    sport: '단거리',
    lines: [
      { speaker: null, text: '지훈이 땀을 닦으며 뛰어왔다.' },
      { speaker: '지훈', emotion: 'neutral', text: '코치님! 출발은 항상 잘 되는데, 60m 이후에 몸이 급격히 무거워져요.' },
      { speaker: '지훈', emotion: 'troubled', text: '힘을 아낀 것도 아닌데, 후반에 운동에너지가 계속 빠져나가는 느낌이에요.' },
      { speaker: '지훈', emotion: 'neutral', text: '속도가 빠를수록 더 손해를 보는 건지… 물리적으로 왜 그런 걸까요?' },
    ],
    choicePrompt: '단거리 후반에 지훈이 느끼는 “무거움”을 에너지 관점에서 설명하면?',
    choices: [
      { text: '"빠를수록 공기와 몸이 더 세게 부딪치고, 운동에너지 일부가 열과 흔들림으로 빠져나가."', correct: true },
      { text: '"속도가 빠르면 시간이 짧아지니 저항으로 잃는 에너지는 거의 없어져."', correct: false, wrongExplain: '공기 저항력은 속도²에 비례해요. 빠를수록 저항이 훨씬 커져 단위 거리당 에너지 손실도 늘어납니다.' },
      { text: '"달리기는 바닥을 차는 운동이라 공기나 마찰 손실은 생각하지 않아도 돼."', correct: false, wrongExplain: '100m 기록을 단축할 때 공기 저항이 실질적인 장벽이에요. 엘리트 선수일수록 이 에너지 손실이 크게 체감됩니다.' },
      { text: '"후반 둔화는 의지만의 문제라서 에너지 전환과는 관련이 없어."', correct: false, wrongExplain: '공기 저항과 근육 열손실 같은 물리적 에너지 손실이 실제로 속도를 줄입니다. 의지만의 문제가 아니에요.' },
    ],
    afterCorrect: [
      { speaker: '지훈', emotion: 'surprised', text: '컬링 스톤이 얼음과 마찰하며 느려졌던 것처럼, 제 몸도 공기와 트랙을 지나며 에너지를 조금씩 잃는군요.' },
      { speaker: '지훈', emotion: 'surprised', text: '초반에 너무 크게 폭발하면 후반에는 더 큰 저항을 계속 밀어내야 하니까 몸이 무거워지는 거네요.' },
      { speaker: '지훈', emotion: 'happy', text: '속도를 무조건 빨리 올리기보다, 손실을 감당할 수 있는 리듬을 찾아볼게요!' },
    ],
    afterWrong: [
      { speaker: '지훈', emotion: 'troubled', text: '빠르게 달릴수록 공기와 몸의 충돌도 커져요. 그 과정에서 운동에너지가 열과 소리, 자세 흔들림으로 바뀔 수 있어요.' },
      { speaker: '지훈', emotion: 'neutral', text: '컬링 스톤이 결국 멈추는 것처럼, 저도 후반에는 손실을 줄이는 자세와 페이스가 중요하겠네요.' },
    ],
  },
  {
    id: 'minjae',
    bg: 'stadium',
    charColor: '#3ee68f',
    charName: '민재',
    sport: '장대높이뛰기',
    lines: [
      { speaker: null, text: '훈련 후, 민재가 매트 옆에 혼자 앉아 있었다.' },
      { speaker: '민재', emotion: 'neutral', text: '코치님.' },
      { speaker: '민재', emotion: 'troubled', text: '바를 살짝 넘기지 못하고 계속 걸려요.' },
      { speaker: '민재', emotion: 'neutral', text: '장대가 저를 밀어 올리는 느낌이 부족한데, 무엇을 봐야 할까요?' },
    ],
    choicePrompt: '장대높이뛰기를 에너지 전환으로 보면 어떤 설명이 가장 알맞을까?',
    choices: [
      { text: '"무조건 더 단단한 장대를 쓰면 돼. 휘지 않을수록 더 많은 에너지가 저장돼."', correct: false, wrongExplain: '단단한 장대는 잘 휘지 않아서 Es = ½kx²로 저장할 수 있는 에너지가 적어요. 적당히 유연한 장대가 에너지를 더 잘 저장하고 돌려줍니다.' },
      { text: '"더 긴 장대만 고르면 처음 달리는 속도가 같아도 항상 더 높이 올라가."', correct: false, wrongExplain: '장대 길이만으로 높이가 결정되지 않아요. 도움닫기로 얻은 Ek가 Es로 저장되고 다시 Ep로 바뀌는 전체 흐름이 중요합니다.' },
      { text: '"도움닫기의 운동에너지가 장대의 탄성에너지로 저장되고, 다시 몸을 위로 밀어 올리는 흐름을 봐야 해."', correct: true },
      { text: '"바를 넘는 순간에는 팔 힘만 중요하고, 달려온 에너지는 거의 사라져."', correct: false, wrongExplain: '달려온 Ek가 장대의 Es로 저장되고 다시 Ep로 바뀌는 것이 핵심이에요. 도움닫기 에너지 없이는 높이 올라갈 수 없습니다.' },
    ],
    afterCorrect: [
      { speaker: '민재', emotion: 'surprised', text: '장대는 그냥 막대가 아니라, 제가 달려온 에너지를 잠깐 저장해주는 장치군요.' },
      { speaker: '민재', emotion: 'surprised', text: '잘 휘고 잘 펴지는 타이밍이 맞아야 저장된 탄성에너지가 제 몸을 위로 보내는 거네요.' },
      { speaker: '민재', emotion: 'happy', text: '도움닫기, 장대 선택, 몸을 넘기는 타이밍을 하나의 에너지 흐름으로 맞춰볼게요!' },
    ],
    afterWrong: [
      { speaker: '민재', emotion: 'troubled', text: '장대의 단단함이나 길이만 보면 부족해요. 제가 달려와서 장대에 맡긴 에너지가 어떻게 돌아오는지 봐야 해요.' },
      { speaker: '민재', emotion: 'neutral', text: '도움닫기에서 얻은 에너지가 장대에 저장되고, 다시 높이로 바뀌는 흐름을 연습해볼게요.' },
    ],
  },
  {
    id: 'all',
    bg: 'lobby',
    charColor: '#30d5ff',
    charName: '서윤 · 지훈 · 민재',
    sport: '결승',
    lines: [
      { speaker: null, text: '경기 직전. 세 선수가 함께 찾아왔다.' },
      { speaker: '서윤', emotion: 'neutral', text: '코치님, 떨려요.' },
      { speaker: '지훈', emotion: 'neutral', text: '딱 한 마디만 해주세요!' },
      { speaker: '민재', emotion: 'neutral', text: '물리 법칙으로요.' },
    ],
    choicePrompt: '세 선수의 상황을 하나로 묶어 생각할 때 가장 좋은 말은?',
    choices: [
      { text: '"더 열심히 움직이면 에너지가 새로 생겨서 기록이 좋아져."', correct: false, wrongExplain: '에너지는 새로 만들어지지 않아요. 음식(화학 에너지)이 운동에너지로 전환될 뿐, 총량은 변하지 않습니다.' },
      { text: '"에너지는 사라지지 않아. 높이, 속도, 열, 탄성처럼 스포츠 장면마다 다른 모습으로 이어져."', correct: true },
      { text: '"에너지는 아껴두었다가 마지막 순간에 한 번에 꺼내 쓰는 거야."', correct: false, wrongExplain: '에너지는 저장 형태가 바뀔 뿐, 의도적으로 몰아두었다가 쓰는 것이 아니에요. 항상 연속적으로 전환됩니다.' },
      { text: '"물리 법칙보다 멘탈이 더 중요하니 식은 생각하지 마."', correct: false, wrongExplain: '에너지 전환 원리를 이해하면 자세·페이스·장비 선택을 과학적으로 최적화할 수 있어요. 물리와 멘탈은 함께 작용합니다.' },
    ],
    afterCorrect: [
      { speaker: '서윤', emotion: 'happy', text: '위치에너지를 운동에너지로!' },
      { speaker: '지훈', emotion: 'happy', text: '운동에너지가 저항을 만나 열로도 바뀌고!' },
      { speaker: '민재', emotion: 'happy', text: '속도에서 탄성, 다시 높이로 이어지고!' },
      { speaker: null, text: '세 선수의 눈이 빛났다. 훈련에서 배운 에너지 법칙이 대회 무대에서 완벽하게 살아있었다.' },
    ],
    afterWrong: [
      { speaker: '지훈', emotion: 'troubled', text: '에너지 보존 법칙이 답 아닌가요?' },
      { speaker: '민재', emotion: 'neutral', text: '다이빙, 달리기, 장대높이뛰기는 달라 보여도 에너지가 모습을 바꾸며 이어진다는 점은 같아요.' },
      { speaker: null, text: '선수들이 먼저 법칙을 떠올렸다. 훌륭한 선수들이다.' },
    ],
  },
];

/* ══════════════════════════════════
   VN ENGINE STATE
══════════════════════════════════ */
let vnSceneIdx = 0;
let vnLineIdx = 0;
let vnPhase = 'reading'; // 'reading' | 'choice' | 'feedback' | 'done'
let vnTrust = 0;
let vnTypingId = null;
let vnTypingDone = false;
let vnChoiceResult = null; // 'correct' | 'wrong'
let vnBgT = 0;
let vnBreath = 0;
let vnBgRaf = null;
let vnEmotions = { seoyun: 'neutral', jihun: 'neutral', minjae: 'neutral' };
let vnSatisfied = { seoyun: false, jihun: false, minjae: false };

const KEYS = ['A', 'B', 'C', 'D'];
const CHAR_COLORS = { seoyun: '#4aaddd', jihun: '#e06060', minjae: '#5dbc5d' };
const ATHLETE_IMAGE_SOURCES = {
  seoyun: { normal: '../image/수영.png', happy: '../image/수영_만족.png' },
  jihun: { normal: '../image/육상.png', happy: '../image/육상_만족.png' },
  minjae: { normal: '../image/높이뛰기.png', happy: '../image/높이뛰기_만족.png' }
};

const athleteImages = {};
Object.entries(ATHLETE_IMAGE_SOURCES).forEach(([key, pair]) => {
  athleteImages[key] = {};
  Object.entries(pair).forEach(([state, src]) => {
    const img = new Image();
    img.onload = () => { img.ready = true; };
    img.src = src;
    athleteImages[key][state] = img;
  });
});

/* ── Canvas setup ── */
const bgCvs = document.getElementById('vnBgCanvas');
const bgCtx = bgCvs.getContext('2d');
const charCvs = document.getElementById('vnCharCanvas');
const charCtx = charCvs.getContext('2d');

function resizeVN() {
  bgCvs.width = bgCvs.offsetWidth; bgCvs.height = bgCvs.offsetHeight;
  charCvs.width = charCvs.offsetWidth; charCvs.height = charCvs.offsetHeight;
}
window.addEventListener('resize', resizeVN);
resizeVN();

const VN_BG_IMAGES = {
  pool: '../image/수영장.png',
  track: '../image/트랙.png',
  stadium: '../image/허들.png',
  lobby: '../image/로비.png'
};

const vnBgImages = {};
Object.entries(VN_BG_IMAGES).forEach(([key, src]) => {
  const img = new Image();
  img.onload = () => { img.ready = true; };
  img.src = src;
  vnBgImages[key] = img;
});

function drawCoverImage(ctx, img, w, h) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return false;

  const scale = Math.max(w / iw, h / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = (w - dw) / 2;
  const dy = (h - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
  return true;
}

function drawImageScene(ctx, key, w, h) {
  const img = vnBgImages[key];
  if (!img || !img.ready) return false;
  drawCoverImage(ctx, img, w, h);

  const shade = ctx.createLinearGradient(0, 0, 0, h);
  shade.addColorStop(0, 'rgba(3, 10, 18, 0.04)');
  shade.addColorStop(0.58, 'rgba(3, 10, 18, 0.00)');
  shade.addColorStop(1, 'rgba(3, 10, 18, 0.34)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, w, h);
  return true;
}

/* ══════════════════════════════════
   BACKGROUND RENDERERS
══════════════════════════════════ */
function drawCloud(ctx, cx, cy, r, alpha) {
  ctx.fillStyle = `rgba(255,255,255,${alpha})`;
  for (const [ox, oy, rr] of [[-r*.5,0,r*.55],[r*.5,0,r*.55],[0,-r*.35,r*.6],[0,0,r]]) {
    ctx.beginPath(); ctx.arc(cx+ox, cy+oy, rr, 0, Math.PI*2); ctx.fill();
  }
}

function drawPool(ctx, w, h, t) {
  // Sky
  const sky = ctx.createLinearGradient(0, 0, 0, h * .5);
  sky.addColorStop(0, '#5ab8e0'); sky.addColorStop(1, '#88d0f0');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h * .5);
  // Clouds
  drawCloud(ctx, w*.15, h*.1, 38, .9);
  drawCloud(ctx, w*.6, h*.08, 28, .85);
  drawCloud(ctx, w*.85, h*.14, 22, .8);
  // Indoor pool hall ceiling
  const ceilG = ctx.createLinearGradient(0, h*.35, 0, h*.5);
  ceilG.addColorStop(0, '#d0eaf8'); ceilG.addColorStop(1, '#a8d4ee');
  ctx.fillStyle = ceilG; ctx.fillRect(0, h*.35, w, h*.15);
  // Pool deck
  ctx.fillStyle = '#e8f4f8'; ctx.fillRect(0, h*.5, w, h*.08);
  for (let x = 0; x < w; x += 32) {
    ctx.strokeStyle = 'rgba(180,210,220,.6)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, h*.5); ctx.lineTo(x, h*.58); ctx.stroke();
  }
  // Water
  const water = ctx.createLinearGradient(0, h*.58, 0, h);
  water.addColorStop(0, '#1ab0e8'); water.addColorStop(.4, '#0090cc'); water.addColorStop(1, '#006aaa');
  ctx.fillStyle = water; ctx.fillRect(0, h*.58, w, h*.42);
  // Lane ropes
  for (let i = 0; i <= 6; i++) {
    const lx = w*.08 + i * (w*.84/6);
    const isEdge = i === 0 || i === 6;
    ctx.strokeStyle = isEdge ? 'rgba(255,60,60,.7)' : 'rgba(255,220,50,.7)';
    ctx.lineWidth = isEdge ? 3 : 2;
    ctx.setLineDash(isEdge ? [] : [10, 6]);
    ctx.beginPath(); ctx.moveTo(lx, h*.58); ctx.lineTo(lx, h); ctx.stroke();
    ctx.setLineDash([]);
  }
  // Water sparkles
  for (let i = 0; i < 10; i++) {
    const sx = w * (.08 + (i * 0.093) % .85);
    const sy = h * (.6 + .06 * Math.sin(t * 2.5 + i * 1.1));
    ctx.fillStyle = `rgba(255,255,255,${.15 + .1 * Math.sin(t * 3 + i)})`;
    ctx.beginPath(); ctx.ellipse(sx, sy, 18 + 6 * Math.sin(t + i), 4, 0, 0, Math.PI*2); ctx.fill();
  }
  // Diving platform (right side)
  ctx.fillStyle = '#c8dde8'; ctx.fillRect(w*.72, h*.4, w*.22, h*.18);
  ctx.fillStyle = '#b0ccd8'; ctx.fillRect(w*.74, h*.58, w*.18, h*.04);
  ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(w*.74, h*.58); ctx.lineTo(w*.84, h*.555); ctx.stroke();
  // Height labels
  for (let d = 1; d <= 3; d++) {
    ctx.fillStyle = 'rgba(0,80,120,.6)'; ctx.font = `bold ${h*.022}px Pretendard,sans-serif`; ctx.textAlign = 'center';
    ctx.fillText(`${d*3}m`, w*.06, h*(.58 + d*.12));
  }
}

function drawTrack(ctx, w, h, t) {
  // Sky
  const sky = ctx.createLinearGradient(0, 0, 0, h * .55);
  sky.addColorStop(0, '#4baae0'); sky.addColorStop(1, '#7ecaf5');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h * .55);
  drawCloud(ctx, w*.2, h*.07, 35, .9);
  drawCloud(ctx, w*.72, h*.1, 26, .85);
  // Stadium stands
  ctx.fillStyle = '#d0d8e0';
  ctx.beginPath(); ctx.moveTo(0, h*.55); ctx.lineTo(0, h*.15); ctx.lineTo(w*.25, h*.35); ctx.lineTo(w*.5, h*.55); ctx.fill();
  ctx.beginPath(); ctx.moveTo(w, h*.55); ctx.lineTo(w, h*.15); ctx.lineTo(w*.75, h*.35); ctx.lineTo(w*.5, h*.55); ctx.fill();
  // Stands detail rows
  for (let row = 0; row < 5; row++) {
    ctx.fillStyle = `rgba(100,120,160,${0.08 + row * 0.04})`;
    const y1 = h * (.17 + row * .06);
    ctx.beginPath(); ctx.moveTo(0, y1); ctx.lineTo(w*.22, y1); ctx.lineTo(w*.24, y1 + h*.04); ctx.lineTo(0, y1 + h*.04); ctx.fill();
    ctx.beginPath(); ctx.moveTo(w, y1); ctx.lineTo(w*.78, y1); ctx.lineTo(w*.76, y1 + h*.04); ctx.lineTo(w, y1 + h*.04); ctx.fill();
  }
  // Infield grass
  ctx.fillStyle = '#5ab84a'; ctx.fillRect(w*.2, h*.55, w*.6, h*.06);
  // Track surface
  const trackG = ctx.createLinearGradient(0, h*.6, 0, h);
  trackG.addColorStop(0, '#d44a28'); trackG.addColorStop(1, '#bf3a18');
  ctx.fillStyle = trackG; ctx.fillRect(0, h*.6, w, h*.4);
  // Lane lines (perspective)
  const vanX = w*.5;
  for (let i = 0; i <= 8; i++) {
    const bx = i * w / 8;
    const vx = vanX + (bx - vanX) * .15;
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = i === 0 || i === 8 ? 2.5 : 1.5;
    ctx.beginPath(); ctx.moveTo(bx, h); ctx.lineTo(vx, h*.6); ctx.stroke();
  }
  // Finish line
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,.6)' : 'transparent';
    const bx1 = i * w / 8, bx2 = (i+1) * w / 8;
    const vx1 = vanX + (bx1 - vanX) * .15, vx2 = vanX + (bx2 - vanX) * .15;
    ctx.beginPath(); ctx.moveTo(bx1, h*.65); ctx.lineTo(bx2, h*.65); ctx.lineTo(vx2, h*.6); ctx.lineTo(vx1, h*.6); ctx.fill();
  }
  // Motion blur streaks
  for (let i = 0; i < 4; i++) {
    const by = h * (.7 + i * .06);
    const blen = 50 + 20 * Math.sin(t * 4 + i);
    ctx.strokeStyle = `rgba(255,200,160,${.12 + .06 * Math.sin(t*3+i)})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(w*.4 - blen, by); ctx.lineTo(w*.4, by); ctx.stroke();
  }
  // Sunlight
  const sunG = ctx.createRadialGradient(w*.8, 0, 0, w*.8, 0, h*.6);
  sunG.addColorStop(0, 'rgba(255,240,180,.18)'); sunG.addColorStop(1, 'transparent');
  ctx.fillStyle = sunG; ctx.fillRect(0, 0, w, h*.6);
}

function drawStadium(ctx, w, h, t) {
  // Sky — blue daytime
  const sky = ctx.createLinearGradient(0, 0, 0, h * .55);
  sky.addColorStop(0, '#2e96e0'); sky.addColorStop(1, '#70c0f0');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h * .55);
  drawCloud(ctx, w*.1, h*.06, 32, .9);
  drawCloud(ctx, w*.5, h*.09, 24, .85);
  drawCloud(ctx, w*.82, h*.05, 28, .88);
  // Stadium stands
  ctx.fillStyle = '#b8ccd8';
  ctx.beginPath(); ctx.moveTo(0, h*.55); ctx.lineTo(0, h*.1); ctx.lineTo(w*.35, h*.4); ctx.lineTo(w*.5, h*.55); ctx.fill();
  ctx.beginPath(); ctx.moveTo(w, h*.55); ctx.lineTo(w, h*.1); ctx.lineTo(w*.65, h*.4); ctx.lineTo(w*.5, h*.55); ctx.fill();
  // Stand rows
  const standColors = ['#c8dce8','#b8ccd8','#a8bcc8','#98acb8'];
  for (let row = 0; row < 4; row++) {
    ctx.fillStyle = standColors[row];
    const y = h * (.13 + row * .08);
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(0, y + h*.06); ctx.lineTo(w*(.28 + row*.02), y + h*.06 + h*.04); ctx.lineTo(w*(.28 + row*.02), y + h*.04); ctx.fill();
    ctx.beginPath(); ctx.moveTo(w, y); ctx.lineTo(w, y + h*.06); ctx.lineTo(w*(.72 - row*.02), y + h*.06 + h*.04); ctx.lineTo(w*(.72 - row*.02), y + h*.04); ctx.fill();
  }
  // Field grass
  const grass = ctx.createLinearGradient(0, h*.55, 0, h);
  grass.addColorStop(0, '#5cbf44'); grass.addColorStop(.5, '#4aaa32'); grass.addColorStop(1, '#3a9022');
  ctx.fillStyle = grass; ctx.fillRect(0, h*.55, w, h*.45);
  // Grass stripes
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.04)';
    ctx.fillRect(i * w / 8, h*.55, w / 8, h*.45);
  }
  // Runway
  ctx.fillStyle = '#e8c868'; ctx.fillRect(w*.18, h*.6, w*.64, h*.06);
  ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(w*.18, h*.63); ctx.lineTo(w*.82, h*.63); ctx.stroke();
  // Standards
  ctx.fillStyle = '#c8c8c8';
  ctx.fillRect(w*.42, h*.45, 7, h*.21);
  ctx.fillRect(w*.56, h*.45, 7, h*.21);
  // Crossbar (slight bob)
  const barY = h * (.48 + .01 * Math.sin(t * 1.5));
  ctx.fillStyle = '#e0e0e0'; ctx.fillRect(w*.42, barY, w*.15, 4);
  ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1;
  ctx.strokeRect(w*.42, barY, w*.15, 4);
  // Landing mat
  ctx.fillStyle = '#2060c0'; ctx.fillRect(w*.38, h*.66, w*.24, h*.06);
  ctx.fillStyle = '#1850a8'; ctx.fillRect(w*.39, h*.67, w*.22, h*.04);
  // Sun
  const sunG = ctx.createRadialGradient(w*.85, h*.04, 0, w*.85, h*.04, h*.15);
  sunG.addColorStop(0, 'rgba(255,240,100,.9)'); sunG.addColorStop(.4, 'rgba(255,220,60,.3)'); sunG.addColorStop(1, 'transparent');
  ctx.fillStyle = sunG; ctx.beginPath(); ctx.arc(w*.85, h*.04, h*.15, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#ffe040'; ctx.beginPath(); ctx.arc(w*.85, h*.04, h*.04, 0, Math.PI*2); ctx.fill();
}

function drawCorridor(ctx, w, h, t) {
  // Bright indoor corridor — entrance to arena
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#2a4060'); sky.addColorStop(1, '#1a2a40');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
  const mx = w * .5;
  // Corridor walls
  ctx.fillStyle = '#304060';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, h); ctx.lineTo(mx - w*.14, h*.58); ctx.lineTo(mx - w*.14, 0); ctx.fill();
  ctx.beginPath(); ctx.moveTo(w, 0); ctx.lineTo(w, h); ctx.lineTo(mx + w*.14, h*.58); ctx.lineTo(mx + w*.14, 0); ctx.fill();
  // Ceiling
  ctx.fillStyle = '#283550'; ctx.fillRect(0, 0, w, h*.12);
  // Floor tiles
  ctx.fillStyle = '#2a3858'; ctx.fillRect(0, h*.58, w, h*.42);
  ctx.strokeStyle = 'rgba(100,140,200,.2)'; ctx.lineWidth = 1;
  for (let i = 0; i <= 8; i++) {
    const fy = h * (.58 + i * .06);
    ctx.beginPath(); ctx.moveTo(0, fy); ctx.lineTo(w, fy); ctx.stroke();
  }
  for (let i = -4; i <= 4; i++) {
    ctx.beginPath(); ctx.moveTo(mx + i * w*.14, h*.58); ctx.lineTo(mx + i * w*.28, h); ctx.stroke();
  }
  // Exit — bright arena light at end
  const exitG = ctx.createRadialGradient(mx, h*.58, 0, mx, h*.58, h*.45);
  exitG.addColorStop(0, 'rgba(200,230,255,.55)');
  exitG.addColorStop(.3, 'rgba(120,180,255,.2)');
  exitG.addColorStop(1, 'transparent');
  ctx.fillStyle = exitG; ctx.fillRect(0, 0, w, h);
  // Arena door shape
  ctx.fillStyle = 'rgba(180,220,255,.3)';
  ctx.fillRect(mx - w*.12, h*.2, w*.24, h*.38);
  ctx.strokeStyle = 'rgba(140,200,255,.5)'; ctx.lineWidth = 2;
  ctx.strokeRect(mx - w*.12, h*.2, w*.24, h*.38);
  // Overhead lights
  for (let i = 0; i < 5; i++) {
    const lx = w * (.15 + i * .175);
    const alpha = .6 + .2 * Math.sin(t * 1.5 + i);
    const lg = ctx.createRadialGradient(lx, h*.06, 0, lx, h*.1, 60);
    lg.addColorStop(0, `rgba(220,240,255,${alpha})`);
    lg.addColorStop(1, 'transparent');
    ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(lx, h*.1, 60, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath(); ctx.arc(lx, h*.06, 4, 0, Math.PI*2); ctx.fill();
  }
  // Wall flag panels (team colors)
  const flagCols = ['rgba(48,213,255,.25)','rgba(255,107,107,.25)','rgba(62,230,143,.25)'];
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = flagCols[i];
    ctx.fillRect(w*(.06 + i*.04), h*.14, w*.025, h*.32);
    ctx.strokeStyle = flagCols[i].replace('.25)', '.5)'); ctx.lineWidth = 1;
    ctx.strokeRect(w*(.06 + i*.04), h*.14, w*.025, h*.32);
  }
  // "경기장" text glow effect
  const textAlpha = .5 + .2 * Math.sin(t * 2);
  ctx.fillStyle = `rgba(200,230,255,${textAlpha})`; ctx.font = `bold ${h*.03}px Pretendard,sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('STADIUM', mx, h * .44);
}

/* ══════════════════════════════════
   CHARACTER RENDERERS
══════════════════════════════════ */
function drawFace(ctx, cx, cy, r, emotion, color) {
  // Face
  const fg = ctx.createRadialGradient(cx - r*.1, cy - r*.1, r*.05, cx, cy, r);
  fg.addColorStop(0, '#fde0c0'); fg.addColorStop(1, '#f0c8a0');
  ctx.fillStyle = fg; ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 1.1, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
  // Cheeks
  if (emotion === 'happy') {
    ctx.fillStyle = 'rgba(255,150,150,.3)';
    ctx.beginPath(); ctx.ellipse(cx - r*.42, cy + r*.15, r*.2, r*.12, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + r*.42, cy + r*.15, r*.2, r*.12, 0, 0, Math.PI*2); ctx.fill();
  }
  // Eyes
  const ey = cy - r * .1;
  const ex = r * .3;
  if (emotion === 'happy') {
    ctx.strokeStyle = '#3a1a0a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx - ex, ey, r*.14, Math.PI + .3, Math.PI * 2 - .3); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + ex, ey, r*.14, Math.PI + .3, Math.PI * 2 - .3); ctx.stroke();
  } else if (emotion === 'troubled') {
    // Slightly worried eyes
    ctx.fillStyle = '#1a0a00';
    ctx.beginPath(); ctx.ellipse(cx - ex, ey, r*.13, r*.11, -.2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + ex, ey, r*.13, r*.11, .2, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.ellipse(cx - ex, ey, r*.07, r*.06, -.2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + ex, ey, r*.07, r*.06, .2, 0, Math.PI*2); ctx.fill();
    // Worry lines
    ctx.strokeStyle = '#3a1a00'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(cx - ex - r*.1, ey - r*.18); ctx.lineTo(cx - ex + r*.05, ey - r*.1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + ex + r*.1, ey - r*.18); ctx.lineTo(cx + ex - r*.05, ey - r*.1); ctx.stroke();
  } else if (emotion === 'surprised') {
    ctx.fillStyle = '#1a0a00';
    ctx.beginPath(); ctx.ellipse(cx - ex, ey, r*.15, r*.18, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + ex, ey, r*.15, r*.18, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.ellipse(cx - ex, ey, r*.08, r*.1, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + ex, ey, r*.08, r*.1, 0, 0, Math.PI*2); ctx.fill();
  } else {
    // neutral
    ctx.fillStyle = '#1a0a00';
    ctx.beginPath(); ctx.ellipse(cx - ex, ey, r*.13, r*.12, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + ex, ey, r*.13, r*.12, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.ellipse(cx - ex + r*.02, ey, r*.07, r*.07, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + ex + r*.02, ey, r*.07, r*.07, 0, 0, Math.PI*2); ctx.fill();
  }
  // Mouth
  const my = cy + r * .42;
  ctx.strokeStyle = '#6a3010'; ctx.lineWidth = 1.5;
  if (emotion === 'happy') {
    ctx.beginPath(); ctx.arc(cx, my - r*.08, r*.25, .2, Math.PI - .2); ctx.stroke();
  } else if (emotion === 'troubled') {
    ctx.beginPath(); ctx.arc(cx, my + r*.15, r*.2, Math.PI + .3, Math.PI * 2 - .3); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(cx - r*.18, my); ctx.lineTo(cx + r*.18, my); ctx.stroke();
  }
}

function drawAthletePhoto(ctx, x, y, key, breath) {
  const pair = athleteImages[key];
  if (!pair) return false;
  const img = vnSatisfied[key] ? pair.happy : pair.normal;
  if (!img || !img.ready) return false;

  const accent = CHAR_COLORS[key] || '#4aaddd';
  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;
  const cropTop = Math.round(srcH * 0.02);
  const cropH = Math.round(srcH * 0.70);
  const photoH = 640;
  const photoW = photoH * (srcW / cropH);
  const bottomPad = 270;

  ctx.save();
  ctx.translate(x, y - breath * 4);

  const glow = ctx.createRadialGradient(0, -92, 20, 0, -92, 170);
  glow.addColorStop(0, hexAlpha(accent, 0.24));
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, -92, 170, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.beginPath();
  ctx.ellipse(0, bottomPad - 8, 72, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.drawImage(img, 0, cropTop, srcW, cropH, -photoW / 2, bottomPad - photoH, photoW, photoH);

  if (vnSatisfied[key]) {
    const shine = ctx.createLinearGradient(-photoW / 2, bottomPad - photoH, photoW / 2, bottomPad);
    shine.addColorStop(0, 'rgba(255,255,255,0)');
    shine.addColorStop(0.48, 'rgba(255,255,255,0.10)');
    shine.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine;
    ctx.fillRect(-photoW / 2, bottomPad - photoH, photoW, photoH);
  }

  ctx.restore();
  return true;
}

function hexAlpha(hex, alpha) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function drawSeoyun(ctx, x, y, emotion, breath) {
  if (drawAthletePhoto(ctx, x, y, 'seoyun', breath)) return;
  ctx.save();
  ctx.translate(x, y - breath * 4);
  const s = 1;
  const col = '#4aaddd';
  // Glow
  const gl = ctx.createRadialGradient(0, -60, 20, 0, -60, 160);
  gl.addColorStop(0, 'rgba(48,213,255,.2)'); gl.addColorStop(1, 'transparent');
  ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, -60, 160, 0, Math.PI*2); ctx.fill();
  // Body - swimsuit
  const bw = 52, bh = 95;
  const bg = ctx.createLinearGradient(-bw/2, 0, bw/2, bh);
  bg.addColorStop(0, '#1090e0'); bg.addColorStop(1, '#0870c0');
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.moveTo(-bw/2, 0); ctx.lineTo(-bw*.6, bh); ctx.lineTo(bw*.6, bh); ctx.lineTo(bw/2, 0); ctx.closePath(); ctx.fill();
  // Swimsuit accent stripe
  ctx.fillStyle = 'rgba(255,255,255,.15)';
  ctx.fillRect(-bw/2, 8, bw, 5);
  // Swimsuit logo
  ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('서', 0, 50);
  // Shoulders
  ctx.fillStyle = '#1880cc';
  ctx.beginPath(); ctx.ellipse(-bw/2, -8, 18, 12, -.4, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(bw/2, -8, 18, 12, .4, 0, Math.PI*2); ctx.fill();
  // Neck
  ctx.fillStyle = '#f5d0b0'; ctx.fillRect(-10, -28, 20, 32);
  // Head
  drawFace(ctx, 0, -90, 38, emotion, col);
  // Hair - ponytail style
  ctx.fillStyle = '#0e0606';
  ctx.beginPath(); ctx.moveTo(-38, -100);
  ctx.bezierCurveTo(-40, -145, -20, -155, 0, -152);
  ctx.bezierCurveTo(20, -155, 40, -145, 38, -100);
  ctx.bezierCurveTo(20, -115, -20, -115, -38, -100); ctx.fill();
  // Ponytail
  ctx.fillStyle = '#0e0606';
  ctx.beginPath(); ctx.moveTo(32, -118);
  ctx.bezierCurveTo(70, -130, 90, -100, 75, -60);
  ctx.bezierCurveTo(65, -40, 55, -20, 58, 0);
  ctx.bezierCurveTo(52, -20, 44, -40, 38, -60);
  ctx.bezierCurveTo(40, -95, 30, -118, 32, -118); ctx.fill();
  // Hair shine
  ctx.fillStyle = 'rgba(255,255,255,.12)';
  ctx.beginPath(); ctx.ellipse(-8, -135, 12, 6, -.3, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

function drawJihun(ctx, x, y, emotion, breath) {
  if (drawAthletePhoto(ctx, x, y, 'jihun', breath)) return;
  ctx.save();
  ctx.translate(x, y - breath * 4);
  const col = '#e06060';
  // Glow
  const gl = ctx.createRadialGradient(0, -60, 20, 0, -60, 160);
  gl.addColorStop(0, 'rgba(255,107,107,.2)'); gl.addColorStop(1, 'transparent');
  ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, -60, 160, 0, Math.PI*2); ctx.fill();
  // Body - runner jersey
  const bw = 56, bh = 95;
  const bg = ctx.createLinearGradient(-bw/2, 0, bw/2, bh);
  bg.addColorStop(0, '#e03030'); bg.addColorStop(1, '#b01818');
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.moveTo(-bw/2, 0); ctx.lineTo(-bw*.55, bh); ctx.lineTo(bw*.55, bh); ctx.lineTo(bw/2, 0); ctx.closePath(); ctx.fill();
  // Jersey stripes
  ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(-bw/2, 15, bw, 8);
  ctx.fillRect(-bw/2, 38, bw, 4);
  // Number
  ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = 'bold 18px Courier New'; ctx.textAlign = 'center';
  ctx.fillText('7', 0, 55);
  // Wider shoulders (muscular)
  ctx.fillStyle = '#c02020';
  ctx.beginPath(); ctx.ellipse(-bw/2 - 4, -5, 22, 14, -.3, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(bw/2 + 4, -5, 22, 14, .3, 0, Math.PI*2); ctx.fill();
  // Neck
  ctx.fillStyle = '#e8c090'; ctx.fillRect(-11, -25, 22, 30);
  // Head (slightly larger, rounder for confident look)
  drawFace(ctx, 0, -85, 40, emotion, col);
  // Hair - short spiky
  ctx.fillStyle = '#120808';
  ctx.beginPath(); ctx.moveTo(-38, -95);
  ctx.bezierCurveTo(-38, -138, -18, -145, 0, -143);
  ctx.bezierCurveTo(18, -145, 38, -138, 38, -95);
  ctx.bezierCurveTo(20, -108, -20, -108, -38, -95); ctx.fill();
  // Spiky hair tips
  ctx.fillStyle = '#120808';
  for (let i = -2; i <= 2; i++) {
    const sx = i * 10;
    ctx.beginPath(); ctx.moveTo(sx - 6, -135); ctx.lineTo(sx, -155 + Math.abs(i)*3); ctx.lineTo(sx + 6, -135); ctx.fill();
  }
  // Hair shine
  ctx.fillStyle = 'rgba(255,255,255,.1)';
  ctx.beginPath(); ctx.ellipse(-5, -128, 10, 5, .2, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

function drawMinjae(ctx, x, y, emotion, breath) {
  if (drawAthletePhoto(ctx, x, y, 'minjae', breath)) return;
  ctx.save();
  ctx.translate(x, y - breath * 4);
  const col = '#5dbc5d';
  // Glow
  const gl = ctx.createRadialGradient(0, -60, 20, 0, -60, 160);
  gl.addColorStop(0, 'rgba(62,230,143,.2)'); gl.addColorStop(1, 'transparent');
  ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, -60, 160, 0, Math.PI*2); ctx.fill();
  // Body - athletic suit (slightly taller/leaner)
  const bw = 48, bh = 105;
  const bg = ctx.createLinearGradient(-bw/2, 0, bw/2, bh);
  bg.addColorStop(0, '#28a028'); bg.addColorStop(1, '#187018');
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.moveTo(-bw/2, 0); ctx.lineTo(-bw*.5, bh); ctx.lineTo(bw*.5, bh); ctx.lineTo(bw/2, 0); ctx.closePath(); ctx.fill();
  // Suit detail
  ctx.fillStyle = 'rgba(255,255,255,.15)';
  ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(-8, bh); ctx.lineTo(8, bh); ctx.lineTo(5, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,220,50,.4)'; ctx.font = '10px Courier New'; ctx.textAlign = 'center';
  ctx.fillText('민', 0, 55);
  // Shoulders (athletic)
  ctx.fillStyle = '#2a8c2a';
  ctx.beginPath(); ctx.ellipse(-bw/2, -6, 18, 12, -.2, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(bw/2, -6, 18, 12, .2, 0, Math.PI*2); ctx.fill();
  // Neck
  ctx.fillStyle = '#e8c090'; ctx.fillRect(-9, -26, 18, 30);
  // Head - slightly narrower/taller (analytical type)
  drawFace(ctx, 0, -90, 36, emotion, col);
  // Hair - neat side part
  ctx.fillStyle = '#0a0606';
  ctx.beginPath(); ctx.moveTo(-36, -100);
  ctx.bezierCurveTo(-36, -142, -18, -150, 0, -148);
  ctx.bezierCurveTo(18, -150, 36, -142, 36, -100);
  ctx.bezierCurveTo(18, -112, -18, -112, -36, -100); ctx.fill();
  // Side part detail
  ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-8, -148); ctx.bezierCurveTo(-5, -128, -3, -115, 0, -112); ctx.stroke();
  // Hair shine
  ctx.fillStyle = 'rgba(255,255,255,.12)';
  ctx.beginPath(); ctx.ellipse(-15, -132, 10, 5, .1, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

function scaleChar(ctx, x, y, sc, fn) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sc, sc);
  ctx.translate(-x, -y);
  fn();
  ctx.restore();
}

function drawAllThree(ctx, w, h, breath) {
  const baseY = h - 80;
  scaleChar(ctx, w * .24, baseY, 0.92, () => drawSeoyun(ctx, w * .24, baseY, vnEmotions.seoyun, breath));
  scaleChar(ctx, w * .5,  baseY, 0.92, () => drawJihun(ctx,  w * .5,  baseY, vnEmotions.jihun,  breath));
  scaleChar(ctx, w * .76, baseY, 0.92, () => drawMinjae(ctx, w * .76, baseY, vnEmotions.minjae, breath));
}

/* ══════════════════════════════════
   MAIN RENDER LOOP
══════════════════════════════════ */
function renderVN(ts) {
  vnBgT = ts / 1000;
  vnBreath = Math.sin(vnBgT * 1.8) * 0.5 + 0.5;

  const w = bgCvs.width, h = bgCvs.height;
  const scene = SCENES[vnSceneIdx];

  bgCtx.clearRect(0, 0, w, h);
  charCtx.clearRect(0, 0, w, h);

  switch (scene.bg) {
    case 'pool':    if (!drawImageScene(bgCtx, 'pool', w, h)) drawPool(bgCtx, w, h, vnBgT); break;
    case 'track':   if (!drawImageScene(bgCtx, 'track', w, h)) drawTrack(bgCtx, w, h, vnBgT); break;
    case 'stadium': if (!drawImageScene(bgCtx, 'stadium', w, h)) drawStadium(bgCtx, w, h, vnBgT); break;
    case 'lobby':   if (!drawImageScene(bgCtx, 'lobby', w, h)) drawCorridor(bgCtx, w, h, vnBgT); break;
    case 'corridor': drawCorridor(bgCtx, w, h, vnBgT); break;
  }

  const charY = h - 80;
  const CSCALE = 1.34;
  if (scene.id === 'all') {
    drawAllThree(charCtx, w, h, vnBreath);
  } else if (scene.id === 'seoyun') {
    scaleChar(charCtx, w * .30, charY, CSCALE, () => drawSeoyun(charCtx, w * .30, charY, vnEmotions.seoyun, vnBreath));
  } else if (scene.id === 'jihun') {
    scaleChar(charCtx, w * .30, charY, CSCALE, () => drawJihun(charCtx, w * .30, charY, vnEmotions.jihun, vnBreath));
  } else if (scene.id === 'minjae') {
    scaleChar(charCtx, w * .30, charY, CSCALE, () => drawMinjae(charCtx, w * .30, charY, vnEmotions.minjae, vnBreath));
  }

  vnBgRaf = requestAnimationFrame(renderVN);
}

/* ══════════════════════════════════
   VN LOGIC
══════════════════════════════════ */
let typewriterFull = '';
let typewriterIdx = 0;

function typeText(text, onDone) {
  const el = document.getElementById('vnText');
  el.textContent = '';
  typewriterFull = text;
  typewriterIdx = 0;
  vnTypingDone = false;
  clearTimeout(vnTypingId);

  function tick() {
    if (typewriterIdx >= typewriterFull.length) {
      vnTypingDone = true;
      if (onDone) onDone();
      return;
    }
    el.textContent += typewriterFull[typewriterIdx++];
    vnTypingId = setTimeout(tick, typewriterIdx < 10 ? 20 : 22);
  }
  tick();
}

function skipType() {
  clearTimeout(vnTypingId);
  document.getElementById('vnText').textContent = typewriterFull;
  vnTypingDone = true;
}

function setNameplate(speaker) {
  const np = document.getElementById('vnNameplate');
  if (!speaker) {
    np.style.background = 'rgba(80,80,100,.3)';
    np.style.color = 'rgba(180,180,220,.7)';
    np.style.borderColor = 'rgba(120,120,160,.2)';
    np.textContent = '— 내레이터 —';
    return;
  }
  const colors = { '서윤': '#4aaddd', '지훈': '#e06060', '민재': '#5dbc5d' };
  const col = colors[speaker] || '#c060ff';
  np.style.background = `rgba(${hexToRgb(col)}, .15)`;
  np.style.color = col;
  np.style.borderColor = `rgba(${hexToRgb(col)}, .4)`;
  np.textContent = speaker;
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return `${r},${g},${b}`;
}

function setEmotion(scene, emotion) {
  if (scene.id === 'seoyun') vnEmotions.seoyun = emotion;
  else if (scene.id === 'jihun') vnEmotions.jihun = emotion;
  else if (scene.id === 'minjae') vnEmotions.minjae = emotion;
  else if (scene.id === 'all') {
    vnEmotions.seoyun = vnEmotions.jihun = vnEmotions.minjae = emotion;
  }
}

function markSatisfied(scene) {
  if (scene.id === 'seoyun') vnSatisfied.seoyun = true;
  else if (scene.id === 'jihun') vnSatisfied.jihun = true;
  else if (scene.id === 'minjae') vnSatisfied.minjae = true;
}

function getCurrentLines() {
  const scene = SCENES[vnSceneIdx];
  if (vnPhase === 'reading') return scene.lines;
  if (vnPhase === 'feedback') {
    return vnChoiceResult === 'correct' ? scene.afterCorrect : scene.afterWrong;
  }
  return [];
}

function showCurrentLine() {
  const lines = getCurrentLines();
  if (vnLineIdx >= lines.length) {
    if (vnPhase === 'reading') {
      showChoices();
    } else {
      advanceScene();
    }
    return;
  }
  const line = lines[vnLineIdx];
  const scene = SCENES[vnSceneIdx];
  if (line.emotion) setEmotion(scene, line.emotion);
  setNameplate(line.speaker);
  typeText(line.text);
}

function vnAdvance() {
  if (vnPhase === 'choice') return;
  if (!vnTypingDone) { skipType(); return; }
  vnLineIdx++;
  showCurrentLine();
}

function showChoices() {
  vnPhase = 'choice';
  document.getElementById('vnAdvanceBlink').style.display = 'none';
  const overlay = document.getElementById('vnChoiceOverlay');
  const list = document.getElementById('vnChoiceList');
  const scene = SCENES[vnSceneIdx];
  document.getElementById('vnChoicePrompt').textContent = `🎯 ${scene.choicePrompt}`;
  list.innerHTML = '';
  scene.choices.forEach((c, i) => {
    const btn = document.createElement('button');
    btn.className = 'vn-choice';
    btn.innerHTML = `<span class="key">${KEYS[i]}</span><span>${c.text}</span>`;
    btn.addEventListener('click', () => selectChoice(i));
    list.appendChild(btn);
  });
  overlay.classList.add('active');
  document.getElementById('vnNameplate').textContent = '';
  document.getElementById('vnText').textContent = '';
}

function selectChoice(idx) {
  const scene = SCENES[vnSceneIdx];
  const choice = scene.choices[idx];
  const correct = choice.correct;
  vnChoiceResult = correct ? 'correct' : 'wrong';

  // Reveal correct/wrong on buttons
  document.querySelectorAll('.vn-choice').forEach((btn, i) => {
    if (scene.choices[i].correct) {
      btn.classList.add('result-correct');
    } else if (i === idx && !correct) {
      btn.classList.add('result-chosen-wrong');
    } else {
      btn.classList.add('result-wrong');
    }
    btn.disabled = true;
  });

  if (correct) {
    markSatisfied(scene);
    vnTrust = Math.min(1000, vnTrust + 250);
    updateTrust();
  } else {
    const explain = choice.wrongExplain || '물리적으로 다시 생각해봐요.';
    const np = document.getElementById('vnNameplate');
    np.style.background = 'rgba(255,80,80,.12)';
    np.style.color = '#ff8080';
    np.style.borderColor = 'rgba(255,80,80,.3)';
    np.textContent = '— 물리 해설 —';
    document.getElementById('vnText').textContent = `💡 ${explain}`;
  }

  setTimeout(() => {
    document.getElementById('vnChoiceOverlay').classList.remove('active');
    document.getElementById('vnAdvanceBlink').style.display = '';
    vnPhase = 'feedback';
    vnLineIdx = 0;
    setEmotion(scene, correct ? 'happy' : 'troubled');
    showCurrentLine();
  }, 1800);
}

function updateTrust() {
  document.getElementById('vnTrustFill').style.width = (vnTrust / 10) + '%';
  document.getElementById('vnTrustScore').textContent = vnTrust;
}

function saveMission4AndReturn() {
  const finalScore = ElabProgress.clampScore(vnTrust);
  ElabProgress.saveMission(4, 'clear', finalScore);
  MissionUI.showClearAndReturn({
    score: finalScore,
    kicker: 'Championship Clear',
    accent: '#f3c451',
    label: '에너지 보존의 완성',
    formula: 'Ek + Ep + Es + Q = E₀',
    formulaSize: '1.5rem',
    desc: '에너지는 형태만 바뀔 뿐, 절대 사라지지 않는다'
  });
}

function advanceScene() {
  if (vnSceneIdx >= SCENES.length - 1) {
    endVN();
    return;
  }
  // Fade transition
  const tr = document.getElementById('vnTransition');
  tr.classList.add('fade-in');
  setTimeout(() => {
    vnSceneIdx++;
    vnLineIdx = 0;
    vnPhase = 'reading';
    vnChoiceResult = null;
    vnEmotions = { seoyun: 'neutral', jihun: 'neutral', minjae: 'neutral' };
    document.getElementById('vnSceneNum').textContent = vnSceneIdx + 1;
    resizeVN();
    showCurrentLine();
    setTimeout(() => tr.classList.remove('fade-in'), 100);
  }, 600);
}

function endVN() {
  if (vnBgRaf) cancelAnimationFrame(vnBgRaf);
  saveMission4AndReturn();
}

/* ── Keyboard support ── */
document.addEventListener('keydown', e => {
  if (document.getElementById('phaseVN').classList.contains('active')) {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      if (vnPhase !== 'choice') vnAdvance();
    }
    if (vnPhase === 'choice') {
      const k = e.key.toUpperCase();
      const idx = KEYS.indexOf(k);
      if (idx !== -1 && idx < SCENES[vnSceneIdx].choices.length) {
        const btns = document.querySelectorAll('.vn-choice:not([disabled])');
        if (btns[idx]) btns[idx].click();
      }
    }
  }
});
document.getElementById('vnDialogue').addEventListener('click', () => {
  if (vnPhase !== 'choice') vnAdvance();
});

/* ── Start VN ── */
document.getElementById('vnSceneNum').textContent = '1';
vnBgRaf = requestAnimationFrame(renderVN);
showCurrentLine();

/* ══════════════════════════════════
   CUTSCENE
══════════════════════════════════ */
let cSlide = 0;
const C_COUNT = 4;

function setCSlide(n) {
  document.querySelectorAll('#slideContent .slide').forEach((el, i) => el.classList.toggle('active', i === n));
  document.getElementById('slideCounter').textContent = `${n+1} / ${C_COUNT}`;
  document.getElementById('btnPrev').disabled = n === 0;
  document.getElementById('btnNext').textContent = n === C_COUNT - 1 ? '미션 완료 →' : '다음 →';
  cSlide = n;
}

document.getElementById('btnNext').addEventListener('click', () => {
  if (cSlide === C_COUNT - 1) {
    saveMission4AndReturn();
  } else {
    setCSlide(cSlide + 1);
  }
});
document.getElementById('btnPrev').addEventListener('click', () => {
  if (cSlide > 0) setCSlide(cSlide - 1);
});
