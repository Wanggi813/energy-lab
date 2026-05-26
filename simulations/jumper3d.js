'use strict';
/**
 * BungeeJumper3D — 관절 계층구조 기반 고퀄리티 3D 번지점프 캐릭터
 * 의존성: Three.js (window.THREE)
 *
 * 사용법:
 *   const jumper = new BungeeJumper3D(THREE);
 *   scene.add(jumper.group);
 *   // 매 프레임:
 *   jumper.group.position.set(0, worldY, 0);
 *   jumper.update(dt, physicsState);
 */
window.BungeeJumper3D = class BungeeJumper3D {
  constructor(THREE) {
    this._T   = THREE;
    this.group = new THREE.Group();
    this._j   = {};          // 관절 Group 맵
    this._pb  = {};          // 포즈 블렌드 현재 각도 버퍼
    this._buildMaterials();
    this._buildRig();
    this._addBodyMeshes();
    this._addHarness();
    this._applyPoseInstant('standing');
    // 캐릭터 스케일 (씬 단위: 1 = 1m, 2배 = ~3.4m 키)
    this.group.scale.setScalar(2);
  }

  /* ───────────────────────────── 재질 ───────────────────────────── */
  _buildMaterials() {
    const T = this._T;
    this.mat = {
      suit:    new T.MeshStandardMaterial({ color: 0xff5140, roughness: 0.68 }),
      skin:    new T.MeshStandardMaterial({ color: 0xffc07a, roughness: 0.80 }),
      helmet:  new T.MeshStandardMaterial({ color: 0x14202e, roughness: 0.35, metalness: 0.30 }),
      visor:   new T.MeshStandardMaterial({ color: 0x5dd5eb, roughness: 0.20, metalness: 0.40,
                                            transparent: true, opacity: 0.80 }),
      boot:    new T.MeshStandardMaterial({ color: 0x191c23, roughness: 0.90 }),
      harness: new T.MeshStandardMaterial({ color: 0xffd820, roughness: 0.60 }),
      glove:   new T.MeshStandardMaterial({ color: 0x222a38, roughness: 0.85 }),
      eye:     new T.MeshStandardMaterial({ color: 0x080a0e }),
    };
  }

  /* ───────────────────────────── 헬퍼 ───────────────────────────── */
  _mesh(geo, mat, px=0, py=0, pz=0, rx=0, ry=0, rz=0) {
    const m = new this._T.Mesh(geo, mat);
    m.position.set(px, py, pz);
    m.rotation.set(rx, ry, rz);
    m.castShadow = true;
    return m;
  }
  _grp(parent, px=0, py=0, pz=0) {
    const g = new this._T.Group();
    g.position.set(px, py, pz);
    parent.add(g);
    return g;
  }

  /* ───────────────────────────── 관절 계층 ────────────────────────
   * 루트(navel) 기준 좌표 (Y-up, 앞쪽 = +Z)
   *
   *   navel (root)
   *   ├─ spine  (+y) → neck → head
   *   │          └─ shouL/R → elbowL/R
   *   └─ pelvis (-y) → hipL/R → kneeL/R
   * ──────────────────────────────────────────────────────────────── */
  _buildRig() {
    const j = this._j;
    const r = this.group;

    j.spine  = this._grp(r,  0,  0.08, 0);
    j.neck   = this._grp(j.spine,  0,  0.56, 0);
    j.head   = this._grp(j.neck,   0,  0.20, 0);

    j.shouL  = this._grp(j.spine, -0.26,  0.42, 0);
    j.elbowL = this._grp(j.shouL,   0,   -0.34, 0);
    j.shouR  = this._grp(j.spine,  0.26,  0.42, 0);
    j.elbowR = this._grp(j.shouR,   0,   -0.34, 0);

    j.pelvis = this._grp(r,  0, -0.14, 0);

    j.hipL   = this._grp(j.pelvis, -0.12, -0.12, 0);
    j.kneeL  = this._grp(j.hipL,    0,    -0.42, 0);
    j.hipR   = this._grp(j.pelvis,  0.12, -0.12, 0);
    j.kneeR  = this._grp(j.hipR,    0,    -0.42, 0);
  }

  /* ───────────────────────────── 메시 ──────────────────────────── */
  _addBodyMeshes() {
    const T   = this._T;
    const j   = this._j;
    const mat = this.mat;
    const add = (p, m) => { p.add(m); return m; };

    /* 골반 */
    add(j.pelvis, this._mesh(new T.BoxGeometry(0.34, 0.25, 0.20), mat.suit));

    /* 척추·흉부 */
    add(j.spine, this._mesh(new T.BoxGeometry(0.40, 0.46, 0.24), mat.suit, 0, 0.04));
    // 어깨 볼록
    for (const sx of [-1, 1])
      add(j.spine, this._mesh(new T.SphereGeometry(0.115, 14, 10), mat.suit, sx * 0.25, 0.42));

    /* 목 */
    add(j.neck, this._mesh(new T.CylinderGeometry(0.07, 0.08, 0.18, 12), mat.skin, 0, 0.08));

    /* 머리 (피부) */
    add(j.head, this._mesh(new T.SphereGeometry(0.165, 24, 18), mat.skin));

    /* 헬멧 돔 (상부 3/5) */
    add(j.head, this._mesh(
      new T.SphereGeometry(0.183, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.58),
      mat.helmet, 0, 0.04
    ));

    /* 헬멧 바이저 (앞면 아크 패널) */
    const visGeo = new T.CylinderGeometry(0.170, 0.170, 0.082, 22, 1, true,
                                           -Math.PI * 0.44, Math.PI * 0.88);
    add(j.head, this._mesh(visGeo, mat.visor, 0, -0.04, 0.025, Math.PI * 0.14));

    /* 바이저 테두리 */
    add(j.head, this._mesh(
      new T.TorusGeometry(0.170, 0.012, 6, 28, Math.PI * 0.88),
      mat.helmet, 0, -0.04, 0.025, Math.PI * 0.14 + Math.PI / 2, 0, -Math.PI * 0.44
    ));

    /* 헬멧 턱끈 */
    const chinGeo = new T.TorusGeometry(0.15, 0.013, 6, 32, Math.PI);
    add(j.head, this._mesh(chinGeo, mat.helmet, 0, -0.09, 0.04, -Math.PI * 0.18));

    /* 눈 */
    for (const ex of [-0.062, 0.062])
      add(j.head, this._mesh(new T.SphereGeometry(0.024, 10, 8), mat.eye, ex, 0.05, 0.148));

    /* 헬멧 상단 후크 + 카라비너 */
    add(j.head, this._mesh(new T.CylinderGeometry(0.022, 0.028, 0.09, 8), mat.helmet, 0, 0.20));
    add(j.head, this._mesh(new T.TorusGeometry(0.038, 0.011, 8, 22), mat.helmet, 0, 0.28));

    /* 팔 (좌우 대칭) */
    for (const [sj, ej] of [[j.shouL, j.elbowL], [j.shouR, j.elbowR]]) {
      add(sj, this._mesh(new T.CapsuleGeometry(0.078, 0.27, 6, 12), mat.suit, 0, -0.165));
      add(ej, this._mesh(new T.SphereGeometry(0.082, 12, 8), mat.suit));
      add(ej, this._mesh(new T.CapsuleGeometry(0.064, 0.24, 6, 12), mat.suit, 0, -0.155));
      add(ej, this._mesh(new T.SphereGeometry(0.080, 12, 10), mat.glove, 0, -0.34));
    }

    /* 다리 (좌우 대칭) */
    for (const [hj, kj] of [[j.hipL, j.kneeL], [j.hipR, j.kneeR]]) {
      add(hj, this._mesh(new T.CapsuleGeometry(0.108, 0.33, 6, 12), mat.suit, 0, -0.19));
      add(kj, this._mesh(new T.SphereGeometry(0.100, 12, 8), mat.suit));
      add(kj, this._mesh(new T.CapsuleGeometry(0.086, 0.28, 6, 12), mat.suit, 0, -0.18));
      // 부츠
      add(kj, this._mesh(new T.BoxGeometry(0.17, 0.12, 0.28), mat.boot, 0, -0.38, 0.05));
    }
  }

  /* ───────────────────────────── 안전 하네스 ──────────────────────── */
  _addHarness() {
    const T   = this._T;
    const j   = this._j;
    const mat = this.mat;

    // 가슴 X자 스트랩
    for (const sx of [-1, 1]) {
      const strap = new T.Mesh(new T.BoxGeometry(0.042, 0.44, 0.044), mat.harness);
      strap.position.set(sx * 0.12, 0.12, 0.11);
      strap.rotation.z = sx * 0.42;
      strap.castShadow = true;
      j.spine.add(strap);
    }
    // 중앙 버클
    const buckle = new T.Mesh(new T.BoxGeometry(0.09, 0.07, 0.045), mat.harness);
    buckle.position.set(0, 0.16, 0.122);
    j.spine.add(buckle);

    // 허리 벨트
    const belt = new T.Mesh(new T.BoxGeometry(0.44, 0.046, 0.26), mat.harness);
    belt.position.set(0, -0.20, 0);
    belt.castShadow = true;
    j.spine.add(belt);

    // 다리 고리 (좌우)
    for (const hj of [j.hipL, j.hipR]) {
      const loop = new T.Mesh(
        new T.TorusGeometry(0.118, 0.020, 6, 20, Math.PI * 1.55),
        mat.harness
      );
      loop.position.set(0, -0.06, 0.025);
      loop.rotation.x = Math.PI / 2;
      loop.castShadow = true;
      hj.add(loop);
    }

    // 어깨 → 허리 세로 스트랩 (등쪽)
    for (const sx of [-1, 1]) {
      const vstrap = new T.Mesh(new T.BoxGeometry(0.036, 0.62, 0.040), mat.harness);
      vstrap.position.set(sx * 0.15, 0.04, -0.10);
      vstrap.castShadow = true;
      j.spine.add(vstrap);
    }
  }

  /* ───────────────────────────── 포즈 정의 ────────────────────────
   * 각 관절 key → [rx, ry, rz] 오일러 각도 (라디안)
   * ──────────────────────────────────────────────────────────────── */
  _pose(name) {
    const P = {
      standing: {
        spine:[0,0,0], neck:[0,0,0], head:[0,0,0],
        shouL:[0,0, 0.18], elbowL:[0,0, 0.12],
        shouR:[0,0,-0.18], elbowR:[0,0,-0.12],
        hipL: [0,0, 0.07], kneeL: [0,0,0],
        hipR: [0,0,-0.07], kneeR: [0,0,0],
      },
      falling: {
        spine:[-0.14,0,0], neck:[0.30,0,0], head:[0,0,0],
        shouL:[ 0.18, 0.10, 1.45], elbowL:[ 0,0, 0.30],
        shouR:[ 0.18,-0.10,-1.45], elbowR:[ 0,0,-0.30],
        hipL: [ 0.20,0, 0.34],     kneeL: [ 0.24,0,0],
        hipR: [ 0.20,0,-0.34],     kneeR: [ 0.24,0,0],
      },
      stretching: {
        spine:[ 0.08,0,0], neck:[-0.40,0,0], head:[0,0,0],
        shouL:[-0.62, 0.18,-0.58], elbowL:[-0.28,0, 0.10],
        shouR:[-0.62,-0.18, 0.58], elbowR:[-0.28,0,-0.10],
        hipL: [ 0.08,0, 0.09],     kneeL: [-0.06,0,0],
        hipR: [ 0.08,0,-0.09],     kneeR: [-0.06,0,0],
      },
      rebound: {
        spine:[0,0,0], neck:[0,0,0], head:[0,0,0],
        shouL:[ 0.10,0, 0.95], elbowL:[0,0, 0.40],
        shouR:[ 0.10,0,-0.95], elbowR:[0,0,-0.40],
        hipL: [-0.30,0, 0.14], kneeL:[0.65,0,0],
        hipR: [-0.30,0,-0.14], kneeR:[0.65,0,0],
      },
      blackout: {
        spine:[ 0.40,0,0], neck:[ 0.50,0, 0.06], head:[0,0,0],
        shouL:[ 0.45,0, 0.40], elbowL:[0,0, 0.65],
        shouR:[ 0.45,0,-0.40], elbowR:[0,0,-0.65],
        hipL: [ 0.28,0, 0.15], kneeL:[0.46,0,0],
        hipR: [ 0.28,0,-0.15], kneeR:[0.46,0,0],
      },
    };
    return P[name] || P.standing;
  }

  /* 포즈 즉시 적용 (초기화용) */
  _applyPoseInstant(name) {
    const pose = this._pose(name);
    for (const key in pose) {
      if (!this._j[key]) continue;
      this._pb[key] = [...pose[key]];
      this._j[key].rotation.set(...pose[key]);
    }
  }

  /* ───────────────────────────── 매 프레임 업데이트 ───────────────── */
  update(dt, state) {
    /* 포즈 결정 */
    const ext = Math.max(0, state.y - state.restLength);
    let pname;
    if (state.mode === 'ready') {
      pname = 'standing';
    } else if (state.blackout) {
      pname = 'blackout';
    } else if (ext > 0.8) {
      pname = 'stretching';
    } else if (state.bottomDetected && state.v < 0) {
      pname = 'rebound';
    } else if (state.mode === 'running' || state.mode === 'replay' || state.mode === 'finished') {
      pname = (state.y > 3) ? 'falling' : 'standing';
    } else {
      pname = 'standing';
    }

    /* 포즈 스무스 블렌드 */
    const target  = this._pose(pname);
    const speed   = Math.min(1, 5.5 * dt);
    for (const key in target) {
      const jnt = this._j[key];
      if (!jnt) continue;
      if (!this._pb[key]) this._pb[key] = [...target[key]];
      const cur = this._pb[key];
      const tgt = target[key];
      cur[0] += (tgt[0] - cur[0]) * speed;
      cur[1] += (tgt[1] - cur[1]) * speed;
      cur[2] += (tgt[2] - cur[2]) * speed;
      jnt.rotation.set(cur[0], cur[1], cur[2]);
    }

    /* 슈트 색상 (상태에 따라) */
    this.mat.suit.color.setHex(
      state.blackout ? 0x9aa0a6
      : ext > 0      ? 0xffaa33
      :                0xff5140
    );

    /* 속도에 따른 몸통 기울기 */
    this.group.rotation.z = Math.max(-0.32, Math.min(0.32, state.v * -0.013));
  }
};
