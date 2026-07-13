// Vercel 서버리스 함수 — GitHub ranking.json 읽기/쓰기 (CommonJS)

const GITHUB_API = 'https://api.github.com';

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
      if (!body || typeof body.name !== 'string' || typeof body.score !== 'number') {
        return res.status(400).json({ error: 'Invalid entry', received: body });
      }

      const { data, sha } = await getFile(cfg);
      data.push(body);
      data.sort((a, b) => b.score - a.score);
      const trimmed = data.slice(0, 200);
      await putFile(cfg, trimmed, sha, `ranking: ${body.name} (${body.score}pt)`);
      return res.json({ ok: true, total: trimmed.length });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[ranking]', err.message);
    res.status(500).json({ error: err.message });
  }
};
