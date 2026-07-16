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
  const parts = data.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    return parts.map(part => part.text || '').filter(Boolean).join('\n');
  }
  return '';
}

function parseJsonFromText(text) {
  const cleaned = String(text || '')
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch (_) {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error('Invalid quiz JSON');
  }
}

function normalizeQuiz(raw, difficulty) {
  const choices = Array.isArray(raw?.choices)
    ? raw.choices.map(choice => cleanText(choice, 90)).filter(Boolean).slice(0, 3)
    : [];
  const answerIndex = Number(raw?.answerIndex);
  if (!cleanText(raw?.question, 160) || choices.length !== 3 || !Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex > 2) {
    throw new Error('Invalid quiz payload');
  }
  return {
    difficulty: cleanText(raw.difficulty, 12) || difficulty.level,
    question: cleanText(raw.question, 160),
    choices,
    answerIndex,
    hint: cleanText(raw.hint, 120),
    explanation: cleanText(raw.explanation, 140),
    detail: cleanText(raw.detail, 220)
  };
}

function createFallbackQuiz(concept, difficulty, questionCount, score = 0) {
  const title = cleanText(concept.title, 40);
  const formula = cleanText(concept.formula, 60);
  const flow = cleanText(concept.flow, 80);
  const templates = [
    {
      question: `${title}에서 가장 중요한 에너지 흐름은 무엇일까요?`,
      choices: [
        flow || '에너지는 형태를 바꾸며 전환된다',
        '에너지는 운동 중 완전히 사라진다',
        '속도가 변해도 에너지는 관련이 없다'
      ],
      answerIndex: 0,
      hint: '노트의 에너지 흐름 화살표를 먼저 보세요.',
      explanation: '에너지는 사라지지 않고 다른 형태로 전환됩니다.',
      detail: `"완전히 사라진다"는 흔한 오개념입니다. ${title}에서는 ${flow || '한 형태의 에너지가 다른 형태로'} 바뀔 뿐, 전체 양은 그대로 보존됩니다. 속도 변화도 에너지가 사라지는 게 아니라 형태가 바뀌는 신호로 읽어야 합니다.`
    },
    {
      question: `${formula}에서 변인이 커지면 관련 에너지는 어떻게 달라질까요?`,
      choices: [
        '공식에 포함된 변인 관계에 따라 달라진다',
        '항상 아무 변화가 없다',
        '단위와 관계없이 무조건 0이 된다'
      ],
      answerIndex: 0,
      hint: '공식에서 어떤 문자가 곱해지는지 살펴보세요.',
      explanation: '공식의 변인 관계를 보면 에너지 변화를 예측할 수 있습니다.',
      detail: `${formula} 공식에서 곱해지는 변인이 커지면 그만큼 결과값도 함께 커집니다. "항상 변화가 없다"거나 "무조건 0"이라는 생각은 변인들이 서로 곱해지는 관계라는 사실을 놓친 것입니다.`
    },
    {
      question: `${title}을 설명할 때 가장 조심해야 할 생각은 무엇일까요?`,
      choices: [
        '에너지가 사라진다고 말하는 것',
        '에너지 형태가 바뀐다고 말하는 것',
        '조건 변화가 결과를 바꾼다고 보는 것'
      ],
      answerIndex: 0,
      hint: '에너지 보존 관점에서 틀린 표현을 찾으세요.',
      explanation: '에너지는 사라지는 것이 아니라 다른 형태로 전환됩니다.',
      detail: '에너지 보존 법칙에서는 에너지가 새로 생기거나 사라지지 않습니다. "형태가 바뀐다"거나 "조건이 결과를 바꾼다"는 표현은 맞는 설명이고, "사라진다"는 표현만 오개념입니다.'
    },
    {
      question: `${title}에서 속도가 커지는 순간 무엇이 함께 변할까요?`,
      choices: [
        '운동에너지의 크기가 달라진다',
        '모든 에너지가 즉시 0이 된다',
        '공식의 단위가 사라진다'
      ],
      answerIndex: 0,
      hint: '속도와 연결된 에너지 이름을 떠올려 보세요.',
      explanation: '속도 변화는 운동에너지 변화와 직접 관련됩니다.',
      detail: '운동에너지는 속도의 제곱에 비례합니다. 속도가 커지면 운동에너지도 커지고, 작아지면 운동에너지도 작아집니다. "즉시 0이 된다"거나 "단위가 사라진다"는 물리적으로 일어날 수 없는 일입니다.'
    },
    {
      question: `${title} 문제를 풀 때 먼저 확인하면 좋은 것은 무엇일까요?`,
      choices: [
        '어떤 에너지 형태로 바뀌는지',
        '선수 이름의 글자 수',
        '배경 그림의 색깔'
      ],
      answerIndex: 0,
      hint: '문제 장면에서 에너지 전환을 먼저 찾으세요.',
      explanation: '에너지 형태의 전환을 파악해야 공식을 고를 수 있습니다.',
      detail: '물리 문제는 장면 속에서 어떤 에너지가 어떤 에너지로 바뀌는지부터 파악해야 알맞은 공식을 고를 수 있습니다. 이름 글자 수나 배경 색깔처럼 물리량과 무관한 정보는 풀이에 도움이 되지 않습니다.'
    },
    {
      question: `점수 ${score}점인 현재 단계에서 더 깊게 볼 것은 무엇일까요?`,
      choices: [
        '조건 변화가 에너지 결과를 어떻게 바꾸는지',
        '정답 선택지가 항상 첫 번째인지',
        '공식 없이 느낌으로만 고르는지'
      ],
      answerIndex: 0,
      hint: '높이, 속도, 거리 같은 조건 변화를 비교하세요.',
      explanation: '조건이 바뀌면 에너지 전환의 양상도 달라집니다.',
      detail: '높이, 속도, 거리, 질량 같은 조건이 바뀌면 에너지 전환 결과도 함께 달라집니다. 선택지 순서에는 아무 규칙이 없고, 느낌만으로 고르면 조건 변화의 영향을 놓치기 쉽습니다.'
    }
  ];
  const base = templates[questionCount % templates.length];
  return { difficulty: difficulty.level, ...base };
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

function buildPrompt({ concept, score, questionCount, difficulty, quizSeed }) {
  const variables = Array.isArray(concept.variables)
    ? concept.variables.map(v => `${cleanText(v.sym, 20)}: ${cleanText(v.desc, 80)}`).join(', ')
    : '';
  const mode = getQuestionMode(questionCount);

  return [
    '너는 고등학교 2학년 물리학 학습 게임의 AI 코치다.',
    '목표는 학생이 게임에서 배운 에너지 개념을 스스로 설명하고 적용하게 만드는 것이다.',
    '학생이 노트 뒷면에서 바로 고를 수 있는 3지선다 한국어 퀴즈를 정확히 1개만 만든다.',
    '정답은 answerIndex에만 담고, 선택지 문장 안에는 "정답" 같은 표시를 넣지 않는다.',
    '선택지 3개는 모두 그럴듯해야 하며, 오답 2개는 흔한 오개념을 반영한다.',
    '문제는 미션의 스포츠 상황과 연결하고, 공식 암기보다 에너지 흐름을 말로 설명하게 유도한다.',
    '응답은 설명 문장이나 마크다운 없이 JSON 객체 하나만 출력한다.',
    'explanation은 정답을 확인해주는 짧은 한 문장이다.',
    'detail은 학생이 오답을 골랐을 때만 보여줄 상세 설명이다. 왜 정답이 맞는지와 함께, 흔히 고르는 오답이 어떤 오개념 때문에 틀렸는지를 구체적으로 짚어준다.',
    'JSON 형식:',
    '{"difficulty":"기초|적용|도전|심화","question":"문제","choices":["선택지1","선택지2","선택지3"],"answerIndex":0,"hint":"힌트","explanation":"정답 확인 설명","detail":"오답일 때 보여줄 상세 설명"}',
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
    `이번 퀴즈 고유 번호: ${quizSeed}`,
    `요청 난이도: ${difficulty.level}`,
    `학습 목표: ${difficulty.target}`,
    `난이도 조절 지시: ${difficulty.instruction}`,
    `이번 질문 유형: ${mode.name}`,
    `질문 유형 지시: ${mode.instruction}`,
    '',
    '제약:',
    '- question은 1문장, 90자 이내로 쓴다.',
    '- choices의 각 선택지는 45자 이내로 쓴다.',
    '- hint와 explanation은 각각 70자 이내로 쓴다.',
    '- detail은 100자 이상 200자 이내로, explanation보다 더 구체적으로 쓴다.',
    '- 숫자를 쓰는 경우 계산이 복잡하지 않게 하고 단위를 포함한다.',
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
  const quizSeed = clampNumber(body.quizSeed, 0, 999999);
  const difficulty = getDifficulty(score, questionCount);

  try {
    const model = process.env.GEMINI_MODEL || 'gemini-flash-latest';
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
              { text: buildPrompt({ concept, score, questionCount, difficulty, quizSeed }) }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 420
        }
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = data.error?.message || `Gemini request failed: ${response.status}`;
      throw new Error(detail);
    }

    const text = extractGeminiText(data).trim();
    if (!text) throw new Error('Gemini returned an empty response.');
    let quiz;
    try {
      quiz = normalizeQuiz(parseJsonFromText(text), difficulty);
    } catch (parseErr) {
      console.warn('[gemini] quiz JSON parse failed; using fallback quiz:', parseErr.message);
      quiz = createFallbackQuiz(concept, difficulty, questionCount, score);
    }

    res.status(200).json({ quiz });
  } catch (err) {
    console.error('[gemini]', err.message);
    const rawMessage = String(err.message || '');
    const isModelIssue = /model|models\/|not found|not available|deprecated/i.test(rawMessage);
    res.status(200).json({
      quiz: createFallbackQuiz(concept, difficulty, questionCount, score),
      fallback: true,
      error: isModelIssue ? 'Gemini model issue' : 'Gemini request failed',
      message: isModelIssue
        ? 'Vercel 환경변수 GEMINI_MODEL을 gemini-flash-latest로 설정하거나 GEMINI_MODEL을 삭제한 뒤 다시 배포해주세요.'
        : 'AI 질문을 만드는 중 문제가 생겼습니다. Vercel 환경변수 GEMINI_API_KEY 설정과 배포 로그를 확인해주세요.'
    });
  }
};
