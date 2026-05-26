'use strict';

(function attachMissionUi(global) {
  const DEFAULT_RETURN_URL = '../index.html?back=1';
  const DEFAULT_RETURN_DELAY = 3500;

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]);
  }

  function returnToLobby() {
    global.location.href = DEFAULT_RETURN_URL;
  }

  function hexToRgba(hex, alpha) {
    const match = String(hex).trim().match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (!match) return `rgba(48, 213, 255, ${alpha})`;
    const [, r, g, b] = match;
    return `rgba(${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)}, ${alpha})`;
  }

  function bindBackButtons(root = document) {
    root.querySelectorAll('[data-mission-back]').forEach(button => {
      if (button.dataset.missionBackBound) return;
      button.dataset.missionBackBound = '1';
      button.addEventListener('click', () => {
        const ok = global.confirm('로비로 돌아갈까요? 현재 진행상황은 저장되지 않습니다.');
        if (ok) returnToLobby();
      });
    });
  }

  function syncBackButtonVisibility() {
    const intro = document.getElementById('mission-intro');
    const shouldHide = intro && !intro.classList.contains('hidden');
    document.querySelectorAll('.mission-back-slot').forEach(slot => {
      slot.classList.toggle('mission-back-slot--visible', !shouldHide);
    });
  }

  function watchIntroVisibility() {
    const intro = document.getElementById('mission-intro');
    syncBackButtonVisibility();
    if (!intro) return;

    const observer = new MutationObserver(syncBackButtonVisibility);
    observer.observe(intro, { attributes: true, attributeFilter: ['class'] });
  }

  function showClearAndReturn(options) {
    const {
      score,
      kicker = 'Mission Clear',
      accent = '#3ee68f',
      label = '오늘 배운 공식',
      formula,
      formulaSize = '1.85rem',
      desc,
      delay = DEFAULT_RETURN_DELAY
    } = options;

    const overlay = document.createElement('div');
    overlay.className = 'mission-clear-overlay';
    overlay.style.setProperty('--mission-clear-accent', accent);
    overlay.style.setProperty('--mission-clear-border', hexToRgba(accent, 0.35));
    overlay.style.setProperty('--mission-clear-bg', hexToRgba(accent, 0.1));
    overlay.style.setProperty('--mission-clear-formula-size', formulaSize);
    overlay.innerHTML = `
      <div class="mission-clear-card">
        <div class="mission-clear-kicker">${escapeHtml(kicker)}</div>
        <div class="mission-clear-score">${escapeHtml(score)}</div>
        <div class="mission-clear-unit">점 / 1000</div>
        <div class="mission-clear-concept">
          <div class="mission-clear-label">${escapeHtml(label)}</div>
          <div class="mission-clear-formula">${escapeHtml(formula)}</div>
          <div class="mission-clear-desc">${escapeHtml(desc)}</div>
        </div>
        <div class="mission-clear-return">잠시 후 로비로 돌아갑니다...</div>
      </div>
    `;
    document.body.appendChild(overlay);
    global.setTimeout(returnToLobby, delay);
  }

  function askCoachQuestion(options) {
    const {
      speaker = '코치 질문',
      question,
      choices = [],
      continueLabel = '이어가기'
    } = options;

    return new Promise(resolve => {
      const overlay = document.createElement('div');
      overlay.className = 'coach-question-overlay';
      overlay.innerHTML = `
        <section class="coach-question-card" role="dialog" aria-modal="true" aria-labelledby="coach-question-title">
          <span class="coach-question-kicker">${escapeHtml(speaker)}</span>
          <h2 id="coach-question-title" class="coach-question-title">${escapeHtml(question)}</h2>
          <div class="coach-question-choices"></div>
          <div class="coach-question-feedback" hidden></div>
          <button class="coach-question-next" type="button">${escapeHtml(continueLabel)}</button>
        </section>
      `;

      const choicesEl = overlay.querySelector('.coach-question-choices');
      const feedbackEl = overlay.querySelector('.coach-question-feedback');
      const next = overlay.querySelector('.coach-question-next');

      choices.forEach(choice => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'coach-question-choice';
        button.textContent = choice.label;
        button.addEventListener('click', () => {
          choicesEl.querySelectorAll('button').forEach(node => {
            node.disabled = true;
            if (node.dataset.correct === 'true') node.classList.add('is-correct');
          });
          button.classList.add(choice.correct ? 'is-correct' : 'is-wrong');
          feedbackEl.hidden = false;
          feedbackEl.textContent = choice.feedback;
          next.classList.add('is-visible');
          next.focus();
        });
        button.dataset.correct = choice.correct ? 'true' : 'false';
        choicesEl.appendChild(button);
      });

      next.addEventListener('click', () => {
        overlay.remove();
        resolve();
      });

      document.body.appendChild(overlay);
      const firstChoice = choicesEl.querySelector('button');
      if (firstChoice) firstChoice.focus();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      bindBackButtons();
      watchIntroVisibility();
    });
  } else {
    bindBackButtons();
    watchIntroVisibility();
  }

  global.MissionUI = {
    bindBackButtons,
    returnToLobby,
    showClearAndReturn,
    askCoachQuestion
  };
})(window);
