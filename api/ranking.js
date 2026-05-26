// Vercel 서버리스 함수 — GitHub ranking.json 읽기/쓰기

const GITHUB_API = 'https://api.github.com';

function getConfig() {
  return {
    token:  process.env.GITHUB_TOKEN,
    repo:   process.env.GITHUB_REPO,   // e.g. "username/muligo2"
    branch: process.env.GITHUB_BRANCH || 'main',
    file:   process.env.RANKING_FILE   || 'ranking.json',
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
  if (!r.ok) throw new Error(`GitHub GET failed: ${r.status}`);
  const json = await r.json();
  const data = JSON.parse(Buffer.from(json.content, 'base64').toString('utf-8'));
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
  if (!r.ok) throw new Error(`GitHub PUT failed: ${r.status}`);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const cfg = getConfig();
  if (!cfg.token || !cfg.repo) {
    return res.status(500).json({ error: 'Server not configured (missing env vars)' });
  }

  try {
    if (req.method === 'GET') {
      const { data } = await getFile(cfg);
      return res.json(data);
    }

    if (req.method === 'POST') {
      const entry = req.body;
      if (!entry || typeof entry.name !== 'string' || typeof entry.score !== 'number') {
        return res.status(400).json({ error: 'Invalid entry' });
      }

      // 읽기 → 추가 → 정렬 → 상위 200개 유지 → 쓰기
      const { data, sha } = await getFile(cfg);
      data.push(entry);
      data.sort((a, b) => b.score - a.score);
      const trimmed = data.slice(0, 200);
      await putFile(cfg, trimmed, sha, `ranking: ${entry.name} (${entry.score}pt)`);
      return res.json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
