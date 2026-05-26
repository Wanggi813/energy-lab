'use strict';

(function attachProgressApi(global) {
  const SAVE_KEY = 'elab-progress-v2';
  const MAX_MISSION_SCORE = 1000;
  const LAST_MISSION_ID = 4;

  function clampScore(value, max = MAX_MISSION_SCORE) {
    const score = Math.round(Number(value));
    if (!Number.isFinite(score)) return 0;
    return Math.max(0, Math.min(max, score));
  }

  function readProgress() {
    try {
      const parsed = JSON.parse(global.localStorage.getItem(SAVE_KEY));
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function writeProgress(records) {
    try {
      global.localStorage.setItem(SAVE_KEY, JSON.stringify(records));
    } catch (_) {
      // Storage can fail in private browsing or restricted embeds.
    }
  }

  function saveMission(id, status = 'clear', score = null) {
    const missionId = Number(id);
    if (!Number.isInteger(missionId)) return readProgress();

    const records = readProgress();
    const nextScore = score == null ? null : clampScore(score);
    const current = records.find(item => item.id === missionId);

    if (current) {
      current.status = status;
      if (score != null) current.score = nextScore;
    } else {
      records.push({ id: missionId, status, score: nextScore });
    }

    if (status === 'clear' && missionId < LAST_MISSION_ID) {
      const nextId = missionId + 1;
      const next = records.find(item => item.id === nextId);
      if (next) {
        if (next.status === 'locked') next.status = 'anomaly';
      } else {
        records.push({ id: nextId, status: 'anomaly', score: null });
      }
    }

    writeProgress(records);
    return records;
  }

  global.ElabProgress = {
    SAVE_KEY,
    MAX_MISSION_SCORE,
    clampScore,
    readProgress,
    writeProgress,
    saveMission
  };
})(window);
