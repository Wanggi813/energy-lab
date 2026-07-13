// Vercel 서버리스 함수 — GitHub ranking.json 읽기/쓰기 (CommonJS)

const GITHUB_API = 'https://api.github.com';
const MAX_TOTAL_SCORE = 3999;
const MAX_MISSION_SCORE = 1000;
const MISSION_COUNT = 4;

function getConfig() {
  return {
    token:  process.env.GITHUB_TOKEN,
    repo:   process.env.GITHUB_REPO,
    branch: process.env.GITHUB_BRANCH || 'main',
    file:   process.env.RANKING_FILE  || 'ranking.json',
  };
}

function ghHeaders(token) {
  return {
    Authorization:  `token ${token}`,
    Accept:         'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'User-Agent':   'physical-energy-lab',
  };
}

function clampScore(value, max) {
  const score = Math.round(Number(value));
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(max, score));
}

function sanitizeName(value) {
  return String(value || '코치')
    .replace(/[\u0000-\u001F\u007F<>]/g, '')
    .trim()
    .slice(0, 12) || '코치';
}

function sanitizeSavedAt(value) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : new Date().toISOString();
}

function sanitizeRankEntry(body) {
  if (!body || typeof body !== 'object') return null;

  const missions = Array.isArray(body.missions)
    ? Array.from({ length: MISSION_COUNT }, (_, index) => clampScore(body.missions[index], MAX_MISSION_SCORE))
    : Array(MISSION_COUNT).fill(0);
  const missionTotal = missions.reduce((sum, score) => sum + score, 0);
  const reportedScore = clampScore(body.score, MAX_TOTAL_SCORE);
  const score = Math.min(reportedScore, missionTotal);

  return {
    name: sanitizeName(body.name),
    score,
    missions,
    savedAt: sanitizeSavedAt(body.savedAt),
  };
}

async function getFile(cfg) {
  const url = `${GITHUB_API}/repos/${cfg.repo}/contents/${cfg.file}?ref=${cfg.branch}`;
  const r = await fetch(url, { headers: ghHeaders(cfg.token) });
  if (r.status === 404) return { data: [], sha: null };
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`GitHub GET ${r.status}: ${text}`);
  }
  const json = await r.json();
  const content = json.content.replace(/\n/g, '');
  const data = JSON.parse(Buffer.from(content, 'base64').toString('utf-8'));
  return { data, sha: json.sha };
}

async function putFile(cfg, data, sha, message) {
  const url = `${GITHUB_API}/repos/${cfg.repo}/contents/${cfg.file}`;
  const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
  const body = { message, content, branch: cfg.branch };
  if (sha) body.sha = sha;
  const r = await fetch(url, {
    method:  'PUT',
    headers: ghHeaders(cfg.token),
    body:    JSON.stringify(body),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`GitHub PUT ${r.status}: ${text}`);
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const cfg = getConfig();
  if (!cfg.token || !cfg.repo) {
    return res.status(500).json({
      error: 'env vars missing',
      hint: 'GITHUB_TOKEN and GITHUB_REPO must be set in Vercel environment variables',
    });
  }

  // body 파싱 (Vercel은 자동 파싱하지만 안전하게 처리)
  let body = req.body;
  if (req.method === 'POST' && typeof body === 'string') {
    try { body = JSON.parse(body); } catch (_) { body = {}; }
  }

  try {
    if (req.method === 'GET') {
      const { data } = await getFile(cfg);
      return res.json(data);
    }

    if (req.method === 'POST') {
      const entry = sanitizeRankEntry(body);
      if (!entry) {
        return res.status(400).json({ error: 'Invalid entry', received: body });
      }

      const { data, sha } = await getFile(cfg);
      data.push(entry);
      data.sort((a, b) => b.score - a.score);
      const trimmed = data.slice(0, 200);
      await putFile(cfg, trimmed, sha, `ranking: ${entry.name} (${entry.score}pt)`);
      return res.json({ ok: true, total: trimmed.length });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[ranking]', err.message);
    res.status(500).json({ error: err.message });
  }
};
