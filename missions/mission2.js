const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        const fSlider = document.getElementById('f-slider');
        const fDisplay = document.getElementById('f-display');
        const btnReset = document.getElementById('btn-reset');
        const statV = document.getElementById('stat-v');
        const statMu = document.getElementById('stat-mu');
        const statDist = document.getElementById('stat-dist');
        const barK = document.getElementById('bar-k');
        const barQ = document.getElementById('bar-q');
        const valK = document.getElementById('val-k');
        const valQ = document.getElementById('val-q');
        const valE0 = document.getElementById('val-e0');
        const statusInd = document.getElementById('status-indicator');
        const toggleVector = document.getElementById('toggle-vector');
        const flashOverlay = document.getElementById('flash-overlay');
        const resultMsg = document.getElementById('result-message');
        const sweepHint = document.getElementById('sweep-hint');
        const gameRound = document.getElementById('game-round');
        const gameScore = document.getElementById('game-score');
        const iqBanner = document.getElementById('ice-quality-banner');
        const iqEmoji = document.getElementById('iq-emoji');
        const iqLabel = document.getElementById('iq-label');
        const iqMu = document.getElementById('iq-mu');
        const iqRound = document.getElementById('iq-round');
        const shotScore = document.getElementById('shot-score');
        const bestScore = document.getElementById('best-score');
        const progressTrack = document.querySelector('.distance-track');
        const progressFill = document.getElementById('progress-fill');
        const progressStone = document.getElementById('progress-stone');
        const progressPercent = document.getElementById('progress-percent');
        const progressCurrent = document.getElementById('progress-current');
        const progressTotal = document.getElementById('progress-total');

        const ICE_QUALITIES = [
            { label: '최상급', emoji: '💎', mu: 0.008, color: '#60a5fa', desc: '완벽히 관리된 올림픽 빙판' },
            { label: '양호',   emoji: '🟢', mu: 0.015, color: '#34d399', desc: '가볍게 사용된 빙판' },
            { label: '보통',   emoji: '🟡', mu: 0.025, color: '#fbbf24', desc: '일반 경기 환경' },
            { label: '거친',   emoji: '🟠', mu: 0.040, color: '#f97316', desc: '흠집이 많은 불량 빙판' },
            { label: '최악',   emoji: '🔴', mu: 0.060, color: '#ef4444', desc: '눈이 쌓인 극불량 빙판' },
        ];

        const PHYSICS = {
            g: 9.81,
            m: 20.0,
            mu_base: ICE_QUALITIES[0].mu,
            mu_sweep_min: 0.002,
            overshootLimit: 3.2,
            releaseLine: 10,   // 투구선: 이 x 좌표 이후 힘 적용 불가
            scale: 120 // 2배 확대
        };

        const GAME = {
            totalRounds: 5,
            round: 1,
            score: 0,
            lastShotScore: 0,
            finished: false,
            best: Number(localStorage.getItem('curlingWorkEnergyBest') || 0) || 0,
            roundHistory: []
        };

        let state = {
            phase: 'ready',
            stone: { x: 2, v: 0, radius: 0.15 }, // 시작 위치를 2m 지점으로 설정
            house: { x: 32, y: 0 },
            energy: { initialK: 0, currentK: 0, lossQ: 0 },
            isSweeping: false,
            cameraX: 0,
            sweepSpeed: 0,
            lastPointer: { x: 0, y: 0, time: 0 },
            lastTime: 0,
            currentMu: PHYSICS.mu_base,
            targetK: 0,
            displayMax: 1,
            energyHistory: []
        };

        let _etGraph = null;
        let _etCtx = null;
        let _etW = 0;
        let _etH = 0;
        function initEnergyTimeGraph() {
            _etGraph = document.getElementById('energy-time-graph');
            if (!_etGraph) return;
            _etCtx = _etGraph.getContext('2d');
            const dpr = Math.max(1, window.devicePixelRatio || 1);
            const rect = _etGraph.getBoundingClientRect();
            _etW = rect.width;
            _etH = rect.height;
            _etGraph.width = Math.floor(_etW * dpr);
            _etGraph.height = Math.floor(_etH * dpr);
            _etCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        function drawEnergyTimeGraph() {
            if (!_etCtx || !_etW) return;
            const w = _etW;
            const h = _etH;
            _etCtx.clearRect(0, 0, w, h);
            _etCtx.fillStyle = 'rgba(0,0,0,0.10)';
            _etCtx.fillRect(0, 0, w, h);
            // 격자
            _etCtx.strokeStyle = 'rgba(0,0,0,0.10)';
            _etCtx.lineWidth = 1;
            for (let i = 1; i < 3; i++) {
                _etCtx.beginPath();
                _etCtx.moveTo(0, (h * i) / 3);
                _etCtx.lineTo(w, (h * i) / 3);
                _etCtx.stroke();
            }
            const hist = state.energyHistory;
            if (hist.length < 2) return;
            const maxE = hist.reduce((m, e) => Math.max(m, e.k + e.q), 1);
            // K 선 (파랑)
            _etCtx.strokeStyle = '#2c8bff';
            _etCtx.lineWidth = 2;
            _etCtx.beginPath();
            hist.forEach((e, i) => {
                const x = (w * i) / (hist.length - 1);
                const y = h - (e.k / maxE) * (h - 6) - 3;
                i === 0 ? _etCtx.moveTo(x, y) : _etCtx.lineTo(x, y);
            });
            _etCtx.stroke();
            // Q 선 (빨강)
            _etCtx.strokeStyle = '#e74c3c';
            _etCtx.lineWidth = 2;
            _etCtx.beginPath();
            hist.forEach((e, i) => {
                const x = (w * i) / (hist.length - 1);
                const y = h - (e.q / maxE) * (h - 6) - 3;
                i === 0 ? _etCtx.moveTo(x, y) : _etCtx.lineTo(x, y);
            });
            _etCtx.stroke();
        }

        let particles = [];
        let iceScars = [];

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            state.house.y = canvas.height / 2;

            const isMobileLandscape = window.innerHeight <= 500;
            const scale = isMobileLandscape
                ? 1
                : Math.max(0.6, Math.min(1, window.innerWidth / 1280, window.innerHeight / 720));
            document.querySelectorAll('.panel').forEach(el => el.style.zoom = scale.toFixed(3));
        }
        window.addEventListener('resize', resize);

        fSlider.addEventListener('input', (e) => {
            fDisplay.innerText = e.target.value;
        });

        btnReset.addEventListener('click', handleResetClick);

        function handleResetClick() {
            if (GAME.finished) {
                startNewGame();
                return;
            }

            if (state.phase === 'finished') {
                GAME.round += 1;
                GAME.lastShotScore = 0;
            }

            resetGame();
        }

        function renderRoundHistory() {
            const el = document.getElementById('round-history');
            const colorMap = { PERFECT: '#ffd700', GREAT: '#86efac', GOOD: '#93c5fd', OK: '#d1d5db', NEAR: '#9ca3af', MISS: '#ef4444' };
            el.innerHTML = GAME.roundHistory.map(h => {
                const iq = ICE_QUALITIES[h.round - 1] || ICE_QUALITIES[ICE_QUALITIES.length - 1];
                return `<div style="display:flex;justify-content:space-between;align-items:center;font-size:0.75rem;padding:3px 0;border-bottom:1px solid rgba(0,0,0,0.06);">
                    <span title="${iq.label}">${iq.emoji} R${h.round}</span>
                    <span style="font-weight:700;color:${colorMap[h.label] || '#333'}">${h.label}</span>
                    <span style="font-weight:800;color:#005eb8;">+${h.earned}</span>
                </div>`;
            }).join('');
        }

        function startNewGame() {
            GAME.round = 1;
            GAME.score = 0;
            GAME.lastShotScore = 0;
            GAME.finished = false;
            GAME.roundHistory = [];
            renderRoundHistory();
            resetGame();
        }

        function updateGameUI() {
            const roundIdx = Math.min(GAME.round, GAME.totalRounds) - 1;
            const iq = ICE_QUALITIES[roundIdx];
            gameRound.innerText = `${Math.min(GAME.round, GAME.totalRounds)}/${GAME.totalRounds}`;
            gameScore.innerText = GAME.score;
            shotScore.innerText = GAME.lastShotScore;
            bestScore.innerText = GAME.best;
            iqEmoji.textContent = iq.emoji;
            iqLabel.textContent = `${iq.label} — ${iq.desc}`;
            iqLabel.style.color = iq.color;
            iqMu.textContent = iq.mu.toFixed(3);
            iqMu.style.color = iq.color;
            iqBanner.style.borderColor = iq.color + '66';
            iqBanner.style.background = iq.color + '1a';
            iqRound.textContent = Math.min(GAME.round, GAME.totalRounds);

            // 힌트 박스 업데이트 (투구선 기준 남은 거리로 계산)
            const d = state.house.x - PHYSICS.releaseLine; // 투구선~하우스 거리
            const kMin = Math.round(iq.mu * PHYSICS.m * PHYSICS.g * d);
            const vMin = Math.sqrt(2 * kMin / PHYSICS.m).toFixed(1);
            document.getElementById('hint-mu-val').textContent = iq.mu.toFixed(3);
            document.getElementById('hint-kmin').textContent = kMin + ' J';
            document.getElementById('hint-vmin').textContent = vMin + ' m/s';
            const tips = [
                '최상급 빙판 — 조금만 밀어도 멀리 가요. 투구선 훨씬 전에 손을 떼세요!',
                '양호한 빙판. 투구선 중간쯤에서 손을 떼면 좋아요.',
                '보통 빙판. 투구선 가까이에서 손을 떼야 타겟에 도달해요.',
                '거친 빙판! F를 높이고 투구선 직전까지 눌러야 해요.',
                '최악의 빙판 — 최대 F로 투구선까지 끝까지 눌러야 해요.',
            ];
            document.getElementById('hint-tip').textContent = tips[roundIdx];
        }

        function updateProgressUI() {
            const startX = 2;
            const total = state.house.x - startX;
            const current = Math.max(0, state.stone.x - startX);
            const progress = Math.max(0, Math.min(1, current / total));
            const trackWidth = progressTrack.clientWidth || 1;
            const startCenter = 24;
            const targetCenter = Math.max(startCenter, trackWidth - 38);
            const stoneLeft = startCenter + (targetCenter - startCenter) * progress;

            progressFill.style.width = `${stoneLeft}px`;
            progressStone.style.left = `${stoneLeft}px`;
            progressPercent.innerText = `${Math.round(progress * 100)}%`;
            progressCurrent.innerText = `${Math.min(state.stone.x, state.house.x).toFixed(2)} m`;
            progressTotal.innerText = `${state.house.x.toFixed(2)} m`;
        }

        function calculateShotScore(dist) {
            if (dist < 0.6)  return 200;  // PERFECT — 버튼+여유
            if (dist < 1.22) return 160;  // GREAT   — 4ft 링
            if (dist < 1.83) return 120;  // GOOD    — 8ft 링
            if (dist < 2.5)  return 80;   // OK
            if (dist < 3.2)  return 30;   // NEAR
            return 0;
        }

        function resetGame() {
            const roundIdx = Math.min(GAME.round, GAME.totalRounds) - 1;
            PHYSICS.mu_base = ICE_QUALITIES[roundIdx].mu;

            const d = 30; // house.x(32) - start(2)
            state.targetK = PHYSICS.mu_base * PHYSICS.m * PHYSICS.g * d;
            state.displayMax = state.targetK * 1.5;

            state.phase = 'ready';
            state.stone.x = 2; // 시작선 조금 앞으로 리셋
            state.stone.v = 0;
            state.energy.initialK = 0;
            state.energy.currentK = 0;
            state.energy.lossQ = 0;
            state.cameraX = 0;
            state.currentMu = PHYSICS.mu_base;
            state.energyHistory = [];
            particles = [];
            iceScars = [];

            fSlider.disabled = false;
            btnReset.innerText = 'Reset Shot';
            statusInd.innerText = '● READY';
            statusInd.style.color = '#e32636';
            resultMsg.classList.remove('show-msg');
            sweepHint.style.opacity = '0';
            sweepHint.innerText = '스톤 앞쪽 빙판을 문질러 스위핑하세요!';

            updateGameUI();
            updateUI();
            draw();
        }

        // 마우스를 누르면 무조건 투구 시작 (Pushing)
        function handlePointerDown(e) {
            if (state.phase === 'ready') {
                state.phase = 'pushing';
                state.lastTime = performance.now();

                statusInd.innerText = '● PUSHING...';
                statusInd.style.color = '#ff9900';
                fSlider.disabled = true;

                requestAnimationFrame(gameLoop);
            }
            // 이미 움직이는 중이면 스위핑으로 넘김
            else if (state.phase === 'moving') {
                handlePointerMove(e);
            }
        }

        function handlePointerMove(e) {
            if (state.phase !== 'moving') return;

            let clientX = e.touches ? e.touches[0].clientX : e.clientX;
            let clientY = e.touches ? e.touches[0].clientY : e.clientY;
            let currentTime = performance.now();

            const stoneScreenX = state.stone.x * PHYSICS.scale - state.cameraX;

            if (clientX > stoneScreenX + 5 && clientX < stoneScreenX + 180 && Math.abs(clientY - state.house.y) < 130) {
                state.isSweeping = true;
                sweepHint.style.opacity = '0';

                if (state.lastPointer.time > 0) {
                    let dx = clientX - state.lastPointer.x;
                    let dy = clientY - state.lastPointer.y;
                    let dt = currentTime - state.lastPointer.time;
                    if (dt > 0) {
                        state.sweepSpeed = Math.sqrt(dx * dx + dy * dy) / dt;
                    }
                }

                state.lastPointer = { x: clientX, y: clientY, time: currentTime };
                generateParticles(clientX, clientY);
            } else {
                state.isSweeping = false;
                state.sweepSpeed = 0;
            }
        }

        function handlePointerUp() {
            if (state.phase === 'pushing') {
                state.phase = 'moving';

                // 손을 뗀 순간 축적된 에너지를 초기 역학적 에너지로 세팅
                state.energy.initialK = 0.5 * PHYSICS.m * state.stone.v * state.stone.v;
                // targetK를 투구 시점 값으로 고정 (이후 updatePhysics에서 갱신 안 됨)
                state.targetK = PHYSICS.mu_base * PHYSICS.m * PHYSICS.g * Math.max(0, state.house.x - state.stone.x);

                statusInd.innerText = '● IN PLAY';
                statusInd.style.color = '#005eb8';
                sweepHint.style.opacity = '1';
            }

            state.isSweeping = false;
            state.sweepSpeed = 0;
            state.lastPointer.time = 0;
        }

        canvas.addEventListener('mousedown', handlePointerDown);
        canvas.addEventListener('touchstart', handlePointerDown, { passive: true });
        canvas.addEventListener('mousemove', handlePointerMove);
        canvas.addEventListener('touchmove', handlePointerMove, { passive: true });
        window.addEventListener('mouseup', handlePointerUp);
        window.addEventListener('touchend', handlePointerUp);

        function generateParticles(x, y) {
            const count = state.isSweeping ? 8 : 3;
            for (let i = 0; i < count; i++) {
                particles.push({
                    x: x + state.cameraX + (Math.random() - 0.5) * 95,
                    y: y + (Math.random() - 0.5) * 70,
                    vx: (Math.random() - 0.5) * 70 - state.stone.v * 8,
                    vy: (Math.random() - 0.5) * 40 - 18,
                    size: 1.5 + Math.random() * 3.5,
                    life: 1.0
                });
            }
        }

        function gameLoop(timestamp) {
            const dt = (timestamp - state.lastTime) / 1000;
            state.lastTime = timestamp;

            updatePhysics(dt);
            updateUI();
            draw();

            if (state.phase === 'pushing' || state.phase === 'moving') {
                requestAnimationFrame(gameLoop);
            }
        }

        function updatePhysics(dt) {
            if (dt > 0.1) return;
            if (state.phase !== 'pushing' && state.phase !== 'moving') return;

            state.sweepSpeed = Math.max(0, state.sweepSpeed - 15 * dt);

            let targetMu = PHYSICS.mu_base;
            if (state.isSweeping && state.phase === 'moving') {
                let sweepFactor = Math.min(state.sweepSpeed / 1.0, 1) ** 1.5;
                targetMu = PHYSICS.mu_base - (PHYSICS.mu_base - PHYSICS.mu_sweep_min) * sweepFactor;
            }
            state.currentMu += (targetMu - state.currentMu) * (8 * dt);

            const frictionA = -state.currentMu * PHYSICS.g;
            let a = frictionA;

            if (state.phase === 'pushing') {
                const pushForce = parseFloat(fSlider.value);
                const pushA = pushForce / PHYSICS.m;

                a = pushA + frictionA;

                if (state.stone.v === 0 && a < 0) {
                    a = 0;
                }
            }

            state.stone.v += a * dt;

            if (state.stone.v <= 0 && state.phase === 'moving') {
                state.stone.v = 0;
                finishShot();
            } else if (state.stone.v < 0 && state.phase === 'pushing') {
                state.stone.v = 0;
            } else {
                state.stone.x += state.stone.v * dt;
            }

            if (state.phase === 'moving' && state.stone.v > 0.12) {
                iceScars.push({
                    x: state.stone.x * PHYSICS.scale,
                    y: state.house.y + (Math.random() - 0.5) * 34,
                    len: 22 + Math.min(90, state.stone.v * 18),
                    wobble: (Math.random() - 0.5) * 1.2,
                    life: 1
                });
                if (iceScars.length > 130) iceScars.shift();
            }

            if (state.phase === 'moving' && state.stone.x > state.house.x + PHYSICS.overshootLimit) {
                state.stone.v = 0;
                finishShot({ forcedMiss: true, reason: 'TOO FAR' });
                return;
            }

            state.energy.currentK = 0.5 * PHYSICS.m * state.stone.v * state.stone.v;

            // 에너지 히스토리 기록 (최대 200 프레임)
            if (state.phase === 'pushing' || state.phase === 'moving') {
                state.energyHistory.push({ k: state.energy.currentK, q: state.energy.lossQ });
                if (state.energyHistory.length > 200) state.energyHistory.shift();
            }

            if (state.phase === 'pushing') {
                // 현재 위치에서 타겟까지 남은 거리 기반으로 목표 K 실시간 갱신
                const remaining = Math.max(0, state.house.x - state.stone.x);
                state.targetK = PHYSICS.mu_base * PHYSICS.m * PHYSICS.g * remaining;

                // 투구선 초과 시 자동 투구
                if (state.stone.x >= PHYSICS.releaseLine) {
                    handlePointerUp();
                }
            }

            if (state.phase === 'moving') {
                state.energy.lossQ = Math.max(0, state.energy.initialK - state.energy.currentK);
            } else {
                state.energy.lossQ = 0;
            }

            const targetCameraX = (state.stone.x * PHYSICS.scale) - (canvas.width / 3);
            state.cameraX = Math.max(0, targetCameraX);

            for (let i = particles.length - 1; i >= 0; i--) {
                let p = particles[i];
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.life -= dt * 2;
                if (p.life <= 0) particles.splice(i, 1);
            }

            for (let i = iceScars.length - 1; i >= 0; i--) {
                iceScars[i].life -= dt * 0.45;
                if (iceScars[i].life <= 0) iceScars.splice(i, 1);
            }
        }

        function updateUI() {
            statV.innerText = state.stone.v.toFixed(2);
            statMu.innerText = (state.currentMu * PHYSICS.m * PHYSICS.g).toFixed(1);
            statMu.style.color = state.isSweeping ? '#e32636' : '#333';

            const distToTarget = state.house.x - state.stone.x;
            statDist.innerText = Math.max(0, distToTarget).toFixed(2);
            updateProgressUI();
            updateGameUI();

            // displayMax는 라운드 시작 시 targetK*1.5로 고정 — K가 초과하면 자동 확장
            if (state.energy.currentK > state.displayMax) {
                state.displayMax = state.energy.currentK * 1.3;
            }
            const scale = state.displayMax;

            const kPercent = (state.energy.currentK / scale) * 100;
            const qPercent = (state.energy.lossQ / scale) * 100;
            barK.style.width = `${kPercent}%`;
            barQ.style.width = `${qPercent}%`;

            const barLabelEl = document.getElementById('bar-label-text');
            if (state.phase === 'moving' || state.phase === 'finished') {
                barLabelEl.textContent = 'K + Q = E₀ (초기 에너지)';
                valK.innerText = `${state.energy.currentK.toFixed(1)} J`;
                valQ.innerText = `${state.energy.lossQ.toFixed(1)} J`;
                valE0.innerText = `${state.energy.initialK.toFixed(1)} J`;
            } else {
                barLabelEl.textContent = 'K (현재 누적) — 황선을 넘겨라';
                valK.innerText = `${state.energy.currentK.toFixed(1)} J`;
                valQ.innerText = `0 J`;
                valE0.innerText = `목표: ${Math.round(state.targetK)} J+`;
            }

            // 목표 K₀ 기준선 마커 — scale이 고정이므로 처음부터 항상 표시
            const kMinMarker = document.getElementById('kmin-marker');
            const kMinLbl = document.getElementById('kmin-label');
            const markerPct = Math.min(99, (state.targetK / scale) * 100);
            kMinMarker.style.display = 'block';
            kMinMarker.style.left = `${markerPct}%`;
            kMinLbl.style.display = 'block';
            kMinLbl.style.left = `${markerPct}%`;

            drawEnergyTimeGraph();
        }


        function drawSheetBoards(worldEnd, hy, sheetHalfWidth) {
            const topY = hy - sheetHalfWidth - 58;
            const bottomY = hy + sheetHalfWidth + 12;
            const boardGrad = ctx.createLinearGradient(0, topY, 0, topY + 46);
            boardGrad.addColorStop(0, '#ffffff');
            boardGrad.addColorStop(1, '#dce9f4');

            ctx.fillStyle = boardGrad;
            ctx.fillRect(-200, topY, worldEnd + 400, 44);
            ctx.fillRect(-200, bottomY, worldEnd + 400, 44);

            const stripeColors = ['#1d4ed8', '#dc2626', '#eab308', '#059669'];
            for (let x = -120; x < worldEnd + 200; x += 170) {
                ctx.fillStyle = stripeColors[Math.abs(Math.floor(x / 170)) % stripeColors.length];
                ctx.fillRect(x, topY + 14, 98, 7);
                ctx.fillRect(x + 42, bottomY + 15, 98, 7);
            }

            ctx.strokeStyle = 'rgba(15, 23, 42, 0.14)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-200, topY + 44);
            ctx.lineTo(worldEnd + 200, topY + 44);
            ctx.moveTo(-200, bottomY);
            ctx.lineTo(worldEnd + 200, bottomY);
            ctx.stroke();
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.save();
            ctx.translate(-state.cameraX, 0);

            const hx = state.house.x * PHYSICS.scale;
            const hy = state.house.y;
            // 컬링장 폭(15ft = 약 4.57m)의 절반 = 2.285m
            const sheetHalfWidth = 2.285 * PHYSICS.scale;
            const worldEnd = state.cameraX + canvas.width + 1000;

            drawSheetBoards(worldEnd, hy, sheetHalfWidth);

            // 1. 빙판 바탕색
            ctx.fillStyle = '#d6ecf8';
            ctx.fillRect(0, hy - sheetHalfWidth, worldEnd, sheetHalfWidth * 2);

            // 2. 얼음 가장자리 서리 효과 (CSS linear-gradient 대체)
            const edgeGrad = ctx.createLinearGradient(0, hy - sheetHalfWidth, 0, hy + sheetHalfWidth);
            edgeGrad.addColorStop(0, 'rgba(255,255,255,0.8)');
            edgeGrad.addColorStop(0.15, 'transparent');
            edgeGrad.addColorStop(0.85, 'transparent');
            edgeGrad.addColorStop(1, 'rgba(255,255,255,0.8)');
            ctx.fillStyle = edgeGrad;
            ctx.fillRect(0, hy - sheetHalfWidth, state.cameraX + canvas.width + 1000, sheetHalfWidth * 2);

            // 3. 빙판 테두리선 (CSS #b0c4de)
            ctx.strokeStyle = '#b0c4de';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, hy - sheetHalfWidth); ctx.lineTo(state.cameraX + canvas.width + 1000, hy - sheetHalfWidth);
            ctx.moveTo(0, hy + sheetHalfWidth); ctx.lineTo(state.cameraX + canvas.width + 1000, hy + sheetHalfWidth);
            ctx.stroke();

            // 4. 센터 라인 (CSS rgba(0,0,0,0.35))
            ctx.strokeStyle = 'rgba(0,0,0,0.35)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, hy); ctx.lineTo(state.cameraX + canvas.width + 1000, hy);
            ctx.stroke();

            // 5. 하우스 (과녁) - 작성하신 색상과 투명도 완벽 적용
            const drawHouse = (x, y) => {
                // 12ft (블루)
                ctx.fillStyle = 'rgba(15, 60, 180, 0.85)';
                ctx.beginPath(); ctx.arc(x, y, 1.83 * PHYSICS.scale, 0, Math.PI * 2); ctx.fill();
                // 8ft (화이트)
                ctx.fillStyle = 'rgba(245, 245, 245, 0.85)';
                ctx.beginPath(); ctx.arc(x, y, 1.22 * PHYSICS.scale, 0, Math.PI * 2); ctx.fill();
                // 4ft (레드)
                ctx.fillStyle = 'rgba(210, 30, 30, 0.85)';
                ctx.beginPath(); ctx.arc(x, y, 0.61 * PHYSICS.scale, 0, Math.PI * 2); ctx.fill();
                // 1ft (버튼)
                ctx.fillStyle = 'rgba(245, 245, 245, 0.85)';
                ctx.beginPath(); ctx.arc(x, y, 0.15 * PHYSICS.scale, 0, Math.PI * 2); ctx.fill();
            };

            drawHouse(hx, hy); // 타겟 하우스
            // 출발 지점 하우스 (114ft 앞)
            drawHouse(hx - (34.75 * PHYSICS.scale), hy);

            // 6. 수직 라인들

            // 투구선 (Release Line) — 이 선을 지나면 자동 투구
            const releaseLineX = PHYSICS.releaseLine * PHYSICS.scale;
            const nearRelease = state.phase === 'pushing' && state.stone.x >= PHYSICS.releaseLine - 2;
            const releaseAlpha = nearRelease ? 0.95 : 0.65;
            const releaseColor = nearRelease ? `rgba(220,60,60,${releaseAlpha})` : `rgba(230,140,0,${releaseAlpha})`;
            ctx.strokeStyle = releaseColor;
            ctx.lineWidth = nearRelease ? 5 : 3;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(releaseLineX, hy - sheetHalfWidth - 10);
            ctx.lineTo(releaseLineX, hy + sheetHalfWidth + 10);
            ctx.stroke();
            // 투구선 레이블
            ctx.save();
            ctx.fillStyle = releaseColor;
            ctx.font = `bold ${nearRelease ? 15 : 13}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText('투구선', releaseLineX, hy - sheetHalfWidth - 20);
            ctx.restore();

            // Tee Line
            ctx.strokeStyle = 'rgba(0,0,0,0.35)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(hx, hy - sheetHalfWidth); ctx.lineTo(hx, hy + sheetHalfWidth);
            ctx.stroke();

            // Back Line
            const backLineX = hx + (1.83 * PHYSICS.scale);
            ctx.beginPath();
            ctx.moveTo(backLineX, hy - sheetHalfWidth); ctx.lineTo(backLineX, hy + sheetHalfWidth);
            ctx.stroke();

            // Target Hog Line (붉은 선)
            const hogLineX = hx - (6.4 * PHYSICS.scale);
            ctx.strokeStyle = 'rgba(200, 30, 30, 0.5)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(hogLineX, hy - sheetHalfWidth); ctx.lineTo(hogLineX, hy + sheetHalfWidth);
            ctx.stroke();

            // Start Hog Line
            const startHogLineX = hogLineX - (21.94 * PHYSICS.scale);
            ctx.beginPath();
            ctx.moveTo(startHogLineX, hy - sheetHalfWidth); ctx.lineTo(startHogLineX, hy + sheetHalfWidth);
            ctx.stroke();

            // 핵 (발판) - CSS .hack 대체
            const hackX = hx - (38 * PHYSICS.scale);
            ctx.fillStyle = 'rgba(30, 30, 30, 0.8)';
            ctx.fillRect(hackX, hy - (0.2 * PHYSICS.scale), 0.3 * PHYSICS.scale, 0.4 * PHYSICS.scale);

            // 거리 마커
            ctx.fillStyle = 'rgba(37, 52, 66, 0.62)';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const markerY = hy + sheetHalfWidth - 24;
            for (let i = 5; i <= state.house.x + 2; i += 5) {
                ctx.fillText(`${i}m`, i * PHYSICS.scale, markerY);
            }
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';

            // 7. Ice Shine (가장 윗 레이어 빛 반사/서리 효과)
            const shineGrad = ctx.createLinearGradient(state.cameraX, 0, state.cameraX + canvas.width, 0);
            shineGrad.addColorStop(0, 'rgba(255,255,255,0)');
            shineGrad.addColorStop(0.3, 'rgba(255,255,255,0)');
            shineGrad.addColorStop(0.5, 'rgba(255,255,255,0.4)'); // 가운데 빛 반사
            shineGrad.addColorStop(0.7, 'rgba(255,255,255,0)');
            shineGrad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = shineGrad;
            ctx.fillRect(state.cameraX, hy - sheetHalfWidth, canvas.width, sheetHalfWidth * 2);

            iceScars.forEach(s => {
                ctx.strokeStyle = `rgba(255,255,255,${0.34 * s.life})`;
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(s.x - s.len, s.y);
                ctx.lineTo(s.x, s.y + s.wobble);
                ctx.stroke();
            });

            // =========================================================
            // 아래부터는 기존의 파티클, 스톤, 벡터 화살표 렌더링입니다.
            // =========================================================
            particles.forEach(p => {
                ctx.fillStyle = `rgba(255, 255, 255, ${p.life})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size || 3, 0, Math.PI * 2);
                ctx.fill();
            });

            const sx = state.stone.x * PHYSICS.scale;
            const sy = hy;
            const sRad = state.stone.radius * PHYSICS.scale * 2.5;

            drawCurlingStone(sx, sy, sRad);

            if (toggleVector.checked) {
                if ((state.phase === 'moving' || state.phase === 'pushing') && state.stone.v > 0) {
                    const fricVectorLen = state.currentMu * 6000;
                    ctx.strokeStyle = '#e32636';
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.moveTo(sx, sy);
                    ctx.lineTo(sx - fricVectorLen, sy);
                    ctx.lineTo(sx - fricVectorLen + 10, sy - 5);
                    ctx.moveTo(sx - fricVectorLen, sy);
                    ctx.lineTo(sx - fricVectorLen + 10, sy + 5);
                    ctx.stroke();

                    ctx.fillStyle = '#e32636';
                    ctx.font = 'bold 16px sans-serif';
                    ctx.fillText(`f_k`, sx - fricVectorLen - 25, sy - 10);
                }

                if (state.phase === 'pushing') {
                    const pushForce = parseFloat(fSlider.value);
                    const pushVectorLen = (pushForce / PHYSICS.m) * 50;
                    ctx.strokeStyle = '#005eb8';
                    ctx.lineWidth = 5;
                    ctx.beginPath();
                    ctx.moveTo(sx, sy);
                    ctx.lineTo(sx + pushVectorLen, sy);
                    ctx.lineTo(sx + pushVectorLen - 12, sy - 6);
                    ctx.moveTo(sx + pushVectorLen, sy);
                    ctx.lineTo(sx + pushVectorLen - 12, sy + 6);
                    ctx.stroke();

                    ctx.fillStyle = '#005eb8';
                    ctx.font = 'bold 18px sans-serif';
                    ctx.fillText(`F`, sx + pushVectorLen + 10, sy - 10);
                }
            }
            ctx.restore();
        }

        function drawCircle(x, y, radius, color) {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        function roundedRectPath(x, y, w, h, r) {
            const radius = Math.min(r, w / 2, h / 2);
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + w - radius, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
            ctx.lineTo(x + w, y + h - radius);
            ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
            ctx.lineTo(x + radius, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
        }

        function drawCurlingStone(x, y, r) {
            ctx.save();

            ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
            ctx.beginPath();
            ctx.ellipse(x + r * 0.12, y + r * 0.14, r * 1.02, r * 0.9, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#9b9d9f';
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#66696b';
            ctx.beginPath();
            ctx.arc(x, y, r * 0.68, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffdf1b';
            ctx.beginPath();
            ctx.arc(x, y, r * 0.38, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#c7a900';
            ctx.beginPath();
            roundedRectPath(x - r * 0.08, y - r * 0.32, r * 0.16, r * 0.64, r * 0.04);
            ctx.fill();

            ctx.restore();
        }

        function finishShot(options = {}) {
            state.phase = 'finished';
            sweepHint.style.opacity = '0';

            const dist = Math.abs(state.stone.x - state.house.x);
            const earned = options.forcedMiss ? 0 : calculateShotScore(dist);
            GAME.lastShotScore = earned;
            GAME.score += earned;

            const label = options.forcedMiss ? 'MISS' : earned >= 200 ? 'PERFECT' : earned >= 160 ? 'GREAT' : earned >= 120 ? 'GOOD' : earned >= 80 ? 'OK' : earned >= 30 ? 'NEAR' : 'MISS';
            GAME.roundHistory.push({ round: GAME.round, label, earned });
            renderRoundHistory();

            if (GAME.score > GAME.best) {
                GAME.best = GAME.score;
                localStorage.setItem('curlingWorkEnergyBest', String(GAME.best));
            }

            updateGameUI();

            if (options.forcedMiss) {
                statusInd.innerText = 'TOO FAR';
                statusInd.style.color = '#7f1d1d';
                resultMsg.innerText = `${options.reason || 'TOO FAR'} +0`;
                resultMsg.style.color = "#fecaca";
                resultMsg.classList.add('show-msg');
            } else if (dist < 0.3) {
                statusInd.innerText = '● EXCELLENT';
                statusInd.style.color = '#e32636';
                flashOverlay.style.opacity = '1';
                setTimeout(() => { flashOverlay.style.opacity = '0'; }, 100);
                resultMsg.innerText = `PERFECT +${earned}`;
                resultMsg.style.color = "#ffd700";
                resultMsg.classList.add('show-msg');
            } else if (dist < 1.83) {
                statusInd.innerText = '● IN HOUSE';
                statusInd.style.color = '#005eb8';
                resultMsg.innerText = `GOOD +${earned}`;
                resultMsg.style.color = "#fff";
                resultMsg.classList.add('show-msg');
            } else {
                statusInd.innerText = '● MISSED';
                statusInd.style.color = '#666';
                resultMsg.innerText = `MISS +${earned}`;
                resultMsg.style.color = "#d1d5db";
                resultMsg.classList.add('show-msg');
            }

            if (GAME.round >= GAME.totalRounds) {
                GAME.finished = true;
                btnReset.innerText = 'New Game';
                statusInd.innerText = `FINAL ${GAME.score}`;
                document.getElementById('btn-complete').style.display = 'block';
            } else {
                btnReset.innerText = 'Next Shot';
            }
        }

        // --- 여기서부터가 화면을 정상적으로 맞춰주는 가장 중요한 부분입니다! ---
        resize(); // 처음 시작할 때 화면 크기를 계산해서 스톤을 정중앙에 배치합니다.
        initEnergyTimeGraph();
        resetGame(); // 게임 수치를 초기화합니다.

        document.getElementById('btn-complete').addEventListener('click', () => {
            const missionScore = ElabProgress.clampScore(GAME.score);
            ElabProgress.saveMission(2, 'clear', missionScore);
            MissionUI.showClearAndReturn({
              score: missionScore,
              formula: 'Q = F × d',
              desc: '마찰 에너지 손실 - 마찰력이 클수록 열에너지 손실 증가'
            });
        });
