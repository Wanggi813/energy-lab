'use strict';

    const G = 9.8;
    const BODY_HEIGHT = 1.7;
    const DROP_Y = 2;
    const GROUND_Y = 56;
    const BLACKOUT_G = 4.3;
    const DT_LIMIT = 1 / 30;

    const CLIENTS = [
      { name:'김지수', age:28, mass:60, avatar:'🏃',
        desc:'"첫 번지점프예요! 안전하게만 해주세요."',
        tag:'안전 우선', tagColor:'var(--green)',
        minClearance:4.0, maxG:5.5, minG:0, idealG:3.5 },
      { name:'박민준', age:22, mass:75, avatar:'🤸',
        desc:'"엄청 짜릿하게 해주세요! G가 낮으면 실망해요."',
        tag:'스릴 필수', tagColor:'var(--yellow)',
        minClearance:4.0, maxG:4.2, minG:3.4, idealG:4.0 },
      { name:'이순자', age:68, mass:90, avatar:'👴',
        desc:'"무릎이 안 좋아요. 아주 부드럽고 안전하게요."',
        tag:'초안전', tagColor:'var(--blue)',
        minClearance:6.0, maxG:3.5, minG:0, idealG:2.2 },
    ];
    let MASS = CLIENTS[0].mass;

    const canvas = document.getElementById('sim-canvas');
    const ctx = canvas.getContext('2d');
    const graph = document.getElementById('energy-graph');
    const graphCtx = graph.getContext('2d');

    const ui = {
      stage: document.querySelector('.stage'),
      speed: document.getElementById('speed-value'),
      stretch: document.getElementById('stretch-value'),
      g: document.getElementById('g-value'),
      clearance: document.getElementById('clearance-value'),
      event: document.getElementById('event-text'),
      badge: document.getElementById('design-badge'),
      kInput: document.getElementById('k-input'),
      lInput: document.getElementById('l-input'),
      dragInput: document.getElementById('drag-input'),
      kValue: document.getElementById('k-value'),
      lValue: document.getElementById('l-value'),
      bars: {
        pe: document.getElementById('pe-bar'),
        ke: document.getElementById('ke-bar'),
        ee: document.getElementById('ee-bar'),
        me: document.getElementById('me-bar')
      },
      values: {
        pe: document.getElementById('pe-value'),
        ke: document.getElementById('ke-value'),
        ee: document.getElementById('ee-value'),
        me: document.getElementById('me-value')
      },
      safeClearance: document.getElementById('safe-clearance'),
      safeG: document.getElementById('safe-g'),
      start: document.getElementById('start-btn'),
      reset: document.getElementById('reset-btn'),
      modal: document.getElementById('result-modal'),
      resultTitle: document.getElementById('result-title'),
      resultCopy: document.getElementById('result-copy'),
      modalAgain: document.getElementById('modal-again'),
      modalClose: document.getElementById('modal-close'),
      replayCard: document.getElementById('replay-card'),
      replaySlider: document.getElementById('replay-slider'),
      replayLabel: document.getElementById('replay-label'),
      roundEnd: document.getElementById('round-end'),
      reKicker: document.getElementById('re-kicker'),
      reHeadline: document.getElementById('re-headline'),
      reScoreNum: document.getElementById('re-score-num'),
      reBreakdown: document.getElementById('re-breakdown'),
      reAccum: document.getElementById('re-accum'),
      reGradeRow: document.getElementById('re-grade-row'),
      reGrade: document.getElementById('re-grade'),
      reGradeLabel: document.getElementById('re-grade-label'),
      reGradeTable: document.getElementById('re-grade-table'),
      reNextBtn: document.getElementById('re-next-btn'),
      reRetryBtn: document.getElementById('re-retry-btn'),
      roundDots: document.querySelectorAll('.rd'),
      ccAvatar: document.getElementById('cc-avatar'),
      ccName: document.getElementById('cc-name'),
      ccAge: document.getElementById('cc-age'),
      ccTag: document.getElementById('cc-tag'),
      ccQuote: document.getElementById('cc-quote'),
      safeMass: document.getElementById('safe-mass'),
      safeMinG: document.getElementById('safe-min-g'),
      minGRow: document.getElementById('min-g-row'),
      attemptCount: document.getElementById('attempt-count'),
      tutorialOverlay: document.getElementById('tutorial-overlay'),
      tutorialStep: document.getElementById('tutorial-step'),
      tutorialTitle: document.getElementById('tutorial-title'),
      tutorialCopy: document.getElementById('tutorial-copy'),
      tutorialNext: document.getElementById('tutorial-next'),
      tutorialSkip: document.getElementById('tutorial-skip'),
      tutorialReplay: document.getElementById('tutorial-replay'),
      tutorialObjectives: {
        conditions: document.getElementById('tutorial-obj-conditions'),
        k: document.getElementById('tutorial-obj-k'),
        l: document.getElementById('tutorial-obj-l'),
        start: document.getElementById('tutorial-obj-start'),
      },
    };

    const state = {
      mode: 'ready',
      t: 0,
      y: DROP_Y,
      v: 0,
      a: G,
      k: 95,
      restLength: 25,
      drag: true,
      initialEnergy: 0,
      lostEnergy: 0,
      maxSpeed: 0,
      maxStretch: 0,
      maxG: 0,
      minClearance: Infinity,
      sawStretch: false,
      bottomDetected: false,
      reboundReturning: false,
      blackout: false,
      failureType: '',
      particles: [],
      history: [],
      replayFrames: [],
      round: 0,
      attempts: [0, 0, 0],
      roundScores: [null, null, null],
      allDone: false,
      observeStartT: 0,
      practiceMode: false,
    };

    const tutorial = {
      active: false,
      step: 0,
      changedK: false,
      changedL: false,
      wasPracticeMode: false,
      target: null,
      steps: [
        {
          selector: '.panel-left',
          title: '브리핑: 합격 조건 읽기',
          copy: '번지 설계는 감으로 맞히는 게임이 아닙니다. 왼쪽의 최저점 여유, 최대 G, 체중을 먼저 읽고 안전 기준을 머릿속에 잡아두세요.',
          next: '조건 확인'
        },
        {
          selector: '.panel .card:first-of-type',
          title: '튜닝: 두 값만 만집니다',
          copy: '수정할 값은 k와 L입니다. k는 줄이 버티는 힘, L은 줄이 팽팽해지기 전 길이입니다. 두 슬라이더를 각각 한 번 움직여 보세요.',
          next: '튜닝 완료'
        },
        {
          selector: '#start-btn',
          title: '테스트: 연습 점프',
          copy: '이제 낙하 시작으로 결과를 확인합니다. 이 점프는 훈련용이라 점수와 시도 횟수에 반영되지 않습니다.',
          next: '연습 점프'
        },
        {
          selector: '.stage',
          title: '판정: 다시 설계하기',
          copy: '점프 후에는 최저점 여유와 최대 G를 봅니다. 낮게 떨어지면 L을 줄이거나 k를 높이고, G가 크면 k를 낮춰 더 부드럽게 만드세요.',
          next: '실전 시작'
        }
      ]
    };

    let raf = null;
    let lastTs = 0;
    let currentDt = 0;
    let graphW = 0;
    let graphH = 0;
    let view = { w: 0, h: 0, scale: 1, top: 0, left: 0, bridgeX: 0 };
    const T3 = {
      ready: false,
      scene: null,
      camera: null,
      renderer: null,
      jumperObj: null,   // BungeeJumper3D 인스턴스
      rope: null,
      ropeMaterial: null,
      water: null,
      rippleRings: [],
      idealMarker: null,
      predMarker: null,
      scaleY: 1
    };

    function resetRun() {
      MASS = CLIENTS[state.round].mass;
      state.mode = 'ready';
      state.t = 0;
      state.y = DROP_Y;
      state.v = 0;
      state.a = G;
      state.k = Number(ui.kInput.value);
      state.restLength = Number(ui.lInput.value);
      state.drag = ui.dragInput.checked;
      state.initialEnergy = MASS * G * (GROUND_Y - DROP_Y);
      state.lostEnergy = 0;
      state.maxSpeed = 0;
      state.maxStretch = 0;
      state.maxG = 0;
      state.minClearance = Infinity;
      state.sawStretch = false;
      state.bottomDetected = false;
      state.reboundReturning = false;
      state.blackout = false;
      state.failureType = '';
      state.observeStartT = 0;
      state.particles = [];
      state.history = [];
      state.replayFrames = [];
      updateStartBtn();
      ui.modal.classList.remove('show');
      ui.roundEnd.classList.remove('show');
      ui.replayCard.hidden = true;
      ui.replaySlider.disabled = true;
      ui.replaySlider.value = 0;
      const cl = CLIENTS[state.round];
      ui.safeClearance.textContent = `${cl.minClearance.toFixed(1)} m 이상`;
      ui.safeClearance.style.color = '';
      ui.safeG.textContent = `-- G / ${cl.maxG.toFixed(1)} G 이하`;
      ui.safeG.style.color = '';
      ui.safeMass.textContent = `${cl.mass} kg`;
      if (cl.minG > 0) {
        ui.minGRow.hidden = false;
        ui.safeMinG.textContent = `${cl.minG.toFixed(1)} G 이상`;
        ui.safeMinG.style.color = '';
      } else {
        ui.minGRow.hidden = true;
      }
      updateClientCard();
      // 이상점 패널 텍스트 갱신
      document.getElementById('safe-ideal').textContent = `${(cl.minClearance + 2.0).toFixed(1)} m`;
      updateIdealMarkerPos();
      updatePredictionMarker();
      setEvent('줄의 길이와 탄성을 조절해 안전한 번지점프를 설계하세요.');
      updateUi();
    }

    function updateStartBtn() {
      const k = Number(ui.kInput.value);
      const l = Number(ui.lInput.value);
      const valid = k > 0 && l > 0;
      ui.start.disabled = !valid;
      ui.start.title = valid ? '' : 'k와 L을 0보다 크게 설정해야 낙하를 시작할 수 있습니다.';
    }

    function syncPracticeButton() {
      const btn = document.getElementById('practice-btn');
      if (!btn) return;
      btn.textContent = state.practiceMode ? '🎯 연습 중 (점수 없음)' : '🎯 연습 모드';
      btn.classList.toggle('active', state.practiceMode);
    }

    function setPracticeMode(enabled, announce = false) {
      state.practiceMode = enabled;
      syncPracticeButton();
      if (!announce) return;
      setEvent(enabled
        ? '연습 모드: 시도 횟수가 점수에 반영되지 않습니다. 시안색 링(◈)이 이론상 최저점입니다.'
        : '정식 도전 모드: 이제부터의 시도 횟수가 점수에 반영됩니다.');
    }

    function clearTutorialTarget() {
      if (tutorial.target) tutorial.target.classList.remove('tutorial-target');
      document.querySelectorAll('.tutorial-pulse').forEach(node => node.classList.remove('tutorial-pulse'));
      tutorial.target = null;
    }

    function updateTutorialObjectives() {
      ui.tutorialObjectives.conditions?.classList.toggle('is-done', tutorial.step > 0);
      ui.tutorialObjectives.k?.classList.toggle('is-done', tutorial.changedK);
      ui.tutorialObjectives.l?.classList.toggle('is-done', tutorial.changedL);
      ui.tutorialObjectives.start?.classList.toggle('is-done', tutorial.step > 2);
    }

    function updateTutorialSpotlight() {
      if (!ui.tutorialOverlay || !tutorial.target) return;
      const rect = tutorial.target.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      ui.tutorialOverlay.style.setProperty('--tutorial-x', `${x}px`);
      ui.tutorialOverlay.style.setProperty('--tutorial-y', `${y}px`);
    }

    function renderTutorialStep() {
      if (!ui.tutorialOverlay) return;
      const item = tutorial.steps[tutorial.step];
      if (!item) return;

      clearTutorialTarget();
      ui.tutorialOverlay.classList.toggle('is-review', tutorial.step === 3);
      tutorial.target = document.querySelector(item.selector);
      if (tutorial.target && tutorial.step !== 3) {
        tutorial.target.classList.add('tutorial-target');
        tutorial.target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
      if (tutorial.step === 1) {
        ui.kInput.closest('.range-row')?.classList.add('tutorial-pulse');
        ui.lInput.closest('.range-row')?.classList.add('tutorial-pulse');
      }

      ui.tutorialStep.textContent = `훈련 ${tutorial.step + 1} / ${tutorial.steps.length}`;
      ui.tutorialTitle.textContent = item.title;
      ui.tutorialCopy.textContent = item.copy;
      ui.tutorialNext.textContent = item.next;
      ui.tutorialNext.disabled = tutorial.step === 1
        ? !(tutorial.changedK && tutorial.changedL)
        : tutorial.step === 2
          ? ui.start.disabled
          : false;
      ui.tutorialOverlay.querySelectorAll('.tutorial-progress span').forEach((node, index) => {
        node.classList.toggle('is-active', index === tutorial.step);
        node.classList.toggle('is-done', index < tutorial.step);
      });
      updateTutorialObjectives();
      ui.tutorialOverlay.classList.remove('hidden');
      ui.tutorialOverlay.setAttribute('aria-hidden', 'false');
      updateTutorialSpotlight();
    }

    function finishTutorial() {
      tutorial.active = false;
      clearTutorialTarget();
      ui.tutorialOverlay?.classList.add('hidden');
      ui.tutorialOverlay?.classList.remove('is-review');
      ui.tutorialOverlay?.setAttribute('aria-hidden', 'true');
      setPracticeMode(tutorial.wasPracticeMode, false);
      resetRun();
      setEvent('이제 실전입니다. 손님 조건을 보고 k와 L을 조절한 뒤 낙하를 시작하세요.');
    }

    function nextTutorialStep() {
      if (!tutorial.active) return;
      if (tutorial.step === 1 && !(tutorial.changedK && tutorial.changedL)) return;
      if (tutorial.step === 2) {
        if (!ui.start.disabled) startRun();
        return;
      }
      if (tutorial.step >= tutorial.steps.length - 1) {
        finishTutorial();
        return;
      }
      tutorial.step += 1;
      renderTutorialStep();
    }

    function markTutorialInput(kind) {
      if (!tutorial.active || tutorial.step !== 1) return;
      if (kind === 'k') tutorial.changedK = true;
      if (kind === 'l') tutorial.changedL = true;
      if (tutorial.changedK && tutorial.changedL) {
        setEvent('좋아요. k와 L이 모두 설정됐습니다. 이제 연습 점프로 결과를 확인하세요.');
      } else {
        setEvent(kind === 'k' ? 'k를 조절했습니다. 이제 L도 움직여 줄 길이를 정해보세요.' : 'L을 조절했습니다. 이제 k도 움직여 탄성을 정해보세요.');
      }
      renderTutorialStep();
    }

    function startBungeeTutorial() {
      if (!ui.tutorialOverlay) return;

      tutorial.active = true;
      tutorial.step = 0;
      tutorial.changedK = false;
      tutorial.changedL = false;
      tutorial.wasPracticeMode = state.practiceMode;
      setPracticeMode(true, false);
      resetRun();
      setEvent('튜토리얼: 손님 조건을 확인하고 k와 L을 한 번 조절해 보세요.');
      renderTutorialStep();
    }

    window.startBungeeTutorial = startBungeeTutorial;

    function startRun() {
      if (state.mode === 'running') return;
      state.mode = 'running';
      state.t = 0;
      state.y = DROP_Y;
      state.v = 0;
      state.a = G;
      state.maxSpeed = 0;
      state.maxStretch = 0;
      state.maxG = 0;
      state.minClearance = Infinity;
      state.sawStretch = false;
      state.bottomDetected = false;
      state.reboundReturning = false;
      state.blackout = false;
      state.failureType = '';
      state.lostEnergy = 0;
      state.history = [];
      state.replayFrames = [];
      if (!state.practiceMode) state.attempts[state.round] += 1;
      ui.replayCard.hidden = true;
      ui.replaySlider.disabled = true;
      ui.start.disabled = true;
      ui.modal.classList.remove('show');
      ui.roundEnd.classList.remove('show');
      if (tutorial.active && tutorial.step === 2) {
        setEvent('연습 점프 중입니다. 최저점 여유와 최대 G가 어떻게 변하는지 보세요.');
        setTimeout(() => {
          tutorial.step = 3;
          renderTutorialStep();
        }, 700);
      }
      recordFrame();
      setEvent('처음에는 위치에너지가 운동에너지로 바뀌며 속력이 커집니다.');
      updateUi();
    }

    function setEvent(text) {
      ui.event.textContent = text;
    }

    function resize() {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      view.w = rect.width;
      view.h = rect.height;
      view.scale = Math.min(view.h / 62, view.w / 42);
      view.top = 46;
      view.left = view.w * 0.5;
      view.bridgeX = view.left;
      initThree();
      resizeThree();

      const graphRect = graph.getBoundingClientRect();
      graph.width = Math.floor(graphRect.width * dpr);
      graph.height = Math.floor(graphRect.height * dpr);
      graphCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      graphW = graphRect.width;
      graphH = graphRect.height;
      draw();
      drawGraph();
    }

    function step(dt) {
      if (state.mode !== 'running' && state.mode !== 'observing') return;
      const isObserving = state.mode === 'observing';
      const cl = CLIENTS[state.round];
      const dragCoeff = state.drag ? 0.10 : 0;
      const substeps = Math.max(1, Math.ceil(dt / 0.006));
      const h = dt / substeps;

      for (let i = 0; i < substeps; i += 1) {
        const previousV = state.v;
        const extension = Math.max(0, state.y - state.restLength);
        let force = MASS * G;
        if (extension > 0) force -= state.k * extension;
        const dragForce = -dragCoeff * state.v * Math.abs(state.v);
        force += dragForce;

        state.a = force / MASS;
        state.v += state.a * h;
        state.y += state.v * h;
        state.t += h;
        if (dragCoeff > 0) state.lostEnergy += dragCoeff * Math.abs(state.v * state.v * state.v) * h;

        const clearance = GROUND_Y - state.y - BODY_HEIGHT;
        state.minClearance = Math.min(state.minClearance, clearance);
        state.maxSpeed = Math.max(state.maxSpeed, Math.abs(state.v));
        state.maxStretch = Math.max(state.maxStretch, extension);
        const currentG = Math.abs(state.a) / G;
        state.maxG = Math.max(state.maxG, currentG);
        if (extension > 0) state.sawStretch = true;
        recordFrame();

        if (extension > 0 && currentG > BLACKOUT_G && !state.blackout) {
          state.blackout = true;
          if (!isObserving) setEvent('⚠ 위험: G가 너무 커서 탑승자가 블랙아웃 상태입니다. 반동 중...');
        }

        if (state.y + BODY_HEIGHT >= GROUND_Y) {
          if (isObserving) {
            state.mode = 'finished';
            enterReplayMode();
          } else {
            finishRun(false, '구조 실패: 연못 추락', '줄이 너무 길거나 탄성이 부족해서 최저점이 수면 아래로 내려갔습니다. 원래 길이 L을 줄이거나 k를 높여보세요.', 'water');
          }
          return;
        }

        if (!isObserving) {
          if (state.sawStretch && !state.bottomDetected && state.v < 0) {
            state.bottomDetected = true;
            setEvent('최하점 통과: 탄성에너지가 다시 운동에너지로 바뀌며 위로 올라갑니다.');
          }

          if (state.bottomDetected && !state.reboundReturning && previousV < 0 && state.v >= 0) {
            state.reboundReturning = true;
            const safe = !state.blackout
                      && state.minClearance >= cl.minClearance
                      && state.maxG <= cl.maxG
                      && (cl.minG === 0 || state.maxG >= cl.minG);
            let copy;
            if (safe) {
              copy = 'Ep → Ek → Ee 전환이 완료됐습니다. 에너지 그래프를 확인해보세요.';
            } else if (state.blackout) {
              copy = `블랙아웃 발생 (${state.maxG.toFixed(1)} G). 탑승자가 의식을 잃었습니다. k를 낮춰 최대 G를 ${BLACKOUT_G.toFixed(1)} G 미만으로 줄이세요.`;
            } else if (state.maxG > cl.maxG) {
              copy = `최대 G ${state.maxG.toFixed(1)} G 초과. k를 낮춰 감속을 부드럽게 하세요.`;
            } else if (state.minClearance < cl.minClearance) {
              copy = `최저점이 너무 낮습니다 (여유 ${formatDistance(state.minClearance)}). 줄 길이를 줄이거나 k를 높이세요.`;
            } else if (cl.minG > 0 && state.maxG < cl.minG) {
              copy = `최대 G ${state.maxG.toFixed(1)} G로 스릴 부족. k를 높이거나 L을 늘려 G를 ${cl.minG.toFixed(1)} G 이상으로 만드세요.`;
            } else {
              copy = '설계 조건을 다시 확인해보세요.';
            }
            finishRun(safe, safe ? '안전 설계 성공' : '설계 조정 필요', copy, safe ? 'success' : 'unsafe');
            return;
          }

          if (state.t > 20) {
            finishRun(false, '분석 종료', '반동 조건이 명확하지 않습니다. 줄 길이와 탄성을 다시 조절해보세요.', 'timeout');
            return;
          }
        }
      }

      addHistory();
      updateParticles(dt);
      updateUi();
    }

    function finishRun(success, title, copy, type = '') {
      // Keep physics running so "계속 보기" shows a live graph
      state.mode = 'observing';
      state.failureType = success ? '' : type;
      state.observeStartT = state.t;
      recordFrame(true);
      addHistory();
      ui.start.disabled = false;

      if (type === 'water') burstSplash();
      else burst(success ? '#3ee68f' : '#ff5a6a');

      if (success) {
        if (tutorial.active) {
          const sc = calcScore(state.round, state.minClearance, state.maxG, 1);
          setEvent(`훈련 점프 성공! 예상 점수는 약 ${sc.total}점입니다. 안내창의 실전 시작을 눌러 정식 도전으로 넘어가세요.`);
        } else if (state.practiceMode) {
          const sc = calcScore(state.round, state.minClearance, state.maxG, 1);
          setEvent(`연습 성공! 이론 점수 약 ${sc.total}점. 연습 모드를 끄고 정식 도전하세요.`);
        } else {
          const sc = calcScore(state.round, state.minClearance, state.maxG, state.attempts[state.round]);
          state.roundScores[state.round] = sc;
          showRoundEnd(sc);
          setEvent('성공! 에너지 전환이 안전하게 이루어졌습니다. 그래프를 관찰하거나 다음 손님으로 이동하세요.');
        }
      } else {
        ui.resultTitle.textContent = title;
        ui.resultCopy.innerHTML = `${copy}<br>최저점 여유 ${formatDistance(state.minClearance)}, 최대 ${state.maxG.toFixed(1)} G`;
        ui.modal.classList.add('show');
        setEvent('계속 보기를 눌러 에너지 그래프를 실시간으로 관찰할 수 있습니다.');
      }
      updateUi();
    }

    function addHistory() {
      const e = energies();
      state.history.push(e);
      if (state.history.length > 180) state.history.shift();
    }

    function recordFrame(force = false) {
      const frames = state.replayFrames;
      const last = frames[frames.length - 1];
      if (!force && last && state.t - last.t < 0.025) return;
      const e = energies();
      frames.push({
        t: state.t,
        y: state.y,
        v: state.v,
        a: state.a,
        maxG: state.maxG,
        minClearance: state.minClearance,
        blackout: state.blackout,
        failureType: state.failureType,
        energy: e
      });
    }

    function enterReplayMode() {
      if (!state.replayFrames.length) return;
      state.mode = 'replay';
      ui.replayCard.hidden = false;
      ui.replaySlider.disabled = false;
      ui.replaySlider.max = state.replayFrames.length - 1;
      ui.replaySlider.value = state.replayFrames.length - 1;
      applyReplayFrame(state.replayFrames.length - 1);
      setEvent('리플레이 슬라이더로 낙하, 최하점, 반동, 다시 내려오는 순간을 되감아볼 수 있습니다.');
    }

    function applyReplayFrame(index) {
      const frame = state.replayFrames[Math.max(0, Math.min(state.replayFrames.length - 1, Number(index)))];
      if (!frame) return;
      state.y = frame.y;
      state.v = frame.v;
      state.a = frame.a;
      state.maxG = frame.maxG;
      state.minClearance = frame.minClearance;
      state.blackout = frame.blackout;
      state.failureType = frame.failureType;
      ui.replayLabel.textContent = `${frame.t.toFixed(2)} s`;
      updateUi();
    }

    function energies() {
      const height = Math.max(0, GROUND_Y - state.y);
      const extension = Math.max(0, state.y - state.restLength);
      const pe = MASS * G * height;
      const ke = 0.5 * MASS * state.v * state.v;
      const ee = 0.5 * state.k * extension * extension;
      const me = pe + ke + ee;
      return { pe, ke, ee, me };
    }

    function updateUi() {
      state.k = Number(ui.kInput.value);
      state.restLength = Number(ui.lInput.value);
      state.drag = ui.dragInput.checked;
      ui.kValue.textContent = state.k;
      ui.lValue.textContent = state.restLength;

      const extension = Math.max(0, state.y - state.restLength);
      if (ui.speed) ui.speed.textContent = `${Math.abs(state.v).toFixed(1)} m/s`;
      if (ui.stretch) ui.stretch.textContent = `${extension.toFixed(1)} m`;
      if (ui.g) ui.g.textContent = `${state.maxG.toFixed(1)} G`;
      if (ui.clearance) ui.clearance.textContent = state.minClearance === Infinity ? '-- m' : formatDistance(state.minClearance);

      const e = energies();
      const maxE = Math.max(state.initialEnergy, e.me, 1);
      setBar('pe', e.pe, maxE);
      setBar('ke', e.ke, maxE);
      setBar('ee', e.ee, maxE);
      setBar('me', e.me, maxE);

      const cl = CLIENTS[state.round];
      if (state.minClearance !== Infinity) {
        const ok = state.minClearance >= cl.minClearance;
        ui.safeClearance.textContent = `${ok ? '✓' : '⚠'} ${formatDistance(state.minClearance)} / ${cl.minClearance.toFixed(1)} m`;
        ui.safeClearance.style.color = ok ? 'var(--green)' : 'var(--red)';
      }
      if (state.maxG > 0) {
        const gOk = state.maxG <= cl.maxG;
        ui.safeG.textContent = `${gOk ? '✓' : '⚠'} ${state.maxG.toFixed(1)} G / ${cl.maxG.toFixed(1)} G`;
        ui.safeG.style.color = gOk ? 'var(--green)' : 'var(--red)';
        if (cl.minG > 0) {
          const minGOk = state.maxG >= cl.minG;
          ui.safeMinG.textContent = `${minGOk ? '✓' : '⚠'} ${state.maxG.toFixed(1)} G / ${cl.minG.toFixed(1)} G`;
          ui.safeMinG.style.color = minGOk ? 'var(--green)' : 'var(--red)';
        }
      }
      ui.attemptCount.textContent = `${state.attempts[state.round]}회`;
      const running = state.mode === 'running' || state.mode === 'observing';
      ui.badge.textContent = running ? '낙하 중' : state.allDone ? '완료!' : '대기 중';
      drawGraph();
    }

    function setBar(key, value, maxE) {
      ui.bars[key].style.width = `${Math.min(100, (value / maxE) * 100)}%`;
      ui.values[key].textContent = `${Math.round(value / 100) / 10} kJ`;
    }

    function formatDistance(value) {
      return `${Math.max(0, value).toFixed(1)} m`;
    }

    function burst(color) {
      const p = toScreen(view.bridgeX, state.y);
      for (let i = 0; i < 38; i += 1) {
        const a = (Math.PI * 2 * i) / 38;
        const s = 1.4 + (i % 7) * 0.35;
        state.particles.push({
          x: p.x,
          y: p.y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          life: 1,
          color
        });
      }
    }

    function burstSplash() {
      const p = { x: view.bridgeX, y: yToPx(GROUND_Y) };
      for (let i = 0; i < 70; i += 1) {
        const a = -Math.PI + (Math.PI * i) / 69;
        const s = 1.8 + (i % 11) * 0.28;
        state.particles.push({
          x: p.x,
          y: p.y - 4,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s - 1.4,
          life: 1.1,
          color: i % 3 === 0 ? '#dff8ff' : '#30d5ff'
        });
      }
    }

    function updateParticles(dt) {
      for (const p of state.particles) {
        p.life -= dt;
        p.x += p.vx * 42 * dt;
        p.y += p.vy * 42 * dt;
      }
      state.particles = state.particles.filter((p) => p.life > 0);
    }

    function initThree() {
      if (T3.ready || !window.THREE || !ui.stage) return;
      const three = window.THREE;
      T3.scene = new three.Scene();
      T3.scene.background = new three.Color(0x7ec8e3);
      T3.scene.fog = new three.Fog(0x9dd6ee, 110, 300);

      T3.camera = new three.PerspectiveCamera(42, Math.max(1, view.w) / Math.max(1, view.h), 0.1, 400);
      T3.camera.position.set(0, -27, 78);
      T3.camera.lookAt(0, -28, 0);

      T3.renderer = new three.WebGLRenderer({ antialias: true, alpha: false });
      T3.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      T3.renderer.setSize(view.w, view.h);
      T3.renderer.shadowMap.enabled = true;
      T3.renderer.outputColorSpace = three.SRGBColorSpace;
      T3.renderer.domElement.className = 'three-stage';
      ui.stage.insertBefore(T3.renderer.domElement, canvas.nextSibling);
      ui.stage.classList.add('three-ready');

      // 주간 조명: 반구광(하늘/땅) + 태양 직사광
      T3.scene.add(new three.HemisphereLight(0xd4eeff, 0x4a8c5c, 2.2));
      const sun = new three.DirectionalLight(0xfffbe8, 2.8);
      sun.position.set(30, 60, 40);
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      sun.shadow.camera.near = 0.5;
      sun.shadow.camera.far = 300;
      sun.shadow.camera.left = -80;
      sun.shadow.camera.right = 80;
      sun.shadow.camera.top = 80;
      sun.shadow.camera.bottom = -80;
      T3.scene.add(sun);

      createThreeEnvironment();
      createThreeBridge();
      T3.jumperObj = new BungeeJumper3D(window.THREE);
      T3.scene.add(T3.jumperObj.group);
      createThreeRope();
      createThreeIdealMarker();
      createThreePredMarker();
      T3.ready = true;
    }

    function resizeThree() {
      if (!T3.ready || !T3.renderer || !T3.camera) return;
      T3.renderer.setSize(view.w, view.h);
      T3.camera.aspect = Math.max(1, view.w) / Math.max(1, view.h);
      T3.camera.updateProjectionMatrix();
    }

    function createThreeEnvironment() {
      const three = window.THREE;

      /* ── 하늘 돔 (그라데이션: 지평선 연하늘 → 천정 짙은 파랑) ── */
      const skyGeo = new three.SphereGeometry(280, 32, 18);
      const skyPos = skyGeo.attributes.position;
      const skyColors = new Float32Array(skyPos.count * 3);
      for (let i = 0; i < skyPos.count; i++) {
        const t = Math.max(0, Math.min(1, (skyPos.getY(i) + 180) / 360));
        // t=0(바닥·지평선): #c8e8f8, t=1(천정): #1a72b8
        skyColors[i*3]   = 0.784 - 0.663 * t;
        skyColors[i*3+1] = 0.910 - 0.464 * t;
        skyColors[i*3+2] = 0.973 - 0.253 * t;
      }
      skyGeo.setAttribute('color', new three.Float32BufferAttribute(skyColors, 3));
      const skyMesh = new three.Mesh(skyGeo,
        new three.MeshBasicMaterial({ vertexColors: true, side: three.BackSide }));
      skyMesh.position.set(0, 0, 0);
      T3.scene.add(skyMesh);

      /* ── 구름 (평면 타원) ── */
      const cloudMat = new three.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.72 });
      const clouds = [
        [-55, 28, -90, 22, 4], [30, 34, -120, 30, 5], [-10, 22, -70, 16, 3],
        [60, 38, -160, 36, 6], [-80, 42, -200, 28, 5], [20, 18, -55, 12, 2.5],
      ];
      for (const [cx, cy, cz, rw, rh] of clouds) {
        const c = new three.Mesh(new three.SphereGeometry(1, 14, 8), cloudMat.clone());
        c.scale.set(rw, rh, rw * 0.38);
        c.position.set(cx, cy - GROUND_Y * 0.5, cz);
        T3.scene.add(c);
      }

      /* ── 호수 윤곽 Shape 정의 (로컬 XY → 월드 XZ 매핑) ── */
      // 로컬 +Y = 월드 -Z (카메라 반대 방향, 멀리)
      // 낙하 지점 (0,0) 이 호수 안에 있어야 함
      function makeLakePts(scale) {
        return [
          [50, -35], [72, -15], [70, 20], [56, 46],
          [44, 68],  [20, 80],  [0, 76],
          [-22, 72], [-46, 62], [-60, 40],
          [-74, 20], [-68, -8], [-52, -28],
          [-36, -50],[-14, -56],[10, -50],
          [30, -44], [44, -38], [50, -35],
        ].map(([x,y]) => [x*scale, y*scale]);
      }

      function buildShape(pts, shapeCtor) {
        const s = shapeCtor();
        s.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length - 2; i += 3)
          s.bezierCurveTo(pts[i][0],pts[i][1], pts[i+1][0],pts[i+1][1], pts[i+2][0],pts[i+2][1]);
        return s;
      }

      const lakePts  = makeLakePts(1.0);
      const beachPts = makeLakePts(1.35);

      const lakeShape  = buildShape(lakePts,  () => new three.Shape());
      const beachShape = buildShape(beachPts, () => new three.Shape());
      // 구멍: 모래사장 Shape 안에 호수 윤곽을 hole로 뚫음
      const lakeHole = buildShape(lakePts, () => new three.Path());
      beachShape.holes.push(lakeHole);

      /* ── 수면 (자연스러운 호수 형태) ── */
      const waterMat = new three.MeshStandardMaterial({
        color: 0x2a9ec4, roughness: 0.08, metalness: 0.26,
        transparent: true, opacity: 0.92
      });
      T3.water = new three.Mesh(new three.ShapeGeometry(lakeShape, 48), waterMat);
      T3.water.rotation.x = -Math.PI / 2;
      T3.water.position.set(0, -GROUND_Y + 0.10, 0);
      T3.water.receiveShadow = true;
      T3.scene.add(T3.water);

      /* ── 수면 반짝임 레이어 ── */
      const shimMat = new three.MeshBasicMaterial({ color: 0xb8eeff, transparent: true, opacity: 0.20 });
      const shim = new three.Mesh(new three.ShapeGeometry(lakeShape, 48), shimMat);
      shim.rotation.x = -Math.PI / 2;
      shim.position.set(0, -GROUND_Y + 0.18, 0);
      T3.scene.add(shim);

      /* ── 모래사장 링 (호수 둘레) ── */
      const sandMat = new three.MeshStandardMaterial({ color: 0xd6bc88, roughness: 0.96 });
      const sand = new three.Mesh(new three.ShapeGeometry(beachShape, 48), sandMat);
      sand.rotation.x = -Math.PI / 2;
      sand.position.set(0, -GROUND_Y + 0.05, 0);
      sand.receiveShadow = true;
      T3.scene.add(sand);

      /* ── 넓은 초원 (절벽 없음, 수평 지형) ── */
      const grassMat = new three.MeshStandardMaterial({ color: 0x4a9158, roughness: 0.90 });
      // 지면 전체 커버 (호수·모래 위에 그냥 깔고, 호수가 더 위에 있어 가려짐)
      const ground = new three.Mesh(new three.PlaneGeometry(1200, 1200), grassMat);
      ground.rotation.x = -Math.PI / 2;
      ground.position.set(0, -GROUND_Y, 0);
      ground.receiveShadow = true;
      T3.scene.add(ground);

      /* ── 호수 가까운 쪽 완만한 둑 ── */
      const bankMat = new three.MeshStandardMaterial({ color: 0x3d7a48, roughness: 0.88 });
      for (const side of [-1, 1]) {
        const bank = new three.Mesh(new three.BoxGeometry(18, 3.5, 280), bankMat);
        bank.position.set(side * 74, -GROUND_Y + 1.2, -10);
        bank.rotation.z = side * 0.06;
        bank.receiveShadow = true;
        T3.scene.add(bank);
      }

      /* ── 산 (3레이어, 밝은 낮 색상) ── */
      const mtColors = [0x5d8a6a, 0x3d6e52, 0x2e5440];
      const mtZs     = [-60, -100, -160];
      const mtSizes  = [1.0, 1.4, 1.8];
      for (let layer = 0; layer < 3; layer++) {
        const shape = new three.Shape();
        const W = 120 * mtSizes[layer];
        shape.moveTo(-W, -90);
        for (let i = 0; i <= 18; i++) {
          const x = -W + (W * 2 * i) / 18;
          const peak = -8 + Math.sin(i * 1.4 + layer * 1.2) * 16 * mtSizes[layer]
                          + Math.sin(i * 0.6 + layer) * 9 * mtSizes[layer];
          shape.lineTo(x, peak);
        }
        shape.lineTo(W, -90);
        shape.lineTo(-W, -90);
        const mtMesh = new three.Mesh(
          new three.ShapeGeometry(shape),
          new three.MeshBasicMaterial({ color: mtColors[layer], side: three.DoubleSide })
        );
        mtMesh.position.set(0, -GROUND_Y * 0.35 + 10 * mtSizes[layer], mtZs[layer]);
        T3.scene.add(mtMesh);
      }

      /* ── 소나무 군락 ── */
      const trunkMat = new three.MeshStandardMaterial({ color: 0x5c3d22, roughness: 0.80 });
      const leafMat  = new three.MeshStandardMaterial({ color: 0x2d7040, roughness: 0.80 });
      const leaf2Mat = new three.MeshStandardMaterial({ color: 0x3d8a50, roughness: 0.78 });
      for (let i = 0; i < 54; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const xi = Math.floor(i / 2);
        const x  = side * (22 + (xi % 10) * 5.2 + (xi % 3) * 2.4);
        const z  = -18 + xi * 3.8 - (i % 3) * 1.4;
        const h  = 3.2 + (i % 5) * 0.55;
        const trunk = new three.Mesh(new three.CylinderGeometry(0.10, 0.16, h, 6), trunkMat);
        trunk.position.set(x, -GROUND_Y + h / 2 + 2.2, z);
        T3.scene.add(trunk);
        const lMat = i % 3 === 0 ? leaf2Mat : leafMat;
        const leaves = new three.Mesh(new three.ConeGeometry(1.1, h * 1.8, 8), lMat);
        leaves.position.set(x, -GROUND_Y + h * 1.4 + 2.2, z);
        leaves.castShadow = true;
        T3.scene.add(leaves);
      }

      /* ── 물 파문 링 (물 충돌 효과용) ── */
      const ringMat = new three.MeshBasicMaterial({ color: 0xdff8ff, transparent: true, opacity: 0 });
      for (let i = 0; i < 4; i++) {
        const ring = new three.Mesh(new three.TorusGeometry(1.4 + i * 0.7, 0.025, 8, 64), ringMat.clone());
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(0, -GROUND_Y + 0.05, 0);
        ring.visible = false;
        T3.rippleRings.push(ring);
        T3.scene.add(ring);
      }
    }

    function createThreeBridge() {
      const three = window.THREE;
      const deckMat = new three.MeshStandardMaterial({ color: 0x1a2938, roughness: 0.58, metalness: 0.18 });
      const railMat = new three.MeshStandardMaterial({ color: 0xd7e9f4, roughness: 0.35, metalness: 0.18 });
      const deck = new three.Mesh(new three.BoxGeometry(36, 0.9, 4.8), deckMat);
      deck.position.set(0, 0, 0);
      deck.castShadow = true;
      deck.receiveShadow = true;
      T3.scene.add(deck);

      for (const z of [-2.2, 2.2]) {
        const rail = new three.Mesh(new three.BoxGeometry(36, 0.18, 0.18), railMat);
        rail.position.set(0, 1.15, z);
        T3.scene.add(rail);
        for (let i = -8; i <= 8; i += 1) {
          const post = new three.Mesh(new three.BoxGeometry(0.12, 1.15, 0.12), railMat);
          post.position.set(i * 2.1, 0.55, z);
          T3.scene.add(post);
        }
      }

      const pad = new three.Mesh(
        new three.BoxGeometry(3.6, 0.35, 3.0),
        new three.MeshStandardMaterial({ color: 0x30d5ff, roughness: 0.4, emissive: 0x083d55, emissiveIntensity: 0.22 })
      );
      pad.position.set(0, 0.62, 0);
      T3.scene.add(pad);
    }

function createThreeRope() {
      const three = window.THREE;
      T3.ropeMaterial = new three.MeshStandardMaterial({ color: 0xdceaf2, roughness: 0.42, metalness: 0.05 });
      T3.rope = new three.Mesh(new three.BufferGeometry(), T3.ropeMaterial);
      T3.rope.castShadow = true;
      T3.scene.add(T3.rope);
    }

    function createThreeIdealMarker() {
      const three = window.THREE;
      const grp = new three.Group();

      // 외곽 링 (금색)
      const ring = new three.Mesh(
        new three.TorusGeometry(7, 0.18, 8, 64),
        new three.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.90 })
      );
      ring.rotation.x = -Math.PI / 2;
      grp.add(ring);

      // 내부 반투명 원판
      const disc = new three.Mesh(
        new three.CircleGeometry(7, 64),
        new three.MeshBasicMaterial({ color: 0xffee44, transparent: true, opacity: 0.07, side: three.DoubleSide })
      );
      disc.rotation.x = -Math.PI / 2;
      grp.add(disc);

      // 십자선 2개
      const lineMat = new three.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.55 });
      for (const rot of [0, Math.PI / 2]) {
        const bar = new three.Mesh(new three.PlaneGeometry(14, 0.12), lineMat);
        bar.rotation.x = -Math.PI / 2;
        bar.rotation.z = rot;
        grp.add(bar);
      }

      T3.idealMarker = grp;
      T3.scene.add(grp);
      updateIdealMarkerPos();
    }

    function updateIdealMarkerPos() {
      if (!T3.idealMarker) return;
      const cl = CLIENTS[state.round];
      const idealClearance = cl.minClearance + 2.0;
      // 3D Y: 다리=0, 수면=-GROUND_Y. 이상점은 수면에서 idealClearance 위 + 몸높이
      const idealY3d = -(GROUND_Y - BODY_HEIGHT - idealClearance);
      T3.idealMarker.position.set(0, idealY3d, 0);
    }

    function drawThree() {
      if (!T3.ready) return;
      const three = window.THREE;
      const extension = Math.max(0, state.y - state.restLength);
      const y = -state.y;
      const targetY = -Math.min(47, Math.max(12, state.y));

      if (T3.jumperObj) {
        const jumperY = state.failureType === 'water' ? -GROUND_Y + 1.0 : y;
        T3.jumperObj.group.position.set(0, jumperY, 0);
        T3.jumperObj.update(currentDt, state);
      }

      updateThreeRope(extension);
      updateThreeRipples();

      if (T3.water) {
        T3.water.material.color.setHSL(0.53, 0.72, 0.28 + Math.sin(state.t * 1.8) * 0.02);
      }

      // 이상점 마커 펄스
      if (T3.idealMarker) {
        const pulse = 0.85 + Math.sin(state.t * 2.8) * 0.15;
        T3.idealMarker.children[0].material.opacity = pulse * 0.90;
        T3.idealMarker.children[1].material.opacity = pulse * 0.07;
      }
      // 이론 최저점 마커 펄스
      if (T3.predMarker && T3.predMarker.visible) {
        const p2 = 0.70 + Math.sin(state.t * 3.6 + 1.2) * 0.30;
        T3.predMarker.children[0].material.opacity = p2 * 0.85;
        T3.predMarker.children[1].material.opacity = p2 * 0.08;
      }

      T3.camera.position.y += (targetY - T3.camera.position.y) * 0.045;
      T3.camera.lookAt(0, targetY - 2, 0);
      T3.renderer.render(T3.scene, T3.camera);
    }

    function updateThreeRope(extension) {
      if (!T3.rope) return;
      const three = window.THREE;
      const points = [];
      // 캐릭터 2배 스케일 기준: 헬멧 카라비너 ≈ 그룹 y + 2.2
      const endY = state.failureType === 'water' ? -GROUND_Y + 2.2 : -state.y + 2.2;
      const segments = extension > 0 ? 30 : 14;
      const amp = extension > 0 ? 0.34 : 0.18;
      for (let i = 0; i <= segments; i += 1) {
        const t = i / segments;
        const y = -0.25 + (endY + 0.25) * t;
        const coil = Math.sin(t * Math.PI * segments * 0.72);
        points.push(new three.Vector3(coil * amp * (1 - t * 0.15), y, Math.cos(t * 18) * amp * 0.35));
      }
      const curve = new three.CatmullRomCurve3(points);
      T3.rope.geometry.dispose();
      T3.rope.geometry = new three.TubeGeometry(curve, segments * 2, extension > 0 ? 0.045 : 0.035, 8, false);
      T3.ropeMaterial.color.set(extension > 0 ? 0xff5a6a : 0xdceaf2);
      T3.ropeMaterial.emissive = new three.Color(extension > 0 ? 0x3a0509 : 0x000000);
      T3.ropeMaterial.emissiveIntensity = extension > 0 ? Math.min(0.45, extension / 20) : 0;
    }

    function updateThreeRipples() {
      const waterFailure = state.failureType === 'water';
      T3.rippleRings.forEach((ring, i) => {
        ring.visible = waterFailure;
        if (!waterFailure) return;
        const s = 1 + i * 0.7 + Math.sin(state.t * 2 + i) * 0.08;
        ring.scale.setScalar(s);
        ring.material.opacity = Math.max(0.12, 0.5 - i * 0.08);
      });
    }

    function draw() {
      if (T3.ready) {
        drawThree();
        return;
      }
      ctx.clearRect(0, 0, view.w, view.h);
      drawSky();
      drawPondScene();
      drawBridge();
      drawRope();
      drawJumper();
      drawSafetyZone();
      drawParticles();
    }

    function drawSky() {
      const sky = ctx.createLinearGradient(0, 0, 0, view.h * 0.72);
      sky.addColorStop(0, '#1a72b8');
      sky.addColorStop(0.55, '#5db8dc');
      sky.addColorStop(1, '#b8e4f5');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, view.w, view.h);

      // 구름
      ctx.fillStyle = 'rgba(255,255,255,0.80)';
      const cloudDefs = [
        [0.12, 0.08, 48, 12], [0.45, 0.05, 62, 15], [0.72, 0.11, 38, 10],
        [0.28, 0.17, 30, 8],  [0.62, 0.14, 52, 13],
      ];
      for (const [fx, fy, rw, rh] of cloudDefs) {
        ctx.beginPath();
        ctx.ellipse(fx * view.w, fy * view.h, rw, rh, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      drawMountain(-0.18, '#5d8a6a', 0.82);
      drawMountain(0.02, '#3d6e52', 1.0);
    }

    function drawMountain(offset, color, scale) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, view.h * 0.86);
      for (let i = 0; i <= 9; i += 1) {
        const x = (view.w * i) / 9;
        const y = view.h * (0.48 + offset) + Math.sin(i * 1.7) * 34 * scale;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(view.w, view.h);
      ctx.lineTo(0, view.h);
      ctx.closePath();
      ctx.fill();
    }

    function drawPondScene() {
      const water = yToPx(GROUND_Y);
      const shoreY = water - 24;

      const bank = ctx.createLinearGradient(0, view.top, 0, shoreY);
      bank.addColorStop(0, '#244461');
      bank.addColorStop(0.55, '#2c5f4c');
      bank.addColorStop(1, '#173f35');

      ctx.fillStyle = bank;
      ctx.beginPath();
      ctx.moveTo(0, view.top + 88);
      ctx.lineTo(view.left - 170, view.top + 42);
      ctx.lineTo(view.left - 260, shoreY);
      ctx.lineTo(0, shoreY + 24);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(view.w, view.top + 96);
      ctx.lineTo(view.left + 170, view.top + 42);
      ctx.lineTo(view.left + 260, shoreY);
      ctx.lineTo(view.w, shoreY + 24);
      ctx.closePath();
      ctx.fill();

      drawPineLine(shoreY);

      const waterGrad = ctx.createLinearGradient(0, water - 20, 0, view.h);
      waterGrad.addColorStop(0, '#2ed6f2');
      waterGrad.addColorStop(0.32, '#116f91');
      waterGrad.addColorStop(1, '#082c48');
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, water - 18, view.w, view.h - water + 18);

      ctx.fillStyle = 'rgba(222,250,255,0.75)';
      ctx.fillRect(0, water - 20, view.w, 5);

      ctx.strokeStyle = 'rgba(220,252,255,0.38)';
      ctx.lineWidth = 1.6;
      for (let i = 0; i < 16; i += 1) {
        const y = water + 8 + i * 14;
        const amp = 16 + (i % 4) * 5;
        ctx.beginPath();
        for (let x = -20; x <= view.w + 20; x += 28) {
          const py = y + Math.sin(x * 0.035 + i * 0.9 + state.t * 1.5) * 3;
          if (x === -20) ctx.moveTo(x, py);
          else ctx.quadraticCurveTo(x + amp * 0.4, py - 4, x + amp, py);
        }
        ctx.stroke();
      }

      ctx.fillStyle = 'rgba(48,213,255,0.16)';
      ctx.beginPath();
      ctx.ellipse(view.bridgeX, water + 18, 110, 18, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawPineLine(baseY) {
      for (let i = 0; i < 22; i += 1) {
        const side = i % 2 === 0 ? -1 : 1;
        const x = side < 0
          ? 18 + (i / 22) * (view.left - 255)
          : view.w - 18 - (i / 22) * (view.left - 255);
        const h = 34 + (i % 5) * 9;
        ctx.fillStyle = '#4e3327';
        ctx.fillRect(x - 3, baseY - h * 0.34, 6, h * 0.34);
        ctx.fillStyle = i % 3 === 0 ? '#123b31' : '#18513f';
        ctx.beginPath();
        ctx.moveTo(x, baseY - h);
        ctx.lineTo(x - 18, baseY - h * 0.35);
        ctx.lineTo(x + 18, baseY - h * 0.35);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x, baseY - h * 0.76);
        ctx.lineTo(x - 14, baseY - h * 0.18);
        ctx.lineTo(x + 14, baseY - h * 0.18);
        ctx.closePath();
        ctx.fill();
      }
    }

    function drawBridge() {
      const y = yToPx(0);
      const deckW = Math.min(view.w * 0.82, 720);
      const x = view.left - deckW / 2;
      ctx.fillStyle = '#1a2938';
      ctx.fillRect(x, y - 20, deckW, 28);
      ctx.fillStyle = '#d7e9f4';
      ctx.fillRect(x, y - 24, deckW, 5);
      ctx.strokeStyle = 'rgba(215,233,244,0.75)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y - 42);
      ctx.lineTo(x + deckW, y - 42);
      ctx.stroke();
      for (let i = 0; i <= 14; i += 1) {
        const px = x + (deckW * i) / 14;
        ctx.beginPath();
        ctx.moveTo(px, y - 42);
        ctx.lineTo(px, y - 20);
        ctx.stroke();
      }
      ctx.fillStyle = '#30d5ff';
      ctx.fillRect(view.left - 34, y - 30, 68, 10);
    }

    function drawRope() {
      const top = { x: view.bridgeX, y: yToPx(0) - 24 };
      const end = toScreen(view.bridgeX, state.y - 0.8);
      const extension = Math.max(0, state.y - state.restLength);
      const coils = extension > 0 ? 18 : 8;
      const amp = extension > 0 ? 9 : 18;
      ctx.strokeStyle = extension > 0 ? '#ff5a6a' : '#dceaf2';
      ctx.lineWidth = extension > 0 ? 3 : 4;
      ctx.beginPath();
      ctx.moveTo(top.x, top.y);
      for (let i = 1; i <= coils; i += 1) {
        const t = i / coils;
        const x = view.bridgeX + Math.sin(t * Math.PI * coils) * amp * (1 - t * 0.25);
        const y = top.y + (end.y - top.y) * t;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      const restY = yToPx(state.restLength);
      ctx.save();
      ctx.setLineDash([8, 8]);
      ctx.strokeStyle = 'rgba(48,213,255,0.55)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(view.left - 92, restY);
      ctx.lineTo(view.left + 92, restY);
      ctx.stroke();
      ctx.fillStyle = '#bfefff';
      ctx.font = '800 12px Pretendard, Arial';
      ctx.fillText('원래 길이 L', view.left + 102, restY + 4);
      ctx.restore();
    }

    function drawJumper() {
      const p = toScreen(view.bridgeX, state.y);
      const extension = Math.max(0, state.y - state.restLength);
      const gLoad = Math.min(1, Math.abs(state.a) / (CLIENTS[state.round].maxG * G));

      if (state.failureType === 'water') {
        const water = yToPx(GROUND_Y);
        ctx.save();
        ctx.fillStyle = '#ffcf5b';
        ctx.beginPath();
        ctx.arc(p.x, water - 8, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.65)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i += 1) {
          ctx.beginPath();
          ctx.ellipse(p.x, water + i * 6, 28 + i * 18, 5 + i * 2, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
        return;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(Math.max(-0.35, Math.min(0.35, state.v * 0.018)));

      ctx.strokeStyle = '#17243a';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(-22, 18 + gLoad * 5);
      ctx.moveTo(10, 0);
      ctx.lineTo(22, 18 + gLoad * 5);
      ctx.stroke();

      ctx.fillStyle = state.blackout ? '#7d8590' : extension > 0 ? '#ffcf5b' : '#ff6f91';
      roundRect(ctx, -15, -22, 30, 34, 8);
      ctx.fill();

      ctx.strokeStyle = '#edf8ff';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-12, -14);
      ctx.lineTo(-31, -6 - gLoad * 10);
      ctx.moveTo(12, -14);
      ctx.lineTo(31, -6 - gLoad * 10);
      ctx.stroke();

      ctx.fillStyle = '#ffd6a5';
      ctx.beginPath();
      ctx.arc(0, -34, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#132033';
      ctx.beginPath();
      ctx.arc(0, -39, 14, Math.PI, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#07111f';
      if (state.blackout) {
        ctx.font = '900 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('X X', 0, -32);
      } else {
        ctx.beginPath();
        ctx.arc(-4.5, -35, 1.7, 0, Math.PI * 2);
        ctx.arc(4.5, -35, 1.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#07111f';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, -29, 4, 0, Math.PI);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawSafetyZone() {
      const cl = CLIENTS[state.round];
      const y = yToPx(GROUND_Y - cl.minClearance - BODY_HEIGHT);
      ctx.fillStyle = 'rgba(62,230,143,0.08)';
      ctx.fillRect(0, y, view.w, yToPx(GROUND_Y) - y);
      ctx.strokeStyle = 'rgba(62,230,143,0.75)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(view.w, y);
      ctx.stroke();
      ctx.fillStyle = '#dfffee';
      ctx.font = '900 12px Pretendard, Arial';
      ctx.fillText(`최소 여유 ${cl.minClearance.toFixed(1)} m`, 18, y - 8);

      // 이상점 선 (금색)
      const idealY = yToPx(GROUND_Y - (cl.minClearance + 2.0) - BODY_HEIGHT);
      ctx.save();
      ctx.setLineDash([10, 6]);
      ctx.strokeStyle = 'rgba(255,215,0,0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, idealY);
      ctx.lineTo(view.w, idealY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#ffd700';
      ctx.font = '900 12px Pretendard, Arial';
      ctx.fillText(`★ 이상점 ${(cl.minClearance + 2.0).toFixed(1)} m`, 18, idealY - 8);
      ctx.restore();

      // 이론 예측 최저점 선 (시안색 점선) — 현재 k/L 설정 기준
      if (state.mode === 'ready') {
        const pred = calcPrediction();
        if (pred.valid && pred.clearance !== Infinity && pred.yLowest < GROUND_Y) {
          const predY = yToPx(pred.yLowest);
          const safe = pred.clearance >= cl.minClearance;
          const predColor = safe ? 'rgba(48,213,255,0.90)' : 'rgba(255,90,106,0.90)';
          ctx.save();
          ctx.setLineDash([6, 5]);
          ctx.strokeStyle = predColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, predY);
          ctx.lineTo(view.w, predY);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = predColor;
          ctx.font = '900 11px Pretendard, Arial';
          ctx.fillText(`◈ 예측 최저점  여유 ${pred.clearance >= 0 ? pred.clearance.toFixed(1) : '연못 추락'} m`, 18, predY - 7);
          ctx.restore();
        }
      }
    }

    function drawParticles() {
      for (const p of state.particles) {
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function drawGraph() {
      if (!graphW) return;
      const w = graphW;
      const h = graphH;
      graphCtx.clearRect(0, 0, w, h);
      graphCtx.fillStyle = 'rgba(0,0,0,0.18)';
      graphCtx.fillRect(0, 0, w, h);
      graphCtx.strokeStyle = 'rgba(255,255,255,0.08)';
      graphCtx.lineWidth = 1;
      for (let i = 1; i < 4; i += 1) {
        graphCtx.beginPath();
        graphCtx.moveTo(0, (h * i) / 4);
        graphCtx.lineTo(w, (h * i) / 4);
        graphCtx.stroke();
      }
      const maxE = Math.max(state.initialEnergy, ...state.history.map((e) => e.me), 1);
      drawEnergyLine('pe', '#ffcf5b', maxE, w, h);
      drawEnergyLine('ke', '#3ee68f', maxE, w, h);
      drawEnergyLine('ee', '#ff5a6a', maxE, w, h);
      drawEnergyLine('me', '#c77dff', maxE, w, h);
    }

    function drawEnergyLine(key, color, maxE, w, h) {
      if (state.history.length < 2) return;
      graphCtx.strokeStyle = color;
      graphCtx.lineWidth = key === 'me' ? 2.4 : 1.7;
      graphCtx.beginPath();
      state.history.forEach((e, i) => {
        const x = (w * i) / Math.max(1, state.history.length - 1);
        const y = h - (e[key] / maxE) * (h - 10) - 5;
        if (i === 0) graphCtx.moveTo(x, y);
        else graphCtx.lineTo(x, y);
      });
      graphCtx.stroke();
    }

    function loop(ts) {
      if (!lastTs) lastTs = ts;
      const dt = Math.min(DT_LIMIT, (ts - lastTs) / 1000);
      lastTs = ts;
      currentDt = dt;
      step(dt);
      draw();
      raf = requestAnimationFrame(loop);
    }

    function yToPx(y) {
      return view.top + y * view.scale;
    }

    function toScreen(x, y) {
      return { x, y: yToPx(y) };
    }

    function roundRect(context, x, y, w, h, r) {
      context.beginPath();
      context.moveTo(x + r, y);
      context.arcTo(x + w, y, x + w, y + h, r);
      context.arcTo(x + w, y + h, x, y + h, r);
      context.arcTo(x, y + h, x, y, r);
      context.arcTo(x, y, x + w, y, r);
      context.closePath();
    }

    function fract(n) {
      return n - Math.floor(n);
    }

    function calcPrediction() {
      const k = state.k;
      const L = state.restLength;
      const m = MASS;
      if (k <= 0) return { valid: false, label: '탄성 없음 → 추락', clearance: -999, yLowest: GROUND_Y };
      // 에너지 보존: ½k·x² - mg·x - mg(L-DROP_Y) = 0  (x = 최저점 연장량)
      const disc = m * m * G * G + 2 * k * m * G * (L - DROP_Y);
      if (disc < 0) return { valid: true, label: 'k 너무 강함', clearance: Infinity, yLowest: DROP_Y };
      const ext = (m * G + Math.sqrt(disc)) / k;
      const yLowest = L + ext;
      const clearance = GROUND_Y - yLowest - BODY_HEIGHT;
      const cl = CLIENTS[state.round];
      let label, color;
      if (clearance < 0) { label = `연못 추락 예상`; color = 'var(--red)'; }
      else if (clearance >= cl.minClearance) { label = `${formatDistance(clearance)}`; color = 'var(--green)'; }
      else { label = `${formatDistance(clearance)}`; color = 'var(--yellow)'; }
      return { valid: true, label, color, clearance, yLowest };
    }

    function updatePredictionMarker() {
      const pred = calcPrediction();
      const el = document.getElementById('predict-clearance');
      if (el) {
        el.textContent = pred.valid ? pred.label : pred.label;
        el.style.color = pred.color || 'var(--muted)';
      }
      if (!T3.predMarker) return;
      if (!pred.valid || pred.clearance === Infinity || pred.yLowest >= GROUND_Y) {
        T3.predMarker.visible = false;
      } else {
        T3.predMarker.visible = true;
        T3.predMarker.position.set(0, -pred.yLowest, 0);
      }
    }

    function createThreePredMarker() {
      const three = window.THREE;
      const grp = new three.Group();
      const ring = new three.Mesh(
        new three.TorusGeometry(5, 0.18, 8, 48),
        new three.MeshBasicMaterial({ color: 0x30d5ff, transparent: true, opacity: 0.80 })
      );
      ring.rotation.x = -Math.PI / 2;
      grp.add(ring);
      const disc = new three.Mesh(
        new three.CircleGeometry(5, 48),
        new three.MeshBasicMaterial({ color: 0x30d5ff, transparent: true, opacity: 0.06, side: three.DoubleSide })
      );
      disc.rotation.x = -Math.PI / 2;
      grp.add(disc);
      // 십자선
      const lineMat = new three.MeshBasicMaterial({ color: 0x30d5ff, transparent: true, opacity: 0.50 });
      for (const rot of [0, Math.PI / 2]) {
        const bar = new three.Mesh(new three.PlaneGeometry(10, 0.10), lineMat);
        bar.rotation.x = -Math.PI / 2;
        bar.rotation.z = rot;
        grp.add(bar);
      }
      grp.visible = false;
      T3.predMarker = grp;
      T3.scene.add(grp);
      updatePredictionMarker();
    }

    function togglePracticeMode() {
      setPracticeMode(!state.practiceMode, true);
    }

    function calcScore(roundIdx, clearance, maxG, attempts) {
      const cl = CLIENTS[roundIdx];
      const clearDelta = Math.abs(clearance - (cl.minClearance + 2.0));
      const clearScore = Math.max(0, Math.round(167 - clearDelta * 27));
      const gDelta = Math.abs(maxG - cl.idealG);
      const gScore = Math.max(0, Math.round(167 - gDelta * 40));
      const penalty = Math.max(0, (attempts - 1) * 27);
      const total = Math.max(0, Math.min(333, clearScore + gScore - penalty));
      return { clearScore, gScore, penalty, total };
    }

    function showRoundEnd(sc) {
      const isLast = state.round === CLIENTS.length - 1;
      ui.reKicker.textContent = `라운드 ${state.round + 1} / ${CLIENTS.length} 완료`;
      ui.reHeadline.textContent = `${CLIENTS[state.round].name} 설계 성공!`;
      ui.reScoreNum.textContent = sc.total;
      const rows = [
        `<div class="re-row"><span>📍 정밀도 점수</span><span>${sc.clearScore}점</span></div>`,
        `<div class="re-row"><span>⚡ G 점수</span><span>${sc.gScore}점</span></div>`,
        sc.penalty > 0 ? `<div class="re-row penalty"><span>🔁 재시도 패널티</span><span>-${sc.penalty}점</span></div>` : '',
      ].filter(Boolean).join('');
      ui.reBreakdown.innerHTML = rows;
      const accum = state.roundScores.reduce((s, r) => s + (r ? r.total : 0), 0);
      ui.reAccum.textContent = `누적 ${accum} / ${(state.round + 1) * 333}점`;
      if (isLast) {
        ui.reNextBtn.textContent = '완료 →';
        ui.reRetryBtn.style.display = '';
        showFinalGrade();
      } else {
        ui.reNextBtn.textContent = `다음 손님 (${CLIENTS[state.round + 1].name}) →`;
        ui.reRetryBtn.style.display = 'none';
        ui.reGradeRow.hidden = true;
      }
      ui.start.disabled = true;
      ui.roundEnd.classList.add('show');
    }

    function showFinalGrade() {
      const total = state.roundScores.reduce((s, r) => s + (r ? r.total : 0), 0);
      let grade, color;
      if (total >= 250)      { grade = 'S'; color = 'var(--yellow)'; }
      else if (total >= 210) { grade = 'A'; color = 'var(--green)'; }
      else if (total >= 160) { grade = 'B'; color = 'var(--blue)'; }
      else if (total >= 110) { grade = 'C'; color = 'var(--muted)'; }
      else                   { grade = 'D'; color = 'var(--red)'; }
      ui.reGrade.textContent = grade;
      ui.reGrade.style.color = color;
      ui.reGradeLabel.textContent = `합계 ${total} / 300점`;
      let tableHtml = '';
      state.roundScores.forEach((sc, i) => {
        if (!sc) return;
        tableHtml += `<tr>
          <td>${CLIENTS[i].name}</td>
          <td>${sc.clearScore}</td>
          <td>${sc.gScore}</td>
          <td>${sc.penalty > 0 ? '-' + sc.penalty : '0'}</td>
          <td>${sc.total}</td>
        </tr>`;
      });
      ui.reGradeTable.innerHTML = tableHtml;
      ui.reGradeRow.hidden = false;
    }

    function goNextRound() {
      if (state.round < CLIENTS.length - 1) {
        state.round += 1;
        resetRun();
      } else {
        state.allDone = true;
        ui.roundEnd.classList.remove('show');
        finishMissionAndReturn();
      }
    }

    function finishMissionAndReturn() {
      const totalScore = Math.round(state.roundScores.reduce((s, r) => s + (r ? r.total : 0), 0));
      const missionScore = ElabProgress.clampScore(totalScore);
      ElabProgress.saveMission(3, 'clear', missionScore);
      if (missionScore >= 900 && window.ElabBadges) window.ElabBadges.unlockWithToast('precision');
      MissionUI.askCoachQuestion({
        speaker: '코치 확인 퀴즈',
        question: '번지줄이 최대로 늘어난 순간, 점퍼 속도는 거의 0이야. 이 순간 에너지 상태는?',
        choices: [
          { label: 'Ep와 Ek 대부분이 탄성에너지(Es = ½kx²)로 전환된 상태', correct: true,
            feedback: '맞아. 속도≈0이면 Ek≈0이고 높이도 낮아져 Ep도 줄었어. 그 에너지가 모두 줄의 탄성에너지로 저장된 거야.' },
          { label: 'Ek가 최대이고 Es = 0인 상태', correct: false,
            feedback: '줄이 최대로 늘어난 순간은 속도가 가장 느릴 때야. Ek가 아닌 Es가 최대야.' },
          { label: '세 에너지 Ep, Ek, Es가 각각 균등하게 나뉜 상태', correct: false,
            feedback: '에너지 배분은 물리 조건에 따라 달라. 이 순간은 Es가 압도적으로 크고 Ek는 거의 0이야.' }
        ],
        continueLabel: '미션 완료 →'
      }).then(() => {
        MissionUI.showClearAndReturn({
          score: missionScore,
          formula: 'Es = ½kx²',
          desc: '탄성 위치에너지 - 늘어난 줄에 에너지가 저장된다'
        });
      });
    }

    let _lastClientRound = -1;
    function updateClientCard() {
      const cl = CLIENTS[state.round];
      const panelLeft = document.querySelector('.panel-left');
      if (panelLeft && state.round !== _lastClientRound) {
        panelLeft.style.animation = 'none';
        panelLeft.offsetHeight;
        panelLeft.style.animation = 'clientFadeIn .35s ease both';
        _lastClientRound = state.round;
      }
      ui.ccAvatar.textContent = cl.avatar;
      ui.ccName.textContent = cl.name;
      ui.ccAge.textContent = `${cl.age}세 · ${cl.mass} kg`;
      ui.ccTag.textContent = cl.tag;
      ui.ccTag.style.background = cl.tagColor;
      ui.ccQuote.textContent = cl.desc;
      ui.roundDots.forEach((dot, i) => {
        dot.className = 'rd';
        if (i < state.round) dot.classList.add('rd-done');
        else if (i === state.round) dot.classList.add('rd-active');
      });
    }

    ui.kInput.addEventListener('input', () => { resetRun(); updateStartBtn(); markTutorialInput('k'); });
    ui.lInput.addEventListener('input', () => { resetRun(); updateStartBtn(); markTutorialInput('l'); });
    ui.dragInput.addEventListener('change', resetRun);
    ui.start.addEventListener('click', startRun);
    ui.reset.addEventListener('click', resetRun);
    ui.modalAgain.addEventListener('click', resetRun);
    ui.modalClose.addEventListener('click', () => {
      ui.modal.classList.remove('show');
      // Physics is already running in 'observing' mode from finishRun — no action needed
      // The energy graph will keep updating live
    });
    ui.replaySlider.addEventListener('input', (event) => applyReplayFrame(event.target.value));
    function retryAll() {
      state.round = 0;
      state.attempts = [0, 0, 0];
      state.roundScores = [null, null, null];
      state.allDone = false;
      ui.roundEnd.classList.remove('show');
      resetRun();
      setEvent('전체 재도전! 더 높은 점수를 노려보세요.');
    }

    ui.reNextBtn.addEventListener('click', goNextRound);
    ui.reRetryBtn.addEventListener('click', retryAll);
    document.getElementById('practice-btn').addEventListener('click', togglePracticeMode);
    ui.tutorialReplay?.addEventListener('click', startBungeeTutorial);
    ui.tutorialNext?.addEventListener('click', nextTutorialStep);
    ui.tutorialSkip?.addEventListener('click', finishTutorial);

    window.addEventListener('resize', resize);
    resize();
    resetRun();
    raf = requestAnimationFrame(loop);
