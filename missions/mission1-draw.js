'use strict';

function draw() {
  if (T3.ready) {
    drawThree();
    return;
  }
  ctx.clearRect(0, 0, view.w, view.h);
  drawBackground();
  drawPipe();
  drawRiderShadow();
  drawParticles();
  drawRider();
  drawEnergyLabels();
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, view.h);
  sky.addColorStop(0, '#07111f');
  sky.addColorStop(0.5, '#17304b');
  sky.addColorStop(1, '#233c4a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, view.w, view.h);

  const moon = ctx.createRadialGradient(view.w * 0.78, view.h * 0.18, 0, view.w * 0.78, view.h * 0.18, view.w * 0.28);
  moon.addColorStop(0, 'rgba(210,235,255,0.22)');
  moon.addColorStop(0.18, 'rgba(150,210,255,0.08)');
  moon.addColorStop(1, 'rgba(150,210,255,0)');
  ctx.fillStyle = moon;
  ctx.fillRect(0, 0, view.w, view.h * 0.6);

  drawAuroraRibbons();

  drawMountain('#18283b', 0.48, 0.12, 0.8);
  drawMountain('#203b4f', 0.58, 0.09, 1.7);

  const ground = ctx.createLinearGradient(0, view.base - PIPE_HEIGHT * view.scale, 0, view.h);
  ground.addColorStop(0, '#e8f6ff');
  ground.addColorStop(1, '#bdd8e8');
  ctx.fillStyle = ground;
  ctx.fillRect(0, view.base - 4, view.w, view.h - view.base + 4);
  drawCompetitionAprons();
  drawVenueBackdrop();

  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  for (let i = 0; i < 70; i += 1) {
    const x = fract(Math.sin(i * 17.31) * 9000) * view.w;
    const y = view.base + fract(Math.sin(i * 29.17) * 7000) * (view.h - view.base);
    ctx.fillRect(x, y, 1.4, 1.4);
  }

  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  for (const f of flakes) {
    const x = (f.x * view.w + performance.now() * f.s * 0.025) % view.w;
    const y = (f.y * view.h * 0.78 + performance.now() * f.s * 0.018) % (view.h * 0.78);
    ctx.beginPath();
    ctx.arc(x, y, f.r, 0, Math.PI * 2);
    ctx.fill();
  }

  drawFloodLights();
}

function drawAuroraRibbons() {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const time = performance.now() * 0.00018;
  const ribbons = [
    { y: 0.14, amp: 18, width: 30, c1: 'rgba(62,230,143,0.10)', c2: 'rgba(48,213,255,0.05)', phase: 0.0 },
    { y: 0.21, amp: 23, width: 24, c1: 'rgba(48,213,255,0.08)', c2: 'rgba(214,255,238,0.04)', phase: 1.7 }
  ];

  for (const ribbon of ribbons) {
    const top = [];
    const bottom = [];
    for (let i = 0; i <= 18; i += 1) {
      const t = i / 18;
      const x = -view.w * 0.08 + t * view.w * 1.16;
      const wave = Math.sin(t * Math.PI * 2.1 + ribbon.phase + time) * ribbon.amp
        + Math.sin(t * Math.PI * 5.3 + ribbon.phase * 0.7) * ribbon.amp * 0.32;
      const y = view.h * ribbon.y + wave;
      const thickness = ribbon.width * (0.5 + 0.5 * Math.sin(t * Math.PI));
      top.push({ x, y: y - thickness * 0.44 });
      bottom.push({ x, y: y + thickness * 0.56 });
    }

    const grad = ctx.createLinearGradient(0, view.h * (ribbon.y - 0.05), view.w, view.h * (ribbon.y + 0.12));
    grad.addColorStop(0, 'rgba(62,230,143,0)');
    grad.addColorStop(0.24, ribbon.c1);
    grad.addColorStop(0.58, ribbon.c2);
    grad.addColorStop(1, 'rgba(48,213,255,0)');
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.moveTo(top[0].x, top[0].y);
    for (let i = 1; i < top.length; i += 1) {
      const prev = top[i - 1];
      const cur = top[i];
      ctx.quadraticCurveTo(prev.x, prev.y, (prev.x + cur.x) / 2, (prev.y + cur.y) / 2);
    }
    for (let i = bottom.length - 1; i >= 1; i -= 1) {
      const prev = bottom[i];
      const cur = bottom[i - 1];
      ctx.quadraticCurveTo(prev.x, prev.y, (prev.x + cur.x) / 2, (prev.y + cur.y) / 2);
    }
    ctx.closePath();
    ctx.filter = 'blur(10px)';
    ctx.fill();
    ctx.filter = 'none';

    ctx.strokeStyle = ribbon.c1;
    ctx.lineWidth = 1.2;
    ctx.globalAlpha = 0.42;
    ctx.beginPath();
    ctx.moveTo(top[0].x, (top[0].y + bottom[0].y) / 2);
    for (let i = 1; i < top.length; i += 1) {
      const y = (top[i].y + bottom[i].y) / 2;
      ctx.lineTo(top[i].x, y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function drawSideVenueFill() {
  const deckY = toScreen(0, PIPE_HEIGHT + 0.55).y;
  drawSnowBerms(deckY);
  drawPineClusters(deckY);
  drawServiceTents(deckY);
  drawCameraPlatforms(deckY);
}

function drawCompetitionAprons() {
  const deckY = toScreen(0, PIPE_HEIGHT + 0.55).y;
  for (const side of [-1, 1]) {
    const outerX = side < 0 ? 0 : view.w;
    const nearLipX = view.cx + side * view.scale * 20.2;
    const deckOuterX = view.cx + side * view.scale * 31;
    const lowerY = view.base + view.scale * 7.8;
    const upperY = deckY + view.scale * 0.6;

    const snow = ctx.createLinearGradient(0, upperY - 28, 0, lowerY);
    snow.addColorStop(0, '#f7fcff');
    snow.addColorStop(0.58, '#d6eaf6');
    snow.addColorStop(1, '#a8c8dc');
    ctx.fillStyle = snow;
    ctx.beginPath();
    ctx.moveTo(outerX, deckY + view.scale * 0.9);
    ctx.bezierCurveTo(
      outerX - side * view.scale * 5.4,
      deckY + view.scale * 0.1,
      deckOuterX - side * view.scale * 2.4,
      deckY - view.scale * 0.15,
      nearLipX,
      upperY
    );
    ctx.lineTo(nearLipX - side * view.scale * 3.8, lowerY);
    ctx.lineTo(outerX, view.h + 8);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(62,116,150,0.17)';
    ctx.lineWidth = 1.3;
    for (let lane = 0; lane < 11; lane += 1) {
      const t = lane / 10;
      const x0 = outerX + (nearLipX - outerX) * t;
      const y0 = deckY + view.scale * (1.1 + Math.sin(t * Math.PI) * 0.35);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.bezierCurveTo(
        x0 - side * view.scale * 0.8,
        y0 + view.scale * 2.0,
        x0 - side * view.scale * 1.8,
        y0 + view.scale * 4.5,
        x0 - side * view.scale * 3.0,
        y0 + view.scale * 7.6
      );
      ctx.stroke();
    }

    drawSpectatorRail(side, outerX, nearLipX, deckY);
    drawRealSponsorWall(side, outerX, nearLipX, deckY);
  }
}

function drawSpectatorRail(side, outerX, nearLipX, deckY) {
  const y = deckY - view.scale * 1.0;
  ctx.strokeStyle = 'rgba(225,242,252,0.65)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(outerX, y);
  ctx.lineTo(nearLipX - side * view.scale * 0.8, y - view.scale * 0.35);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(91,132,159,0.62)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i <= 16; i += 1) {
    const t = i / 16;
    const x = outerX + (nearLipX - outerX) * t;
    const postY = y - view.scale * 0.35 * t;
    ctx.beginPath();
    ctx.moveTo(x, postY);
    ctx.lineTo(x, postY + 18);
    ctx.stroke();
  }

  const jacketColors = ['#f8fbff', '#30d5ff', '#1f7ad1', '#ffb347', '#dce7ef', '#ef476f'];
  for (let i = 0; i < 80; i += 1) {
    const r = fract(Math.sin(i * 52.37 + side) * 9000);
    const x = outerX + (nearLipX - outerX) * r;
    const yJ = y - 18 - fract(Math.sin(i * 19.11) * 6000) * 26;
    if (side < 0 && x > nearLipX - 14) continue;
    if (side > 0 && x < nearLipX + 14) continue;
    ctx.fillStyle = jacketColors[i % jacketColors.length];
    ctx.globalAlpha = 0.48 + fract(Math.sin(i * 8.41) * 4000) * 0.34;
    ctx.beginPath();
    ctx.arc(x, yJ, 2.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x - 1.8, yJ + 2, 3.6, 4.2);
  }
  ctx.globalAlpha = 1;
}

function drawRealSponsorWall(side, outerX, nearLipX, deckY) {
  const labels = side < 0
    ? ['FIS', 'PARK & PIPE', 'MULIGO']
    : ['WORLD CUP', 'ENERGY', 'LAND CLEAN'];
  const y = deckY + view.scale * 0.58;
  const count = 3;
  const available = Math.abs(nearLipX - outerX) - 34;
  const panelW = Math.min(96, available / count - 8);

  for (let i = 0; i < count; i += 1) {
    const t = (i + 0.55) / count;
    const x = outerX + (nearLipX - outerX) * t;
    ctx.save();
    ctx.translate(x, y - i * 2);
    ctx.rotate(side * -0.025);
    ctx.fillStyle = i % 2 === 0 ? 'rgba(8,17,30,0.82)' : 'rgba(245,251,255,0.88)';
    ctx.beginPath();
    ctx.roundRect(-panelW / 2, -15, panelW, 30, 4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(48,213,255,0.26)';
    ctx.stroke();
    ctx.fillStyle = i % 2 === 0 ? '#f8fbff' : '#08111e';
    ctx.font = '900 9px Pretendard';
    ctx.textAlign = 'center';
    ctx.fillText(labels[i], 0, 3);
    ctx.restore();
  }
}

function drawSnowBerms(deckY) {
  for (const side of [-1, 1]) {
    const outerX = side < 0 ? 0 : view.w;
    const innerX = view.cx + side * view.scale * 22.2;
    const crestY = deckY + view.scale * 2.0;
    const bottomY = view.h + 10;
    const berm = ctx.createLinearGradient(0, crestY, 0, bottomY);
    berm.addColorStop(0, '#f6fbff');
    berm.addColorStop(0.56, '#cfe4f2');
    berm.addColorStop(1, '#9fbdd0');
    ctx.fillStyle = berm;
    ctx.beginPath();
    ctx.moveTo(outerX, crestY + 24);
    ctx.bezierCurveTo(
      outerX + side * -view.w * 0.12,
      crestY - 20,
      innerX - side * view.scale * 5,
      crestY - view.scale * 0.9,
      innerX,
      crestY
    );
    ctx.lineTo(innerX - side * view.scale * 2.4, bottomY);
    ctx.lineTo(outerX, bottomY);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(44,96,132,0.14)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 9; i += 1) {
      const t = i / 8;
      const x0 = outerX + (innerX - outerX) * t;
      const y0 = crestY + 28 + Math.sin(t * Math.PI) * 18;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.bezierCurveTo(x0 - side * 30, y0 + 26, x0 - side * 44, y0 + 72, x0 - side * 55, y0 + 126);
      ctx.stroke();
    }
  }
}

function drawPineClusters(deckY) {
  for (const side of [-1, 1]) {
    for (let i = 0; i < 18; i += 1) {
      const r = fract(Math.sin(i * 34.17 + side * 7.3) * 9000);
      const x = side < 0
        ? 18 + r * Math.max(30, view.cx - view.scale * 25)
        : view.cx + view.scale * 25 + r * Math.max(30, view.w - (view.cx + view.scale * 25) - 18);
      const y = deckY - view.scale * (1.5 + fract(Math.sin(i * 11.2) * 6000) * 4.8);
      const size = 20 + fract(Math.sin(i * 19.71) * 5000) * 34;
      drawPineTree(x, y, size, i % 3 === 0);
    }
  }
}

function drawPineTree(x, y, size, lit) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = lit ? 'rgba(26,70,62,0.92)' : 'rgba(12,42,47,0.92)';
  for (let layer = 0; layer < 3; layer += 1) {
    const w = size * (0.55 + layer * 0.18);
    const h = size * (0.55 + layer * 0.22);
    const yy = layer * size * 0.25;
    ctx.beginPath();
    ctx.moveTo(0, yy - h);
    ctx.lineTo(-w, yy + h * 0.25);
    ctx.quadraticCurveTo(-w * 0.25, yy + h * 0.1, 0, yy + h * 0.28);
    ctx.quadraticCurveTo(w * 0.25, yy + h * 0.1, w, yy + h * 0.25);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(75,54,39,0.85)';
  ctx.fillRect(-size * 0.08, size * 0.52, size * 0.16, size * 0.32);
  if (lit) {
    ctx.fillStyle = 'rgba(255,245,205,0.78)';
    ctx.beginPath();
    ctx.arc(size * 0.16, -size * 0.26, 1.7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawServiceTents(deckY) {
  const tents = [
    { side: -1, x: 0.11, y: 1.25, color: '#30d5ff', label: 'TEAM' },
    { side: -1, x: 0.22, y: 2.45, color: '#ff5fa2', label: 'MEDIA' },
    { side: 1, x: 0.12, y: 1.7, color: '#ffb347', label: 'RESCUE' },
    { side: 1, x: 0.25, y: 2.9, color: '#3ee68f', label: 'CREW' }
  ];

  for (const tent of tents) {
    const available = view.w * 0.5 - view.scale * 25;
    const x = tent.side < 0
      ? 26 + available * tent.x
      : view.w - 26 - available * tent.x;
    const y = deckY + view.scale * tent.y;
    drawTent(x, y, tent.side, tent.color, tent.label);
  }
}

function drawTent(x, y, side, color, label) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(8,17,30,0.28)';
  ctx.beginPath();
  ctx.ellipse(0, 22, 44, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-42, 8);
  ctx.lineTo(0, -24);
  ctx.lineTo(42, 8);
  ctx.closePath();
  ctx.fill();

  const shade = ctx.createLinearGradient(-42, -20, 42, 14);
  shade.addColorStop(0, 'rgba(255,255,255,0.32)');
  shade.addColorStop(0.48, 'rgba(255,255,255,0.08)');
  shade.addColorStop(1, 'rgba(0,0,0,0.18)');
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.moveTo(-42, 8);
  ctx.lineTo(0, -24);
  ctx.lineTo(42, 8);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(8,17,30,0.82)';
  ctx.fillRect(-38, 8, 76, 24);
  ctx.fillStyle = '#f8fbff';
  ctx.font = '900 8px Pretendard';
  ctx.textAlign = 'center';
  ctx.fillText(label, 0, 24);
  ctx.restore();
}

function drawCameraPlatforms(deckY) {
  for (const side of [-1, 1]) {
    const x = side < 0 ? view.w * 0.08 : view.w * 0.92;
    const y = deckY - view.scale * 3.8;
    ctx.strokeStyle = 'rgba(200,225,240,0.48)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - side * 18, y + 76);
    ctx.lineTo(x, y);
    ctx.lineTo(x + side * 18, y + 76);
    ctx.moveTo(x - side * 10, y + 36);
    ctx.lineTo(x + side * 10, y + 36);
    ctx.stroke();

    ctx.fillStyle = 'rgba(8,17,30,0.86)';
    ctx.beginPath();
    ctx.roundRect(x - 26, y - 12, 52, 20, 4);
    ctx.fill();
    ctx.fillStyle = 'rgba(48,213,255,0.9)';
    ctx.beginPath();
    ctx.arc(x + side * 18, y - 2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 22, y - 8, 30, 12);
  }
}

function drawVenueBackdrop() {
  const deckY = toScreen(0, PIPE_HEIGHT + 0.55).y;
  drawGrandstand(-1, deckY);
  drawGrandstand(1, deckY);
  drawScoreboard(deckY);
  drawJudgesBooth(deckY);
  drawCourseBanners(deckY);
  drawFlagLine(deckY);
  drawSafetyNets(deckY);
}

function drawGrandstand(side, deckY) {
  const outerX = side < 0 ? 0 : view.w;
  const innerX = view.cx + side * view.scale * 23.5;
  const topY = Math.max(86, deckY - view.scale * 5.8);
  const bottomY = deckY + view.scale * 1.2;

  const stand = ctx.createLinearGradient(0, topY, 0, bottomY);
  stand.addColorStop(0, 'rgba(18,38,58,0.92)');
  stand.addColorStop(0.55, 'rgba(25,55,78,0.86)');
  stand.addColorStop(1, 'rgba(10,22,34,0.92)');
  ctx.fillStyle = stand;
  ctx.beginPath();
  ctx.moveTo(outerX, topY + 18);
  ctx.lineTo(innerX, topY);
  ctx.lineTo(innerX - side * view.scale * 2.2, bottomY);
  ctx.lineTo(outerX, bottomY + 22);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(210,235,255,0.18)';
  ctx.lineWidth = 1;
  for (let row = 0; row < 7; row += 1) {
    const t = row / 6;
    const y = topY + 18 + t * (bottomY - topY);
    ctx.beginPath();
    ctx.moveTo(outerX, y + 8);
    ctx.lineTo(innerX - side * view.scale * (0.2 + t * 2.0), y);
    ctx.stroke();
  }

  const colors = ['#f8fbff', '#30d5ff', '#ffb347', '#ff5fa2', '#3ee68f'];
  for (let i = 0; i < 120; i += 1) {
    const rx = fract(Math.sin(i * 43.91 + side) * 9000);
    const ry = fract(Math.sin(i * 18.73 + side * 4) * 7000);
    const x = side < 0
      ? outerX + 18 + rx * Math.max(40, innerX - 34)
      : innerX + 18 + rx * Math.max(40, view.w - innerX - 34);
    const y = topY + 14 + ry * Math.max(1, bottomY - topY - 20);
    if ((side < 0 && x > innerX - 16) || (side > 0 && x < innerX + 16)) continue;
    ctx.fillStyle = colors[i % colors.length];
    ctx.globalAlpha = 0.35 + fract(Math.sin(i * 9.13) * 3000) * 0.35;
    ctx.fillRect(x, y, 2.2, 2.2);
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = 'rgba(7,17,31,0.82)';
  ctx.beginPath();
  ctx.moveTo(outerX, bottomY - 6);
  ctx.lineTo(innerX - side * view.scale * 1.8, bottomY - 18);
  ctx.lineTo(innerX - side * view.scale * 1.7, bottomY + 2);
  ctx.lineTo(outerX, bottomY + 18);
  ctx.closePath();
  ctx.fill();
}

function drawScoreboard(deckY) {
  const boardW = Math.min(240, view.w * 0.22);
  const boardH = 72;
  const x = view.cx - boardW / 2;
  const y = Math.max(74, deckY - view.scale * 8.6);

  ctx.strokeStyle = 'rgba(210,235,255,0.32)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 18, y + boardH);
  ctx.lineTo(x + 18, deckY + view.scale * 0.8);
  ctx.moveTo(x + boardW - 18, y + boardH);
  ctx.lineTo(x + boardW - 18, deckY + view.scale * 0.8);
  ctx.stroke();

  const frame = ctx.createLinearGradient(x, y, x, y + boardH);
  frame.addColorStop(0, '#20384e');
  frame.addColorStop(1, '#08111e');
  ctx.fillStyle = frame;
  ctx.beginPath();
  ctx.roundRect(x, y, boardW, boardH, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(248,251,255,0.28)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = 'rgba(48,213,255,0.12)';
  ctx.fillRect(x + 8, y + 8, boardW - 16, boardH - 16);
  ctx.fillStyle = '#3ee68f';
  ctx.font = '900 11px Pretendard';
  ctx.textAlign = 'center';
  ctx.fillText('HALFPIPE FINALS', x + boardW / 2, y + 24);
  ctx.fillStyle = '#f8fbff';
  ctx.font = '800 18px Pretendard';
  ctx.fillText(`${state.landings}/${TARGET_LANDINGS} LANDINGS`, x + boardW / 2, y + 48);
  ctx.fillStyle = 'rgba(255,179,71,0.92)';
  ctx.font = '800 10px Pretendard';
  ctx.fillText(`STYLE ${Math.min(1000, Math.round(state.score / 15)).toLocaleString('ko-KR')}`, x + boardW / 2, y + 63);
}

function drawJudgesBooth(deckY) {
  const w = 168;
  const h = 54;
  const x = view.cx + view.scale * 18.7;
  const y = deckY - view.scale * 5.4;

  ctx.fillStyle = 'rgba(6,14,24,0.86)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(210,235,255,0.22)';
  ctx.stroke();

  ctx.fillStyle = 'rgba(48,213,255,0.18)';
  for (let i = 0; i < 4; i += 1) {
    ctx.fillRect(x + 10 + i * 38, y + 10, 30, 18);
  }
  ctx.fillStyle = '#f8fbff';
  ctx.font = '900 9px Pretendard';
  ctx.textAlign = 'left';
  ctx.fillText('JUDGES', x + 10, y + 42);
  ctx.fillStyle = '#ffb347';
  ctx.fillText('STYLE REVIEW', x + 70, y + 42);

  ctx.strokeStyle = 'rgba(210,235,255,0.28)';
  ctx.beginPath();
  ctx.moveTo(x + 18, y + h);
  ctx.lineTo(x + 18, deckY + view.scale * 1.2);
  ctx.moveTo(x + w - 18, y + h);
  ctx.lineTo(x + w - 18, deckY + view.scale * 1.2);
  ctx.stroke();
}

function drawCourseBanners(deckY) {
  const banners = [
    { side: -1, label: 'ENERGY TRANSFER', color: '#30d5ff' },
    { side: -1, label: 'Ep <-> Ek', color: '#3ee68f' },
    { side: 1, label: 'LAND CLEAN', color: '#ffb347' },
    { side: 1, label: 'MULIGO CUP', color: '#ff5fa2' }
  ];

  for (let i = 0; i < banners.length; i += 1) {
    const b = banners[i];
    const x = view.cx + b.side * view.scale * (20.6 + (i % 2) * 3.3);
    const y = deckY + view.scale * (0.3 + (i % 2) * 1.0);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(b.side * -0.08);
    ctx.fillStyle = 'rgba(8,17,30,0.76)';
    ctx.beginPath();
    ctx.roundRect(b.side < 0 ? -112 : 0, -13, 112, 26, 4);
    ctx.fill();
    ctx.fillStyle = b.color;
    ctx.fillRect(b.side < 0 ? -108 : 4, -9, 5, 18);
    ctx.fillStyle = '#f8fbff';
    ctx.font = '900 9px Pretendard';
    ctx.textAlign = b.side < 0 ? 'right' : 'left';
    ctx.fillText(b.label, b.side < 0 ? -12 : 12, 3);
    ctx.restore();
  }
}

function drawFlagLine(deckY) {
  for (let i = 0; i < 12; i += 1) {
    const side = i < 6 ? -1 : 1;
    const local = i % 6;
    const x = view.cx + side * view.scale * (18.8 + local * 1.25);
    const y = deckY - view.scale * (0.3 + local * 0.08);
    ctx.strokeStyle = 'rgba(230,245,255,0.62)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x, y + 16);
    ctx.lineTo(x, y - 16);
    ctx.stroke();
    ctx.fillStyle = local % 3 === 0 ? '#30d5ff' : local % 3 === 1 ? '#ffb347' : '#3ee68f';
    ctx.beginPath();
    ctx.moveTo(x, y - 16);
    ctx.lineTo(x + side * 18, y - 11);
    ctx.lineTo(x, y - 5);
    ctx.closePath();
    ctx.fill();
  }
}

function drawSafetyNets(deckY) {
  for (const side of [-1, 1]) {
    const startX = view.cx + side * view.scale * 19.4;
    const endX = view.cx + side * view.scale * 25.4;
    const topY = deckY - view.scale * 1.2;
    const bottomY = deckY + view.scale * 2.4;

    ctx.strokeStyle = 'rgba(48,213,255,0.28)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i <= 8; i += 1) {
      const t = i / 8;
      const x = startX + (endX - startX) * t;
      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(x - side * view.scale * 0.7, bottomY);
      ctx.stroke();
    }
    for (let i = 0; i <= 5; i += 1) {
      const t = i / 5;
      const y = topY + (bottomY - topY) * t;
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y + view.scale * 0.25);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(248,251,255,0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX, topY);
    ctx.lineTo(endX, topY + view.scale * 0.25);
    ctx.stroke();
  }
}

function drawMountain(color, baseFrac, ampFrac, seed) {
  const points = [];
  for (let x = -view.w * 0.08; x <= view.w * 1.08; x += view.w / 12) {
    const peak = view.h * (baseFrac - ampFrac - Math.sin(x * 0.007 + seed) * ampFrac * 0.55)
      - Math.sin(x * 0.018 + seed * 2.1) * view.h * ampFrac * 0.22;
    points.push({ x, y: peak });
  }

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, view.h * baseFrac);
  ctx.lineTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const cur = points[i];
    ctx.quadraticCurveTo(prev.x, prev.y, (prev.x + cur.x) / 2, (prev.y + cur.y) / 2);
  }
  ctx.lineTo(view.w, view.h * baseFrac);
  ctx.lineTo(view.w, view.h);
  ctx.lineTo(0, view.h);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(235,248,255,0.18)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y + 2);
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const cur = points[i];
    ctx.quadraticCurveTo(prev.x, prev.y + 2, (prev.x + cur.x) / 2, (prev.y + cur.y) / 2 + 2);
  }
  ctx.stroke();

  for (let i = 1; i < points.length - 1; i += 3) {
    const p = points[i];
    const next = points[i + 1];
    ctx.fillStyle = 'rgba(238,248,255,0.18)';
    ctx.beginPath();
    ctx.moveTo(p.x, p.y + 4);
    ctx.lineTo(p.x + (next.x - p.x) * 0.38, p.y + 28);
    ctx.lineTo(p.x - (next.x - p.x) * 0.34, p.y + 30);
    ctx.closePath();
    ctx.fill();
  }
}

function drawFloodLights() {
  const poles = [-23, 23];
  for (const x of poles) {
    const p = toScreen(x, 8.5);
    const beam = ctx.createLinearGradient(p.x, p.y, view.cx, view.base);
    beam.addColorStop(0, 'rgba(255,245,205,0.18)');
    beam.addColorStop(0.45, 'rgba(255,245,205,0.06)');
    beam.addColorStop(1, 'rgba(255,245,205,0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(p.x - 18, p.y + 6);
    ctx.lineTo(view.cx - x * view.scale * 0.18, view.base - view.scale * 8);
    ctx.lineTo(view.cx - x * view.scale * 0.56, view.base + view.scale * 2.5);
    ctx.lineTo(p.x + 18, p.y + 6);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(210,230,240,0.38)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x, view.base + 20);
    ctx.stroke();
    const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, view.scale * 6);
    glow.addColorStop(0, 'rgba(255,240,190,0.20)');
    glow.addColorStop(1, 'rgba(255,240,190,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(p.x - view.scale * 6, p.y - view.scale * 6, view.scale * 12, view.scale * 12);
    ctx.fillStyle = '#ffe6a3';
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.roundRect(p.x - 22 + i * 12, p.y - 5, 9, 9, 2);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(8,17,30,0.65)';
    ctx.lineWidth = 1;
    ctx.strokeRect(p.x - 24, p.y - 7, 52, 13);
  }
}

function drawPipe() {
  const pts = [];
  for (let i = 0; i <= 120; i += 1) {
    const x = -LIP_X + (LIP_X * 2 * i) / 120;
    pts.push(toScreen(x, pipeHeight(x)));
  }

  pipePath(pts);
  const pipeFill = ctx.createLinearGradient(0, toScreen(0, PIPE_HEIGHT).y, 0, view.base + 80);
  pipeFill.addColorStop(0, '#f7fcff');
  pipeFill.addColorStop(0.45, '#d7ecfa');
  pipeFill.addColorStop(1, '#9fc2d7');
  ctx.fillStyle = pipeFill;
  ctx.fill();

  ctx.save();
  pipePath(pts);
  ctx.clip();
  const depthShade = ctx.createRadialGradient(view.cx, view.base - view.scale * 1.2, view.scale * 1.8, view.cx, view.base - view.scale * 1.2, view.scale * 22);
  depthShade.addColorStop(0, 'rgba(42,106,145,0.28)');
  depthShade.addColorStop(0.42, 'rgba(42,106,145,0.10)');
  depthShade.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = depthShade;
  ctx.fillRect(0, view.base - view.scale * 12, view.w, view.scale * 16);

  for (let i = -15; i <= 15; i += 1.5) {
    const top = toScreen(i, pipeHeight(i) - 0.06);
    const bottom = toScreen(i * 0.45, -1.25);
    ctx.strokeStyle = i % 3 === 0 ? 'rgba(35,91,128,0.16)' : 'rgba(255,255,255,0.22)';
    ctx.lineWidth = i % 3 === 0 ? 1.2 : 0.8;
    ctx.beginPath();
    ctx.moveTo(top.x, top.y);
    ctx.quadraticCurveTo((top.x + bottom.x) * 0.5, view.base - view.scale * 0.15, bottom.x, bottom.y);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255,255,255,0.52)';
  for (let i = 0; i < 150; i += 1) {
    const x = -LIP_X + fract(Math.sin(i * 31.71) * 5000) * LIP_X * 2;
    const y = pipeHeight(x) - 0.2 - fract(Math.sin(i * 11.37) * 3000) * 1.15;
    const p = toScreen(x, y);
    ctx.globalAlpha = 0.18 + fract(Math.sin(i * 7.19) * 4000) * 0.24;
    ctx.fillRect(p.x, p.y, 1.3, 1.3);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  ctx.strokeStyle = 'rgba(58, 99, 126, 0.45)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (const p of pts) ctx.lineTo(p.x, p.y);
  ctx.stroke();

  drawPipeDecks();

  ctx.strokeStyle = 'rgba(32, 78, 112, 0.28)';
  ctx.lineWidth = 1;
  for (let i = -15; i <= 15; i += 3) {
    const p1 = toScreen(i, pipeHeight(i));
    const p2 = toScreen(i * 1.08, -1.2);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  drawHeightTicks();
  drawBlueDyeLines();
}

function drawPipeDecks() {
  for (const side of [-1, 1]) {
    const lip = toScreen(side * LIP_X, PIPE_HEIGHT);
    const innerTop = toScreen(side * (LIP_X - 0.35), PIPE_HEIGHT + 0.12);
    const outerTop = toScreen(side * (LIP_X + 7.2), PIPE_HEIGHT + 0.72);
    const outerBottom = toScreen(side * (LIP_X + 7.2), PIPE_HEIGHT - 0.1);
    const innerBottom = toScreen(side * (LIP_X - 0.1), PIPE_HEIGHT - 0.34);

    const deckFill = ctx.createLinearGradient(0, outerTop.y, 0, innerBottom.y + 28);
    deckFill.addColorStop(0, '#f8fcff');
    deckFill.addColorStop(0.55, '#d9ebf7');
    deckFill.addColorStop(1, '#9ebdd0');
    ctx.fillStyle = deckFill;
    ctx.beginPath();
    ctx.moveTo(innerTop.x, innerTop.y);
    ctx.lineTo(outerTop.x, outerTop.y);
    ctx.lineTo(outerBottom.x, outerBottom.y);
    ctx.lineTo(innerBottom.x, innerBottom.y);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(248,251,255,0.95)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(innerTop.x, innerTop.y);
    ctx.lineTo(outerTop.x, outerTop.y);
    ctx.stroke();

    ctx.strokeStyle = side < 0 ? '#ffb347' : '#30d5ff';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(lip.x - side * 26, lip.y - 2);
    ctx.lineTo(lip.x + side * 22, lip.y + 4);
    ctx.stroke();

    drawDeckFence(side, innerTop, outerTop);
    drawSponsorPanels(side, innerBottom, outerBottom);
  }
}

function drawDeckFence(side, innerTop, outerTop) {
  const railY = -18;
  ctx.strokeStyle = 'rgba(223,240,252,0.78)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(innerTop.x, innerTop.y + railY);
  ctx.lineTo(outerTop.x, outerTop.y + railY);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(118,157,184,0.72)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i <= 6; i += 1) {
    const t = i / 6;
    const x = innerTop.x + (outerTop.x - innerTop.x) * t;
    const y = innerTop.y + (outerTop.y - innerTop.y) * t;
    ctx.beginPath();
    ctx.moveTo(x, y + railY);
    ctx.lineTo(x, y + 6);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(48,213,255,0.22)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i += 1) {
    const t0 = i / 5;
    const t1 = (i + 1) / 5;
    const x0 = innerTop.x + (outerTop.x - innerTop.x) * t0;
    const y0 = innerTop.y + (outerTop.y - innerTop.y) * t0;
    const x1 = innerTop.x + (outerTop.x - innerTop.x) * t1;
    const y1 = innerTop.y + (outerTop.y - innerTop.y) * t1;
    ctx.beginPath();
    ctx.moveTo(x0, y0 + 4);
    ctx.lineTo(x1, y1 + railY);
    ctx.moveTo(x0, y0 + railY);
    ctx.lineTo(x1, y1 + 4);
    ctx.stroke();
  }

  ctx.fillStyle = side < 0 ? 'rgba(255,179,71,0.92)' : 'rgba(48,213,255,0.92)';
  for (let i = 1; i <= 2; i += 1) {
    const t = i / 3;
    const x = innerTop.x + (outerTop.x - innerTop.x) * t;
    const y = innerTop.y + (outerTop.y - innerTop.y) * t + railY - 4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + side * 16, y + 4);
    ctx.lineTo(x, y + 10);
    ctx.closePath();
    ctx.fill();
  }
}

function drawSponsorPanels(side, innerBottom, outerBottom) {
  const labels = side < 0 ? ['ENERGY', 'SNOW'] : ['LANDING', 'STYLE'];
  for (let i = 0; i < 2; i += 1) {
    const t0 = 0.12 + i * 0.38;
    const x = innerBottom.x + (outerBottom.x - innerBottom.x) * t0;
    const y = innerBottom.y + (outerBottom.y - innerBottom.y) * t0 + 10;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(side * -0.045);
    ctx.fillStyle = 'rgba(8,17,30,0.78)';
    ctx.beginPath();
    ctx.roundRect(side < 0 ? -76 : 0, -12, 76, 24, 4);
    ctx.fill();
    ctx.fillStyle = i === 0 ? '#f8fbff' : '#3ee68f';
    ctx.font = '900 9px Pretendard';
    ctx.textAlign = side < 0 ? 'right' : 'left';
    ctx.fillText(labels[i], side < 0 ? -8 : 8, 3);
    ctx.restore();
  }
}

function pipePath(pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (const p of pts) ctx.lineTo(p.x, p.y);
  ctx.lineTo(toScreen(LIP_X + 6, -1.7).x, toScreen(LIP_X + 6, -1.7).y);
  ctx.lineTo(toScreen(-LIP_X - 6, -1.7).x, toScreen(-LIP_X - 6, -1.7).y);
  ctx.closePath();
}

function drawHeightTicks() {
  ctx.font = '700 11px Pretendard';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let h = 2; h <= 8; h += 2) {
    const normalized = Math.min(0.98, h / PIPE_HEIGHT);
    const root = 1 - normalized * PIPE_DENOM;
    const x = PIPE_HALF * Math.sqrt(Math.max(0, 1 - root * root));
    for (const side of [-1, 1]) {
      const p = toScreen(side * x, h);
      ctx.fillStyle = 'rgba(5, 20, 34, 0.54)';
      ctx.fillText(`${h}m`, p.x + side * 18, p.y);
      ctx.strokeStyle = 'rgba(5, 20, 34, 0.18)';
      ctx.beginPath();
      ctx.moveTo(p.x - side * 7, p.y);
      ctx.lineTo(p.x + side * 7, p.y);
      ctx.stroke();
    }
  }
}

function drawBlueDyeLines() {
  ctx.save();
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    ctx.strokeStyle = side < 0 ? 'rgba(255,179,71,0.84)' : 'rgba(48,213,255,0.84)';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    for (let i = 0; i <= 22; i += 1) {
      const x = side * (LIP_X - i * 0.42);
      const y = pipeHeight(x) - 0.08;
      const p = toScreen(x, y);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(21,73,118,0.32)';
  ctx.lineWidth = 2;
  for (let y = -0.55; y <= 0.65; y += 0.3) {
    const left = toScreen(-4.4, y);
    const right = toScreen(4.4, y);
    ctx.beginPath();
    ctx.moveTo(left.x, left.y);
    ctx.lineTo(right.x, right.y);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(8,17,30,0.56)';
  ctx.font = '900 12px Pretendard';
  ctx.textAlign = 'center';
  const mark = toScreen(0, -0.95);
  ctx.fillText('HALFPIPE', mark.x, mark.y);
  ctx.restore();
}

function drawTrail() {
  if (state.trail.length < 2) return;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let i = 1; i < state.trail.length; i += 1) {
    const a = state.trail[i - 1];
    const b = state.trail[i];
    const pa = toScreen(a.x, a.y + 0.08);
    const pb = toScreen(b.x, b.y + 0.08);
    ctx.strokeStyle = `rgba(48,213,255,${Math.max(0, b.life) * 0.42})`;
    ctx.beginPath();
    ctx.moveTo(pa.x, pa.y);
    ctx.lineTo(pb.x, pb.y);
    ctx.stroke();
  }
}

function drawParticles() {
  for (const p of state.particles) {
    const s = toScreen(p.x, p.y);
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawRiderShadow() {
  const x = state.phase === 'pipe' ? state.x : state.px;
  const surfaceY = pipeHeight(Math.max(-LIP_X, Math.min(LIP_X, x)));
  const riderY = state.phase === 'pipe' ? surfaceY : state.py;
  const heightAbove = Math.max(0, riderY - surfaceY);
  const p = toScreen(Math.max(-LIP_X, Math.min(LIP_X, x)), surfaceY - 0.08);
  const alpha = Math.max(0.08, 0.28 - heightAbove * 0.035);
  const size = Math.max(10, view.scale * (1.08 + Math.min(1.8, heightAbove * 0.08)));
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(-Math.atan(pipeSlope(Math.max(-LIP_X, Math.min(LIP_X, x)))));
  ctx.fillStyle = `rgba(13, 32, 48, ${alpha})`;
  ctx.beginPath();
  ctx.ellipse(0, 4, size, size * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawRider() {
  const x = state.phase === 'pipe' ? state.x : state.px;
  const y = state.phase === 'pipe' ? pipeHeight(state.x) : state.py;
  const p = toScreen(x, y + 0.18);
  const angle = state.phase === 'pipe' ? Math.atan(pipeSlope(state.x)) : state.boardAngle;
  const lean = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const boardLen = Math.max(34, view.scale * 1.35);

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(-angle);

  ctx.shadowColor = 'rgba(0,0,0,0.28)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 5;

  ctx.strokeStyle = '#17243a';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-boardLen / 2, 0);
  ctx.lineTo(boardLen / 2, 0);
  ctx.stroke();

  ctx.strokeStyle = '#30d5ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-boardLen / 2 + 4, -2);
  ctx.lineTo(boardLen / 2 - 4, -2);
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.translate(0, -8);
  ctx.rotate(lean * 0.18);

  ctx.strokeStyle = '#101827';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-4, 0);
  ctx.lineTo(-10, 12);
  ctx.moveTo(5, 0);
  ctx.lineTo(11, 12);
  ctx.stroke();

  ctx.fillStyle = '#ff5fa2';
  ctx.beginPath();
  ctx.roundRect(-8, -18, 16, 20, 6);
  ctx.fill();

  ctx.strokeStyle = '#f7fbff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-6, -13);
  ctx.lineTo(-17, -6 - lean * 4);
  ctx.moveTo(6, -13);
  ctx.lineTo(17, -6 + lean * 4);
  ctx.stroke();

  ctx.fillStyle = '#ffd6a5';
  ctx.beginPath();
  ctx.arc(0, -25, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#15233a';
  ctx.beginPath();
  ctx.roundRect(-7, -33, 14, 7, 4);
  ctx.fill();

  ctx.restore();
}

function drawEnergyLabels() {
  if (state.mode === 'finished') return;
  const h = currentHeight();
  const speed = currentSpeed();
  const p = toScreen(state.phase === 'pipe' ? state.x : state.px, h + 1.2);

  ctx.font = '800 12px Pretendard';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(8,17,30,0.72)';
  ctx.beginPath();
  ctx.roundRect(p.x - 72, p.y - 16, 144, 32, 8);
  ctx.fill();
  ctx.fillStyle = speed > 12 ? '#30d5ff' : '#ffb347';
  ctx.fillText(speed > 12 ? 'Ek 증가' : 'Ep 증가', p.x, p.y - 4);
  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  ctx.font = '700 10px Pretendard';
  ctx.fillText(`${h.toFixed(1)} m / ${speed.toFixed(1)} m/s`, p.x, p.y + 9);

  if (state.phase === 'air') {
    ctx.fillStyle = 'rgba(62,230,143,0.92)';
    ctx.font = '900 10px Pretendard';
    ctx.fillText('SLOW', p.x, p.y - 26);
  }
}
