'use strict';

function initThree() {
  if (T3.ready || !window.THREE) return;
  const three = window.THREE;
  try {

  T3.scene = new three.Scene();
  T3.scene.background = new three.Color(0x07111f);
  T3.scene.fog = new three.Fog(0x07111f, 36, 86);

  T3.camera = new three.PerspectiveCamera(46, Math.max(1, view.w) / Math.max(1, view.h), 0.1, 180);
  T3.camera.position.set(0, 14.5, 50);
  T3.camera.lookAt(0, 3.3, 0);

  T3.renderer = new three.WebGLRenderer({ antialias: false, alpha: false });
  T3.renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
  T3.renderer.setSize(view.w, view.h);
  T3.renderer.shadowMap.enabled = true;
  T3.renderer.shadowMap.type = three.PCFSoftShadowMap;
  T3.renderer.outputColorSpace = three.SRGBColorSpace;
  T3.renderer.domElement.className = 'three-stage';
  document.body.insertBefore(T3.renderer.domElement, canvas);
  canvas.classList.add('three-fallback-hidden');

  const hemi = new three.HemisphereLight(0xcceaff, 0x16283a, 1.9);
  T3.scene.add(hemi);

  const key = new three.DirectionalLight(0xffffff, 1.25);
  key.position.set(-16, 22, 18);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -35;
  key.shadow.camera.right = 35;
  key.shadow.camera.top = 28;
  key.shadow.camera.bottom = -12;
  T3.scene.add(key);

  addThreeSpotlight(-24, 15, -12, 0.95);
  addThreeSpotlight(24, 15, -12, 0.95);
  addThreeSpotlight(-20, 14, 16, 0.72);
  addThreeSpotlight(20, 14, 16, 0.72);

  createThreeSky();
  createThreeVenue();
  createThreePipe();
  createThreeRider();
  createThreeLandingGuide();
  createThreeTrail();
  createThreeSnow();

  T3.ready = true;
  resizeThree();
  } catch (err) {
    console.warn('Three.js renderer failed, falling back to 2D canvas.', err);
    if (T3.renderer && T3.renderer.domElement && T3.renderer.domElement.parentNode) {
      T3.renderer.domElement.parentNode.removeChild(T3.renderer.domElement);
    }
    canvas.classList.remove('three-fallback-hidden');
    T3.ready = false;
  }
}

function resizeThree() {
  if (!T3.renderer || !T3.camera) return;
  T3.camera.aspect = Math.max(1, view.w) / Math.max(1, view.h);
  T3.camera.updateProjectionMatrix();
  T3.renderer.setSize(view.w, view.h);
  T3.renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
}

function addThreeSpotlight(x, y, z, intensity) {
  const three = window.THREE;
  const light = new three.SpotLight(0xfff1c2, intensity, 90, Math.PI / 6.5, 0.55, 1.4);
  light.position.set(x, y, z);
  light.target.position.set(0, 2.4, 0);
  light.castShadow = false;
  T3.scene.add(light);
  T3.scene.add(light.target);

  const mast = new three.Mesh(
    new three.CylinderGeometry(0.08, 0.11, y + 3.5, 10),
    new three.MeshStandardMaterial({ color: 0x53687a, roughness: 0.7, metalness: 0.25 })
  );
  mast.position.set(x, (y - 3.5) / 2, z);
  mast.castShadow = true;
  T3.scene.add(mast);

  const lamp = new three.Mesh(
    new three.BoxGeometry(1.8, 0.48, 0.48),
    new three.MeshStandardMaterial({ color: 0xfff1b0, emissive: 0xffd27a, emissiveIntensity: 0.85 })
  );
  lamp.position.set(x, y, z);
  lamp.lookAt(0, 2.5, 0);
  T3.scene.add(lamp);
}

function createThreeSky() {
  const three = window.THREE;
  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 1024;
  skyCanvas.height = 512;
  const sctx = skyCanvas.getContext('2d');
  const sky = sctx.createLinearGradient(0, 0, 0, skyCanvas.height);
  sky.addColorStop(0, '#06101e');
  sky.addColorStop(0.58, '#19324d');
  sky.addColorStop(1, '#314b5f');
  sctx.fillStyle = sky;
  sctx.fillRect(0, 0, skyCanvas.width, skyCanvas.height);

  for (let i = 0; i < 180; i += 1) {
    const x = fract(Math.sin(i * 91.7) * 9000) * skyCanvas.width;
    const y = fract(Math.sin(i * 27.1) * 7000) * skyCanvas.height * 0.7;
    sctx.fillStyle = `rgba(255,255,255,${0.25 + fract(Math.sin(i * 11.3) * 3000) * 0.55})`;
    sctx.beginPath();
    sctx.arc(x, y, 0.7 + fract(Math.sin(i * 5.7) * 5000) * 1.2, 0, Math.PI * 2);
    sctx.fill();
  }

  drawAuroraOnCanvas(sctx, skyCanvas.width, skyCanvas.height);
  const tex = new three.CanvasTexture(skyCanvas);
  tex.colorSpace = three.SRGBColorSpace;
  const skyMesh = new three.Mesh(
    new three.SphereGeometry(92, 48, 24),
    new three.MeshBasicMaterial({ map: tex, side: three.BackSide })
  );
  skyMesh.position.set(0, 6, 0);
  T3.scene.add(skyMesh);
}

function drawAuroraOnCanvas(sctx, w, h) {
  const ribbons = [
    { y: 0.18, color: 'rgba(74,255,174,0.16)', phase: 0 },
    { y: 0.25, color: 'rgba(92,210,255,0.12)', phase: 1.9 }
  ];
  sctx.save();
  sctx.globalCompositeOperation = 'lighter';
  for (const r of ribbons) {
    const grad = sctx.createLinearGradient(0, h * (r.y - 0.05), w, h * (r.y + 0.12));
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.45, r.color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    sctx.fillStyle = grad;
    sctx.beginPath();
    for (let i = 0; i <= 24; i += 1) {
      const t = i / 24;
      const x = t * w;
      const y = h * r.y + Math.sin(t * Math.PI * 2.2 + r.phase) * 24 + Math.sin(t * Math.PI * 7) * 8;
      if (i === 0) sctx.moveTo(x, y - 22);
      else sctx.lineTo(x, y - 22);
    }
    for (let i = 24; i >= 0; i -= 1) {
      const t = i / 24;
      const x = t * w;
      const y = h * r.y + Math.sin(t * Math.PI * 2.2 + r.phase) * 24 + Math.sin(t * Math.PI * 7) * 8;
      sctx.lineTo(x, y + 28);
    }
    sctx.closePath();
    sctx.filter = 'blur(9px)';
    sctx.fill();
    sctx.filter = 'none';
  }
  sctx.restore();
}

function createThreeVenue() {
  const three = window.THREE;
  const snowMat = new three.MeshStandardMaterial({ color: 0xe9f6ff, roughness: 0.9, metalness: 0.02 });
  const ground = new three.Mesh(new three.PlaneGeometry(92, 118, 1, 1), snowMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -1.08, 0);
  ground.receiveShadow = true;
  T3.scene.add(ground);

  createMountainWall(-48, 0x17304a, 0.85);
  createMountainWall(-56, 0x0f2238, 1.2);
  createThreeGrandstand(-1);
  createThreeGrandstand(1);
  createThreeScoreboard();
}

function createMountainWall(z, color, scaleY) {
  const three = window.THREE;
  const shape = new three.Shape();
  shape.moveTo(-55, -2);
  for (let i = 0; i <= 14; i += 1) {
    const x = -55 + (110 * i) / 14;
    const y = 7 + Math.sin(i * 1.7) * 2.2 * scaleY + Math.sin(i * 0.67) * 3.2 * scaleY;
    shape.lineTo(x, y);
  }
  shape.lineTo(55, -2);
  shape.lineTo(-55, -2);
  const geom = new three.ShapeGeometry(shape);
  const mesh = new three.Mesh(
    geom,
    new three.MeshBasicMaterial({ color, transparent: true, opacity: 0.92, side: three.DoubleSide })
  );
  mesh.position.set(0, 0, z);
  T3.scene.add(mesh);
}

function createThreeGrandstand(side) {
  const three = window.THREE;
  const stand = new three.Group();
  const baseX = side * 24.5;
  const mat = new three.MeshStandardMaterial({ color: 0x13283b, roughness: 0.82, metalness: 0.08 });
  for (let i = 0; i < 7; i += 1) {
  const row = new three.Mesh(new three.BoxGeometry(8.4, 0.44, THREE_PIPE_LENGTH + 16), mat);
    row.position.set(baseX + side * i * 0.72, 2.3 + i * 0.58, -1);
    row.rotation.z = -side * 0.08;
    row.castShadow = true;
    row.receiveShadow = true;
    stand.add(row);
  }

  const crowdMats = [
    new three.MeshStandardMaterial({ color: 0xf8fbff, roughness: 0.8 }),
    new three.MeshStandardMaterial({ color: 0x30d5ff, roughness: 0.7 }),
    new three.MeshStandardMaterial({ color: 0xffb347, roughness: 0.7 }),
    new three.MeshStandardMaterial({ color: 0xff5fa2, roughness: 0.7 }),
    new three.MeshStandardMaterial({ color: 0x3ee68f, roughness: 0.7 })
  ];
  const dotGeo = new three.SphereGeometry(0.11, 8, 6);
  for (let i = 0; i < 130; i += 1) {
    const row = Math.floor(fract(Math.sin(i * 7.13 + side) * 9000) * 7);
    const z = -THREE_PIPE_LENGTH / 2 - 4 + fract(Math.sin(i * 23.7) * 8000) * (THREE_PIPE_LENGTH + 8);
    const dot = new three.Mesh(dotGeo, crowdMats[i % crowdMats.length]);
    dot.position.set(baseX + side * (row * 0.7 + 0.1), 2.85 + row * 0.58, z);
    dot.castShadow = false;
    stand.add(dot);
  }

  createSponsorBoards(stand, side);
  T3.scene.add(stand);
}

function createSponsorBoards(group, side) {
  const three = window.THREE;
  const labels = side < 0 ? ['FIS', 'PARK & PIPE', 'MULIGO'] : ['WORLD CUP', 'ENERGY', 'LAND CLEAN'];
  for (let i = 0; i < labels.length; i += 1) {
    const tex = createTextTexture(labels[i], i % 2 === 0 ? '#08111e' : '#f8fbff', i % 2 === 0 ? '#f8fbff' : '#08111e');
    const mat = new three.MeshBasicMaterial({ map: tex });
    const board = new three.Mesh(new three.PlaneGeometry(3.9, 1.1), mat);
    board.position.set(side * 19.5, 1.4, -THREE_PIPE_LENGTH / 2 + 12 + i * (THREE_PIPE_LENGTH - 24) / 2);
    board.rotation.y = -side * Math.PI / 2.35;
    group.add(board);
  }
}

function createThreeScoreboard() {
  const three = window.THREE;
  T3.scoreboardCanvas = document.createElement('canvas');
  T3.scoreboardCanvas.width = 512;
  T3.scoreboardCanvas.height = 256;
  T3.scoreboardCtx = T3.scoreboardCanvas.getContext('2d');
  T3.scoreboardTexture = new three.CanvasTexture(T3.scoreboardCanvas);
  T3.scoreboardTexture.colorSpace = three.SRGBColorSpace;
  const panel = new three.Mesh(
    new three.PlaneGeometry(8.8, 4.2),
    new three.MeshBasicMaterial({ map: T3.scoreboardTexture })
  );
  panel.position.set(0, 8.2, -22.5);
  T3.scoreboardMesh = panel;
  T3.scene.add(panel);

  const frame = new three.Mesh(
    new three.BoxGeometry(9.3, 4.6, 0.25),
    new three.MeshStandardMaterial({ color: 0x07111f, roughness: 0.45, metalness: 0.3 })
  );
  frame.position.set(0, 8.2, -22.65);
  T3.scene.add(frame);
}

function createTextTexture(text, bg, fg) {
  const three = window.THREE;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 96;
  const cctx = c.getContext('2d');
  cctx.fillStyle = bg;
  cctx.fillRect(0, 0, c.width, c.height);
  cctx.strokeStyle = '#30d5ff';
  cctx.lineWidth = 5;
  cctx.strokeRect(4, 4, c.width - 8, c.height - 8);
  cctx.fillStyle = fg;
  cctx.font = '900 28px Pretendard, Arial';
  cctx.textAlign = 'center';
  cctx.textBaseline = 'middle';
  cctx.fillText(text, c.width / 2, c.height / 2);
  const tex = new three.CanvasTexture(c);
  tex.colorSpace = three.SRGBColorSpace;
  return tex;
}

function updateThreeScoreboard() {
  if (!T3.scoreboardCtx || !T3.scoreboardTexture) return;
  const text = `${state.landings}/${TARGET_LANDINGS}|${Math.min(1000, Math.round(state.score / 15))}|${Math.ceil(state.timeLeft)}`;
  if (text === T3.lastScoreboardText) return;
  T3.lastScoreboardText = text;
  const c = T3.scoreboardCanvas;
  const cctx = T3.scoreboardCtx;
  cctx.clearRect(0, 0, c.width, c.height);
  const grad = cctx.createLinearGradient(0, 0, 0, c.height);
  grad.addColorStop(0, '#112f47');
  grad.addColorStop(1, '#06111e');
  cctx.fillStyle = grad;
  cctx.fillRect(0, 0, c.width, c.height);
  cctx.strokeStyle = '#30d5ff';
  cctx.lineWidth = 8;
  cctx.strokeRect(8, 8, c.width - 16, c.height - 16);
  cctx.fillStyle = '#3ee68f';
  cctx.font = '900 26px Pretendard, Arial';
  cctx.textAlign = 'center';
  cctx.fillText('HALFPIPE FINALS', c.width / 2, 56);
  cctx.fillStyle = '#f8fbff';
  cctx.font = '900 46px Pretendard, Arial';
  cctx.fillText(`${state.landings}/${TARGET_LANDINGS} LANDINGS`, c.width / 2, 126);
  cctx.fillStyle = '#ffb347';
  cctx.font = '800 24px Pretendard, Arial';
  cctx.fillText(`STYLE ${Math.min(1000, Math.round(state.score / 15)).toLocaleString('ko-KR')}   TIME ${state.timeLeft.toFixed(0)}`, c.width / 2, 184);
  T3.scoreboardTexture.needsUpdate = true;
}

function createThreePipe() {
  const three = window.THREE;
  const xSeg = 72;
  const zSeg = 30;
  const vertices = [];
  const indices = [];
  for (let zi = 0; zi <= zSeg; zi += 1) {
    const z = -THREE_PIPE_LENGTH / 2 + (THREE_PIPE_LENGTH * zi) / zSeg;
    for (let xi = 0; xi <= xSeg; xi += 1) {
      const x = -LIP_X + (LIP_X * 2 * xi) / xSeg;
      const y = pipeHeight(x);
      vertices.push(x, y, z);
    }
  }
  for (let zi = 0; zi < zSeg; zi += 1) {
    for (let xi = 0; xi < xSeg; xi += 1) {
      const a = zi * (xSeg + 1) + xi;
      const b = a + 1;
      const c = a + xSeg + 1;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geom = new three.BufferGeometry();
  geom.setAttribute('position', new three.Float32BufferAttribute(vertices, 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  const mat = new three.MeshStandardMaterial({
    color: 0xeaf7ff,
    roughness: 0.86,
    metalness: 0.02
  });
  T3.pipe = new three.Mesh(geom, mat);
  T3.pipe.receiveShadow = true;
  T3.pipe.castShadow = false;
  T3.scene.add(T3.pipe);

  const blue = new three.MeshStandardMaterial({ color: 0x1ea7ff, roughness: 0.5, emissive: 0x083d69, emissiveIntensity: 0.25 });
  const orange = new three.MeshStandardMaterial({ color: 0xffb347, roughness: 0.55, emissive: 0x4b2400, emissiveIntensity: 0.16 });
  for (const side of [-1, 1]) {
    const lip = new three.Mesh(new three.BoxGeometry(0.22, 0.08, THREE_PIPE_LENGTH), side > 0 ? blue : orange);
    lip.position.set(side * LIP_X, PIPE_HEIGHT + 0.08, 0);
    lip.castShadow = true;
    T3.scene.add(lip);

    const deck = new three.Mesh(
      new three.BoxGeometry(8.5, 0.42, THREE_PIPE_LENGTH),
      new three.MeshStandardMaterial({ color: 0xdcecf7, roughness: 0.9 })
    );
    deck.position.set(side * (LIP_X + 4.3), PIPE_HEIGHT + 0.08, 0);
    deck.receiveShadow = true;
    deck.castShadow = true;
    T3.scene.add(deck);

    for (let z = -THREE_PIPE_LENGTH / 2; z <= THREE_PIPE_LENGTH / 2; z += 4) {
      const post = new three.Mesh(
        new three.BoxGeometry(0.08, 1.7, 0.08),
        new three.MeshStandardMaterial({ color: 0xcde5f4, roughness: 0.55, metalness: 0.15 })
      );
      post.position.set(side * (LIP_X + 7.7), PIPE_HEIGHT + 1.0, z);
      T3.scene.add(post);
    }
    const rail = new three.Mesh(
      new three.BoxGeometry(0.1, 0.1, THREE_PIPE_LENGTH),
      new three.MeshStandardMaterial({ color: 0xcde5f4, roughness: 0.55, metalness: 0.15 })
    );
    rail.position.set(side * (LIP_X + 7.7), PIPE_HEIGHT + 1.85, 0);
    T3.scene.add(rail);
  }

  for (let z = -THREE_PIPE_LENGTH / 2 + 2; z <= THREE_PIPE_LENGTH / 2; z += 4) {
    const dye = new three.Mesh(
      new three.BoxGeometry(8, 0.018, 0.06),
      new three.MeshBasicMaterial({ color: 0x2d80bf, transparent: true, opacity: 0.32 })
    );
    dye.position.set(0, 0.025, z);
    T3.scene.add(dye);
  }
}

function createThreeRider() {
  const three = window.THREE;
  if (window.createSnowboarderModel) {
    const model = window.createSnowboarderModel(three);
    T3.rider = model.root;
    T3.riderSpin = model.spinGroup;
    T3.board = model.board;
    T3.riderParts = model.leanParts || [];
    T3.riderPose = model.applyPose || null;
    T3.scene.add(model.root);
    return;
  }

  const root = new three.Group();
  const spinGroup = new three.Group();
  root.add(spinGroup);
  T3.riderParts = [];
  T3.riderPose = null;
  const boardMat = new three.MeshStandardMaterial({ color: 0x111b2b, roughness: 0.42, metalness: 0.28 });
  const edgeMat = new three.MeshStandardMaterial({ color: 0x30d5ff, emissive: 0x0b4a66, emissiveIntensity: 0.35 });
  const suitMat = new three.MeshStandardMaterial({ color: 0xff5fa2, roughness: 0.65 });
  const darkMat = new three.MeshStandardMaterial({ color: 0x101827, roughness: 0.58 });
  const skinMat = new three.MeshStandardMaterial({ color: 0xffd6a5, roughness: 0.75 });
  const lensMat = new three.MeshStandardMaterial({ color: 0x8be9ff, roughness: 0.18, metalness: 0.1, emissive: 0x0c5f7a, emissiveIntensity: 0.25 });
  const bootMat = new three.MeshStandardMaterial({ color: 0x0b111d, roughness: 0.48, metalness: 0.12 });

  const board = new three.Mesh(new three.BoxGeometry(2.15, 0.08, 0.38), boardMat);
  board.castShadow = true;
  spinGroup.add(board);
  const nose = new three.Mesh(new three.SphereGeometry(0.2, 16, 8), boardMat);
  nose.scale.set(1.7, 0.18, 0.9);
  nose.position.x = 1.02;
  spinGroup.add(nose);
  const tail = nose.clone();
  tail.position.x = -1.02;
  spinGroup.add(tail);
  const edge = new three.Mesh(new three.BoxGeometry(1.8, 0.035, 0.42), edgeMat);
  edge.position.y = 0.065;
  spinGroup.add(edge);
  T3.board = board;

  const hip = new three.Mesh(new three.BoxGeometry(0.48, 0.22, 0.32), suitMat);
  hip.position.set(0, 0.42, 0);
  hip.rotation.z = -0.08;
  hip.castShadow = true;
  spinGroup.add(hip);
  T3.riderParts.push(hip);

  const body = new three.Mesh(new three.CapsuleGeometry(0.23, 0.72, 10, 18), suitMat);
  body.position.set(0.03, 0.83, 0);
  body.rotation.z = 0.18;
  body.castShadow = true;
  spinGroup.add(body);
  T3.riderParts.push(body);

  const neck = new three.Mesh(new three.CylinderGeometry(0.07, 0.08, 0.12, 12), skinMat);
  neck.position.set(0.05, 1.24, 0);
  spinGroup.add(neck);
  const head = new three.Mesh(new three.SphereGeometry(0.2, 20, 14), skinMat);
  head.position.set(0.06, 1.43, 0);
  head.castShadow = true;
  spinGroup.add(head);
  const helmet = new three.Mesh(new three.SphereGeometry(0.22, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), darkMat);
  helmet.position.set(0.06, 1.51, 0);
  helmet.castShadow = true;
  spinGroup.add(helmet);
  const goggles = new three.Mesh(new three.BoxGeometry(0.26, 0.07, 0.24), lensMat);
  goggles.position.set(0.13, 1.43, 0);
  goggles.rotation.y = Math.PI / 2;
  spinGroup.add(goggles);

  for (const side of [-1, 1]) {
    const shoulder = new three.Mesh(new three.SphereGeometry(0.075, 10, 8), suitMat);
    shoulder.position.set(side * 0.25, 1.05, 0);
    spinGroup.add(shoulder);
    const upperArm = new three.Mesh(new three.CapsuleGeometry(0.055, 0.42, 6, 8), darkMat);
    upperArm.position.set(side * 0.43, 0.86, 0);
    upperArm.rotation.z = side * 0.74;
    upperArm.castShadow = true;
    spinGroup.add(upperArm);
    const foreArm = new three.Mesh(new three.CapsuleGeometry(0.05, 0.35, 6, 8), darkMat);
    foreArm.position.set(side * 0.62, 0.68, 0);
    foreArm.rotation.z = side * 1.0;
    foreArm.castShadow = true;
    spinGroup.add(foreArm);

    const thigh = new three.Mesh(new three.CapsuleGeometry(0.075, 0.4, 6, 8), darkMat);
    thigh.position.set(side * 0.2, 0.27, 0);
    thigh.rotation.z = side * 0.24;
    thigh.castShadow = true;
    spinGroup.add(thigh);
    const shin = new three.Mesh(new three.CapsuleGeometry(0.065, 0.36, 6, 8), darkMat);
    shin.position.set(side * 0.34, 0.13, 0);
    shin.rotation.z = side * 0.52;
    shin.castShadow = true;
    spinGroup.add(shin);
    const boot = new three.Mesh(new three.BoxGeometry(0.38, 0.1, 0.18), bootMat);
    boot.position.set(side * 0.43, 0.09, 0);
    boot.rotation.z = side * 0.12;
    boot.castShadow = true;
    spinGroup.add(boot);
  }
  root.scale.setScalar(1.12);
  T3.rider = root;
  T3.riderSpin = spinGroup;
  T3.scene.add(root);
}

function createThreeTrail() {
  const three = window.THREE;
  T3.trailPositions = new Float32Array(90 * 3);
  const geom = new three.BufferGeometry();
  geom.setAttribute('position', new three.BufferAttribute(T3.trailPositions, 3));
  T3.trail = new three.Line(
    geom,
    new three.LineBasicMaterial({ color: 0x78d9ff, transparent: true, opacity: 0.65 })
  );
  T3.scene.add(T3.trail);
}

function createThreeLandingGuide() {
  const three = window.THREE;
  const group = new three.Group();
  const slopeMat = new three.MeshBasicMaterial({ color: 0x3ee68f, transparent: true, opacity: 0.86 });
  const boardMat = new three.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0.88 });
  const postMat = new three.MeshBasicMaterial({ color: 0xf8fbff, transparent: true, opacity: 0.48 });

  T3.slopeGuide = new three.Mesh(new three.BoxGeometry(3.2, 0.055, 0.08), slopeMat);
  T3.boardGuide = new three.Mesh(new three.BoxGeometry(2.5, 0.055, 0.1), boardMat);
  const post = new three.Mesh(new three.BoxGeometry(0.06, 1.1, 0.06), postMat);
  post.position.y = 0.52;
  group.add(T3.slopeGuide);
  group.add(T3.boardGuide);
  group.add(post);
  group.visible = false;
  T3.landingGuide = group;
  T3.scene.add(group);
}

function createThreeSnow() {
  const three = window.THREE;
  const count = 420;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    pos[i * 3] = -38 + fract(Math.sin(i * 31.7) * 9000) * 76;
    pos[i * 3 + 1] = 2 + fract(Math.sin(i * 72.1) * 8000) * 22;
    pos[i * 3 + 2] = -48 + fract(Math.sin(i * 18.2) * 7000) * 96;
  }
  const geom = new three.BufferGeometry();
  geom.setAttribute('position', new three.BufferAttribute(pos, 3));
  const mat = new three.PointsMaterial({ color: 0xffffff, size: 0.09, transparent: true, opacity: 0.72 });
  T3.snow = new three.Points(geom, mat);
  T3.scene.add(T3.snow);
}

let _snowFrame = 0;

function drawThree() {
  if (!T3.ready) return;
  const three = window.THREE;
  const x = state.phase === 'pipe' ? state.x : state.px;
  const y = state.phase === 'pipe' ? pipeHeight(state.x) : state.py;
  const angle = state.phase === 'pipe' ? Math.atan(pipeSlope(state.x)) : state.boardAngle;
  const lean = (input.right ? 1 : 0) - (input.left ? 1 : 0);

  T3.rider.position.set(x, y + 0.34, 0);
  T3.rider.rotation.set(0, 0, angle);
  if (T3.riderSpin) {
    T3.riderSpin.rotation.set(lean * 0.08, 0, 0);
  }
  if (T3.riderPose) {
    T3.riderPose({ airborne: state.phase === 'air', lean });
  } else {
    for (const part of T3.riderParts) {
      part.rotation.x = lean * 0.08;
    }
  }

  if (state.trail.length > 0) updateThreeTrail();
  updateThreeLandingGuide(x, angle);
  updateThreeScoreboard();
  if ((_snowFrame++ & 1) === 0) updateThreeSnow();

  const targetX = x * 0.15;
  T3.camera.position.x += (targetX - T3.camera.position.x) * 0.045;
  T3.camera.lookAt(x * 0.18, 3.4, 0);
  T3.renderer.render(T3.scene, T3.camera);
}

function updateThreeTrail() {
  if (!T3.trail || !T3.trailPositions) return;
  const max = 90;
  for (let i = 0; i < max; i += 1) {
    const src = state.trail[state.trail.length - max + i];
    const offset = i * 3;
    if (src) {
      T3.trailPositions[offset] = src.x;
      T3.trailPositions[offset + 1] = src.y + 0.16;
      T3.trailPositions[offset + 2] = 0;
    } else {
      T3.trailPositions[offset] = state.px || state.x;
      T3.trailPositions[offset + 1] = currentHeight();
      T3.trailPositions[offset + 2] = 0;
    }
  }
  T3.trail.geometry.attributes.position.needsUpdate = true;
}

function updateThreeLandingGuide(x, boardAngle) {
  if (!T3.landingGuide || !T3.slopeGuide || !T3.boardGuide) return;
  if (state.phase !== 'air') {
    T3.landingGuide.visible = false;
    return;
  }
  const landingX = Math.max(-LIP_X, Math.min(LIP_X, state.px));
  const surface = pipeHeight(landingX);
  const slopeAngle = Math.atan(pipeSlope(landingX));
  const angleError = Math.abs(smallestAngle(boardAngle, slopeAngle));
  const good = angleError < 0.42;
  const ok = angleError < 0.78;

  T3.landingGuide.visible = true;
  T3.landingGuide.position.set(landingX, surface + 0.24, 0.72);
  T3.slopeGuide.rotation.set(0, 0, slopeAngle);
  T3.boardGuide.position.y = 0.32;
  T3.boardGuide.rotation.set(0, 0, boardAngle);

  T3.slopeGuide.material.color.set(good ? 0x3ee68f : ok ? 0xffd166 : 0xff4d5e);
  T3.boardGuide.material.color.set(0xffb347);
  T3.slopeGuide.material.opacity = good ? 0.96 : 0.78;
  T3.boardGuide.material.opacity = 0.9;
}

function updateThreeSnow() {
  if (!T3.snow) return;
  const attr = T3.snow.geometry.attributes.position;
  const arr = attr.array;
  for (let i = 0; i < arr.length; i += 3) {
    arr[i + 1] -= 0.018;
    arr[i] += 0.006;
    if (arr[i + 1] < 0) arr[i + 1] = 24;
    if (arr[i] > 38) arr[i] = -38;
  }
  attr.needsUpdate = true;
}
