'use strict';

(function attachBadgesApi(global) {
  const BADGES_KEY = 'elab-badges-v1';

  const BADGE_DEFS = [
    { id: 'conserve',   icon: '⚡', name: '에너지 보존 완성', desc: '하프파이프 착지 5회 성공' },
    { id: 'spin720',    icon: '🌀', name: '720 마스터',       desc: '하프파이프에서 720° 이상 회전 착지' },
    { id: 'friction5',  icon: '🔥', name: '마찰 전문가',      desc: '컬링 5라운드 전부 PERFECT' },
    { id: 'precision',  icon: '📐', name: '정밀 설계사',      desc: '번지점프 3라운드 모두 정밀 설계' },
    { id: 'full_trust', icon: '🏅', name: '만점 코치',        desc: '챔피언십 신뢰도 1000점 달성' },
    { id: 'all_clear',  icon: '🌟', name: '에너지 통달',      desc: '4개 미션 모두 클리어' },
    { id: 'champion',   icon: '👑', name: '챔피언',           desc: '총점 3,500점 이상 (S 랭크)' }
  ];

  function readUnlocked() {
    try {
      const parsed = JSON.parse(global.localStorage.getItem(BADGES_KEY));
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) { return []; }
  }

  function writeUnlocked(ids) {
    try { global.localStorage.setItem(BADGES_KEY, JSON.stringify(ids)); } catch (_) {}
  }

  function unlock(id) {
    const ids = readUnlocked();
    if (ids.includes(id)) return false;
    ids.push(id);
    writeUnlocked(ids);
    return true;
  }

  function isUnlocked(id) { return readUnlocked().includes(id); }

  function getAll() {
    const unlocked = readUnlocked();
    return BADGE_DEFS.map(def => ({ ...def, unlocked: unlocked.includes(def.id) }));
  }

  function showToast(badge) {
    if (typeof document === 'undefined') return;
    const el = document.createElement('div');
    el.className = 'elab-badge-toast';
    el.innerHTML = `<span class="elab-badge-toast-icon">${badge.icon}</span><span class="elab-badge-toast-text"><span>배지 획득!</span><strong>${badge.name}</strong></span>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 500);
    }, 3200);
  }

  function unlockWithToast(id) {
    const wasNew = unlock(id);
    if (wasNew) {
      const def = BADGE_DEFS.find(d => d.id === id);
      if (def) showToast(def);
    }
    return wasNew;
  }

  function reset() { writeUnlocked([]); }

  // Inject shared toast CSS once (works in both lobby and mission pages)
  if (typeof document !== 'undefined' && !document.getElementById('elab-badge-css')) {
    const style = document.createElement('style');
    style.id = 'elab-badge-css';
    style.textContent = [
      '.elab-badge-toast{position:fixed;bottom:28px;right:28px;background:#1e1008;border:2px solid #c8920e;border-radius:6px;padding:11px 18px 11px 14px;display:flex;align-items:center;gap:14px;color:#f0e4c8;font-size:0.95rem;z-index:9999;opacity:0;transform:translateY(14px) rotate(.4deg);transition:opacity .4s,transform .4s;pointer-events:none;font-family:inherit;box-shadow:0 6px 28px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,220,80,.1)}',
      '.elab-badge-toast.show{opacity:1;transform:translateY(0) rotate(0deg)}',
      '.elab-badge-toast-icon{font-size:2rem;line-height:1;flex-shrink:0;filter:drop-shadow(0 0 6px rgba(200,146,14,.5))}',
      '.elab-badge-toast-text{display:flex;flex-direction:column;gap:3px}',
      '.elab-badge-toast-text>span:first-child{font-size:0.72rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#c89040}',
      '.elab-badge-toast-text strong{color:#f4e4b0;font-size:0.96rem;font-weight:900}'
    ].join('');
    document.head.appendChild(style);
  }

  global.ElabBadges = { BADGE_DEFS, unlock, unlockWithToast, isUnlocked, getAll, reset };
})(window);
