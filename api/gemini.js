// Vercel serverless function for private Gemini API calls.

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

const CONCEPTS = {
  1: {
    training: '하프파이프 훈련',
    title: '에너지 보존',
    formula: 'Ek + Ep = 일정',
    formulaSub: 'Ek = 1/2mv^2, Ep = mgh',
    variables: [
      { sym: 'm', desc: '질량 (kg)' },
      { sym: 'v', desc: '속도 (m/s)' },
      { sym: 'g', desc: '중력 가속도 (m/s^2)' },
      { sym: 'h', desc: '기준점에서의 높이 (m)' }
    ],
    flow: 'Ep(최대) -> Ek(최대) -> Ep(최대)',
    desc: '마찰이 없을 때 위치에너지와 운동에너지의 합은 항상 일정하다.'
  },
  2: {
    training: '컬링 마찰 실험',
    title: '마찰 에너지 손실',
    formula: 'Q = F x d',
    formulaSub: 'F = μmg, 역학적에너지 = Ek - Q',
    variables: [
      { sym: 'F', desc: '마찰력 (N)' },
      { sym: 'd', desc: '이동 거리 (m)' },
      { sym: 'μ', desc: '마찰 계수' },
      { sym: 'Q', desc: '열에너지 손실 (J)' }
    ],
    flow: 'Ek(출발) -> Ek(남음) + Q(열)',
    desc: '마찰력은 운동에너지를 열에너지로 전환한다.'
  },
  3: {
    training: '번지점프 설계',
    title: '탄성 위치에너지',
    formula: 'Es = 1/2kx^2',
    formulaSub: 'Ep + Ek + Es = 일정',
    variables: [
      { sym: 'k', desc: '탄성 계수 (N/m)' },
      { sym: 'x', desc: '줄 늘어난 길이 (m)' },
      { sym: 'Es', desc: '탄성 위치에너지 (J)' }
    ],
    flow: 'Ep -> Ek -> Es -> Ek -> Ep',
    desc: '늘어난 줄에 탄성에너지가 저장된다.'
  },
  4: {
    training: '챔피언십 종합',
    title: '에너지 보존 통합',
    formula: 'Ek + Ep + Es + Q = E0',
    formulaSub: '어떤 에너지도 사라지지 않는다',
    variables: [
      { sym: 'Ek', desc: '운동에너지 (J)' },
      { sym: 'Ep', desc: '위치에너지 (J)' },
      { sym: 'Es', desc: '탄성에너지 (J)' },
      { sym: 'Q', desc: '열에너지 (J)' },
      { sym: 'E0', desc: '처음 에너지 (J)' }
    ],
    flow: '형태는 바뀌지만 총합은 보존된다',
    desc: '운동, 위치, 탄성, 열에너지를 모두 더하면 처음 에너지와 같다.'
  }
};

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch (_) { return {}; }
  }
  return req.body;
}

function clampNumber(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, number));
}

function cleanText(value, maxLength) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function extractGeminiText(data) {
  if (!data || typeof data !== 'object') return '';
  if (typeof data.output_text === 'string') return data.output_text;
  if (typeof data.outputText === 'string') return data.outputText;

  if (Array.isArray(data.output)) {
    return data.output.map(item => {
      if (typeof item === 'string') return item;
      if (typeof item?.text === 'string') return item.text;
      if (typeof item?.content === 'string') return item.content;
      if (Array.isArray(item?.content)) {
        return item.content.map(part => part?.text || '').join('\n');
      }
      return '';
    }).filter(Boolean).join('\n');
  }

  const parts = data.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    return parts.map(part => part.text || '').filter(Boolean).join('\n');
  }

  return '';
}

function getDifficulty(score, questionCount) {
  if (score >= 930 || questionCount >= 6) {
    return {
      level: '심화',
      instruction: '새로운 스포츠 상황에 개념을 전이하고, 조건 변화가 에너지 흐름에 미치는 영향을 판단하게 한다.',
      target: '전이, 조건 비교, 에너지 흐름 추론'
    };
  }
  if (score >= 800 || questionCount >= 4) {
    return {
      level: '도전',
      instruction: '짧은 계산과 이유 설명을 함께 요구하고, 흔한 오개념을 스스로 점검하게 한다.',
      target: '계산, 이유 설명, 오개념 점검'
    };
  }
  if (score >= 600 || questionCount >= 2) {
    return {
      level: '적용',
      instruction: '공식의 변인 관계를 실제 미션 장면에 적용하고, 한 가지 조건이 바뀌면 결과가 어떻게 달라지는지 묻게 한다.',
      target: '변인 관계 적용, 조건 변화 예측'
    };
  }
  return {
    level: '기초',
    instruction: '처음 복습하는 학생도 풀 수 있게 핵심 개념 확인 중심으로 묻게 한다.',
    target: '핵심 개념 확인, 공식 의미 이해'
  };
}

function getQuestionMode(questionCount) {
  const modes = [
    {
      name: '핵심 확인',
      instruction: '공식이나 에너지 흐름의 가장 중요한 의미를 확인하는 질문으로 만든다.'
    },
    {
      name: '변인 변화',
      instruction: '질량, 속도, 높이, 마찰, 늘어난 길이 같은 변인 하나가 바뀌면 결과가 어떻게 달라지는지 묻는다.'
    },
    {
      name: '짧은 계산',
      instruction: '암산 또는 한 줄 계산으로 풀 수 있는 숫자를 넣고, 계산 뒤 물리적 의미를 설명하게 한다.'
    },
    {
      name: '오개념 진단',
      instruction: '학생이 헷갈리기 쉬운 주장 하나를 제시하고 맞는지 틀린지 근거를 들어 판단하게 한다.'
    },
    {
      name: '상황 전이',
      instruction: '미션과 비슷하지만 다른 스포츠 또는 생활 장면에 같은 개념을 적용하게 한다.'
    }
  ];
  return modes[Math.min(questionCount, modes.length - 1)];
}

function buildPrompt({ concept, score, questionCount, difficulty }) {
  const variables = Array.isArray(concept.variables)
    ? concept.variables.map(v => `${cleanText(v.sym, 20)}: ${cleanText(v.desc, 80)}`).join(', ')
    : '';
  const mode = getQuestionMode(questionCount);

  return [
    '너는 고등학교 2학년 물리학 학습 게임의 AI 코치다.',
    '목표는 학생이 게임에서 배운 에너지 개념을 스스로 설명하고 적용하게 만드는 것이다.',
    '학생이 노트 뒷면에서 바로 풀 수 있는 짧은 한국어 문제를 정확히 1개만 만든다.',
    '정답을 바로 말하지 않는다. 대신 풀이 방향을 떠올릴 수 있는 힌트와 자기 점검 기준을 제공한다.',
    '문제는 미션의 스포츠 상황과 연결하고, 공식 암기보다 에너지 흐름을 말로 설명하게 유도한다.',
    '응답 형식은 반드시 다음 네 줄만 사용한다.',
    '난이도: <기초|적용|도전|심화>',
    '문제: <문제 1개>',
    '힌트: <정답을 직접 말하지 않는 힌트>',
    '확인 기준: <학생 답안에 들어가야 할 핵심 2가지>',
    '',
    `미션: ${cleanText(concept.training, 80)}`,
    `개념: ${cleanText(concept.title, 80)}`,
    `공식: ${cleanText(concept.formula, 80)}`,
    `보조 공식: ${cleanText(concept.formulaSub, 120)}`,
    `변수: ${variables}`,
    `에너지 흐름: ${cleanText(concept.flow, 120)}`,
    `개념 설명: ${cleanText(concept.desc, 260)}`,
    `학생 점수: ${score}/1000`,
    `이 개념에서 이전에 받은 AI 질문 횟수: ${questionCount}`,
    `요청 난이도: ${difficulty.level}`,
    `학습 목표: ${difficulty.target}`,
    `난이도 조절 지시: ${difficulty.instruction}`,
    `이번 질문 유형: ${mode.name}`,
    `질문 유형 지시: ${mode.instruction}`,
    '',
    '제약:',
    '- 문제는 2문장 이내로 만든다.',
    '- 힌트와 확인 기준은 각각 1문장으로 쓴다.',
    '- 숫자를 쓰는 경우 계산이 복잡하지 않게 하고 단위를 포함한다.',
    '- 같은 응답 안에 정답, 모범 답안, 풀이 과정을 쓰지 않는다.',
    '- 학생을 격려하되 과장된 감탄사는 쓰지 않는다.'
  ].join('\n');
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'Gemini API key missing',
      message: 'Vercel 환경변수 GEMINI_API_KEY를 설정하면 AI 질문을 받을 수 있습니다.'
    });
  }

  const body = parseBody(req);
  const missionId = Number(body.missionId);
  const concept = CONCEPTS[missionId];
  if (!concept) {
    return res.status(400).json({ error: 'Invalid mission id' });
  }
  const score = clampNumber(body.score, 0, 1000);
  const questionCount = clampNumber(body.questionCount, 0, 99);
  const difficulty = getDifficulty(score, questionCount);

  try {
    const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
    const response = await fetch(`${GEMINI_API_BASE}/models/${model}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: buildPrompt({ concept, score, questionCount, difficulty }) }
            ]
          }
        ]
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = data.error?.message || `Gemini request failed: ${response.status}`;
      throw new Error(detail);
    }

    const question = extractGeminiText(data).trim();
    if (!question) throw new Error('Gemini returned an empty response.');

    res.status(200).json({ question });
  } catch (err) {
    console.error('[gemini]', err.message);
    res.status(500).json({
      error: 'Gemini request failed',
      message: 'AI 질문을 만드는 중 문제가 생겼습니다. 잠시 후 다시 시도해주세요.'
    });
  }
};
