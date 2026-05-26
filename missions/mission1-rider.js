(function () {
  'use strict';

  function mat(THREE, color, opts) {
    return new THREE.MeshStandardMaterial(Object.assign({
      color,
      roughness: 0.62,
      metalness: 0.08
    }, opts || {}));
  }

  function cast(mesh) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  function capsule(THREE, radius, length, material, position, rotation) {
    const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 10, 18), material);
    mesh.position.set(position[0], position[1], position[2]);
    mesh.rotation.set(rotation[0] || 0, rotation[1] || 0, rotation[2] || 0);
    return cast(mesh);
  }

  function box(THREE, size, material, position, rotation) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material);
    mesh.position.set(position[0], position[1], position[2]);
    mesh.rotation.set(rotation[0] || 0, rotation[1] || 0, rotation[2] || 0);
    return cast(mesh);
  }

  function sphere(THREE, radius, material, position, scale) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 24, 16), material);
    mesh.position.set(position[0], position[1], position[2]);
    if (scale) mesh.scale.set(scale[0], scale[1], scale[2]);
    return cast(mesh);
  }

  function transform(position, rotation) {
    return {
      p: position,
      r: rotation || [0, 0, 0]
    };
  }

  function mix(a, b, t) {
    return a + (b - a) * t;
  }

  function applyTransform(part, from, to, t) {
    part.position.set(
      mix(from.p[0], to.p[0], t),
      mix(from.p[1], to.p[1], t),
      mix(from.p[2], to.p[2], t)
    );
    part.rotation.set(
      mix(from.r[0], to.r[0], t),
      mix(from.r[1], to.r[1], t),
      mix(from.r[2], to.r[2], t)
    );
  }

  function makeBibTexture(THREE) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f8fbff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0b1626';
    ctx.font = '900 78px Pretendard, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('01', 128, 108);
    ctx.fillStyle = '#30d5ff';
    ctx.fillRect(30, 160, 196, 18);
    ctx.fillStyle = '#0b1626';
    ctx.font = '900 22px Pretendard, Arial';
    ctx.fillText('ENERGY', 128, 202);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  function createSnowboarderModel(THREE) {
    const root = new THREE.Group();
    const spinGroup = new THREE.Group();
    const upperBody = new THREE.Group();
    const lowerBody = new THREE.Group();
    const leanParts = [];
    const poseParts = [];
    let grabBlend = 0;
    root.add(spinGroup);
    spinGroup.add(lowerBody, upperBody);

    function track(part, ridePose, grabPose) {
      poseParts.push({ part, ridePose, grabPose });
      return part;
    }

    const boardMat = mat(THREE, 0x0c1422, { roughness: 0.38, metalness: 0.32 });
    const baseMat = mat(THREE, 0x1c2b40, { roughness: 0.45, metalness: 0.22 });
    const edgeMat = mat(THREE, 0x42dcff, { emissive: 0x0d5b7a, emissiveIntensity: 0.34, roughness: 0.3 });
    const jacketMat = mat(THREE, 0xff4f9a, { roughness: 0.72 });
    const pantsMat = mat(THREE, 0x18243a, { roughness: 0.66 });
    const pantsAccentMat = mat(THREE, 0x4a6f98, { roughness: 0.62 });
    const gloveMat = mat(THREE, 0x0b111d, { roughness: 0.5 });
    const bootMat = mat(THREE, 0x07101c, { roughness: 0.42, metalness: 0.16 });
    const skinMat = mat(THREE, 0xffd6a5, { roughness: 0.8 });
    const helmetMat = mat(THREE, 0x0c1422, { roughness: 0.34, metalness: 0.26 });
    const helmetTrimMat = mat(THREE, 0xf8fbff, { roughness: 0.48, metalness: 0.08 });
    const lensMat = mat(THREE, 0x74e7ff, { roughness: 0.08, metalness: 0.35, emissive: 0x0e6787, emissiveIntensity: 0.34 });
    const strapMat = mat(THREE, 0xf8fbff, { roughness: 0.55 });
    const bibMat = new THREE.MeshBasicMaterial({ map: makeBibTexture(THREE) });

    const boardGroup = new THREE.Group();
    const deck = box(THREE, [2.45, 0.08, 0.42], boardMat, [0, 0, 0], [0, 0, 0]);
    const top = box(THREE, [2.0, 0.035, 0.46], baseMat, [0, 0.066, 0], [0, 0, 0]);
    const toeEdge = box(THREE, [2.2, 0.028, 0.035], edgeMat, [0, 0.103, 0.245], [0, 0, 0]);
    const heelEdge = box(THREE, [2.2, 0.028, 0.035], edgeMat, [0, 0.103, -0.245], [0, 0, 0]);
    boardGroup.add(deck, top, toeEdge, heelEdge);

    for (const side of [-1, 1]) {
      const tip = sphere(THREE, 0.23, boardMat, [side * 1.18, 0.045, 0], [1.55, 0.22, 0.9]);
      tip.rotation.z = side * 0.08;
      boardGroup.add(tip);
    }

    for (const x of [-0.42, 0.42]) {
      const binding = box(THREE, [0.36, 0.055, 0.5], strapMat, [x, 0.145, 0], [0, 0, x < 0 ? 0.18 : -0.18]);
      const strap = box(THREE, [0.32, 0.06, 0.08], edgeMat, [x, 0.205, 0.03], [0, 0, x < 0 ? 0.18 : -0.18]);
      boardGroup.add(binding, strap);
    }
    spinGroup.add(boardGroup);

    track(upperBody, transform([0, 0, 0], [0, 0, 0]), transform([0.03, -0.08, 0], [0.03, 0, -0.18]));
    track(lowerBody, transform([0, 0, 0], [0, 0, 0]), transform([0, -0.01, 0], [0, 0, -0.03]));

    const pelvis = box(THREE, [0.5, 0.18, 0.34], pantsMat, [0, 0.5, 0], [0, 0, -0.04]);
    const hipStripe = box(THREE, [0.44, 0.04, 0.365], pantsAccentMat, [0.01, 0.53, 0], [0, 0, -0.04]);
    const legGap = box(THREE, [0.075, 0.46, 0.38], gloveMat, [0.01, 0.25, 0.012], [0, 0, 0]);
    const belt = box(THREE, [0.54, 0.065, 0.37], gloveMat, [0.02, 0.64, 0], [0, 0, -0.04]);
    const torso = capsule(THREE, 0.22, 0.48, jacketMat, [0.04, 0.96, 0], [0, 0, 0.16]);
    const chestPanel = box(THREE, [0.32, 0.34, 0.035], bibMat, [0.13, 0.99, 0.205], [0, 0, 0.16]);
    const collar = box(THREE, [0.32, 0.075, 0.35], strapMat, [0.07, 1.25, 0], [0, 0, 0.14]);
    lowerBody.add(pelvis, hipStripe, legGap, belt);
    upperBody.add(torso, chestPanel, collar);
    leanParts.push(lowerBody, upperBody);

    const neck = capsule(THREE, 0.058, 0.1, skinMat, [0.04, 1.28, 0], [0, 0, 0]);
    const headGroup = new THREE.Group();
    headGroup.position.set(0.07, 1.47, 0);
    track(headGroup, transform([0.07, 1.47, 0], [0, 0, 0]), transform([0.13, 1.4, 0], [0, 0.01, -0.08]));

    const face = sphere(THREE, 0.19, skinMat, [0.04, -0.02, 0], [0.82, 1.02, 0.9]);
    const helmetShell = sphere(THREE, 0.235, helmetMat, [0, 0.04, 0], [1.0, 1.02, 1.02]);
    const lowerHelmet = box(THREE, [0.18, 0.11, 0.44], helmetMat, [-0.08, -0.06, 0], [0, 0, 0]);
    const brim = box(THREE, [0.22, 0.045, 0.46], helmetMat, [0.16, 0.07, 0], [0, 0, -0.08]);
    const topStripe = box(THREE, [0.045, 0.035, 0.46], helmetTrimMat, [-0.01, 0.25, 0], [0, 0, 0]);
    const rearRim = box(THREE, [0.09, 0.08, 0.46], helmetTrimMat, [-0.19, -0.03, 0], [0, 0, 0]);
    headGroup.add(face, helmetShell, lowerHelmet, brim, topStripe, rearRim);

    for (const side of [-1, 1]) {
      const earPad = sphere(THREE, 0.085, helmetMat, [-0.04, -0.04, side * 0.19], [0.72, 1.05, 0.56]);
      const strapAnchor = box(THREE, [0.055, 0.16, 0.045], helmetTrimMat, [0.03, -0.07, side * 0.235], [0, 0, side * 0.18]);
      headGroup.add(earPad, strapAnchor);
    }

    const goggleGroup = new THREE.Group();
    goggleGroup.position.set(0.205, -0.01, 0);
    const lens = box(THREE, [0.055, 0.118, 0.37], lensMat, [0, 0, 0], [0, 0, 0]);
    const frameTop = box(THREE, [0.07, 0.035, 0.42], helmetMat, [0.002, 0.077, 0], [0, 0, 0]);
    const frameBottom = box(THREE, [0.07, 0.032, 0.4], helmetMat, [0.002, -0.077, 0], [0, 0, 0]);
    const frameLeft = box(THREE, [0.07, 0.13, 0.035], helmetMat, [0.002, 0, -0.215], [0, 0, 0]);
    const frameRight = box(THREE, [0.07, 0.13, 0.035], helmetMat, [0.002, 0, 0.215], [0, 0, 0]);
    const lensGlint = box(THREE, [0.058, 0.012, 0.14], helmetTrimMat, [0.032, 0.035, -0.07], [0, 0, 0]);
    const strapLeft = box(THREE, [0.045, 0.065, 0.22], helmetTrimMat, [-0.055, 0, -0.33], [0, 0.18, 0]);
    const strapRight = box(THREE, [0.045, 0.065, 0.22], helmetTrimMat, [-0.055, 0, 0.33], [0, -0.18, 0]);
    goggleGroup.add(lens, frameTop, frameBottom, frameLeft, frameRight, lensGlint, strapLeft, strapRight);
    headGroup.add(goggleGroup);

    const chinStrap = box(THREE, [0.035, 0.18, 0.035], helmetMat, [0.1, -0.22, -0.12], [0, 0, -0.22]);
    const chinStrap2 = box(THREE, [0.035, 0.18, 0.035], helmetMat, [0.1, -0.22, 0.12], [0, 0, -0.22]);
    headGroup.add(chinStrap, chinStrap2);
    upperBody.add(neck, headGroup);

    for (const side of [-1, 1]) {
      const shoulder = sphere(THREE, 0.085, jacketMat, [side * 0.27, 1.05, 0], [1, 1, 1]);
      const upperArm = capsule(THREE, 0.062, 0.43, jacketMat, [side * 0.48, 0.84, side * 0.02], [0.08, 0, side * 0.72]);
      const elbow = sphere(THREE, 0.068, pantsMat, [side * 0.61, 0.67, side * 0.02], [1, 1, 1]);
      const foreArm = capsule(THREE, 0.055, 0.36, pantsMat, [side * 0.73, 0.51, side * 0.02], [0.05, 0, side * 0.98]);
      const glove = sphere(THREE, 0.075, gloveMat, [side * 0.84, 0.36, side * 0.02], [1.05, 0.88, 0.9]);
      track(shoulder, transform([side * 0.27, 1.05, 0], [0, 0, 0]), transform([side * 0.27, 1.02, side * 0.005], [0, 0, side * 0.03]));
      track(upperArm, transform([side * 0.48, 0.84, side * 0.02], [0.08, 0, side * 0.72]), transform([side * 0.43, 0.78, side * 0.035], [0.16, side * 0.04, side * 0.98]));
      track(elbow, transform([side * 0.61, 0.67, side * 0.02], [0, 0, 0]), transform([side * 0.56, 0.6, side * 0.055], [0, 0, 0]));
      track(foreArm, transform([side * 0.73, 0.51, side * 0.02], [0.05, 0, side * 0.98]), transform([side * 0.63, 0.43, side * 0.08], [0.18, side * 0.06, side * 0.78]));
      track(glove, transform([side * 0.84, 0.36, side * 0.02], [0, 0, 0]), transform([side * 0.68, 0.32, side * 0.1], [0, 0, side * 0.12]));
      upperBody.add(shoulder, upperArm, elbow, foreArm, glove);

      const thigh = capsule(THREE, 0.095, 0.44, pantsMat, [side * 0.25, 0.31, side * 0.04], [0, 0, side * 0.18]);
      const thighStripe = capsule(THREE, 0.024, 0.34, pantsAccentMat, [side * 0.28, 0.32, side * 0.135], [0, 0, side * 0.18]);
      const knee = sphere(THREE, 0.085, pantsAccentMat, [side * 0.32, 0.13, side * 0.04], [1, 0.92, 1]);
      const shin = capsule(THREE, 0.08, 0.36, pantsMat, [side * 0.4, 0.08, side * 0.04], [0, 0, side * 0.4]);
      const shinStripe = capsule(THREE, 0.022, 0.28, pantsAccentMat, [side * 0.43, 0.09, side * 0.135], [0, 0, side * 0.4]);
      const boot = box(THREE, [0.42, 0.13, 0.25], bootMat, [side * 0.48, 0.07, side * 0.02], [0, 0, side * 0.12]);
      track(thigh, transform([side * 0.25, 0.31, side * 0.04], [0, 0, side * 0.18]), transform([side * 0.24, 0.33, side * 0.04], [0, 0, side * 0.32]));
      track(thighStripe, transform([side * 0.28, 0.32, side * 0.135], [0, 0, side * 0.18]), transform([side * 0.27, 0.34, side * 0.135], [0, 0, side * 0.32]));
      track(knee, transform([side * 0.32, 0.13, side * 0.04], [0, 0, 0]), transform([side * 0.32, 0.16, side * 0.04], [0, 0, 0]));
      track(shin, transform([side * 0.4, 0.08, side * 0.04], [0, 0, side * 0.4]), transform([side * 0.39, 0.09, side * 0.04], [0, 0, side * 0.54]));
      track(shinStripe, transform([side * 0.43, 0.09, side * 0.135], [0, 0, side * 0.4]), transform([side * 0.42, 0.1, side * 0.135], [0, 0, side * 0.54]));
      track(boot, transform([side * 0.48, 0.07, side * 0.02], [0, 0, side * 0.12]), transform([side * 0.48, 0.07, side * 0.02], [0, 0, side * 0.16]));
      lowerBody.add(thigh, thighStripe, knee, shin, shinStripe, boot);
    }

    const scarf = box(THREE, [0.5, 0.045, 0.08], edgeMat, [0.12, 1.18, -0.24], [0.2, 0.1, 0.28]);
    upperBody.add(scarf);

    function applyPose(opts) {
      const target = opts && opts.airborne ? 1 : 0;
      const lean = opts && opts.lean ? opts.lean : 0;
      grabBlend += (target - grabBlend) * 0.16;
      for (const item of poseParts) {
        applyTransform(item.part, item.ridePose, item.grabPose, grabBlend);
      }
      upperBody.rotation.x += lean * 0.04;
      lowerBody.rotation.x += lean * 0.025;
    }

    root.scale.setScalar(1.14);
    return {
      root,
      spinGroup,
      board: deck,
      leanParts,
      applyPose
    };
  }

  window.createSnowboarderModel = createSnowboarderModel;
}());
