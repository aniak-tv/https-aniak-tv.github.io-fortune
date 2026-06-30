const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://sajuorbit.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400'
};

const REQUIRED_KEYS = [
  'headline',
  'overall',
  'relationship',
  'workMoney',
  'condition',
  'caution',
  'action',
  'keyword',
  'moodColor',
  'rhythmNumber'
];

const JSON_SCHEMA_HINT = `{
  "language": "ko|en|ja",
  "date": "YYYY-MM-DD",
  "headline": "string",
  "overall": "string",
  "relationship": "string",
  "workMoney": "string",
  "condition": "string",
  "caution": "string",
  "action": "string",
  "keyword": "string",
  "moodColor": "string",
  "rhythmNumber": 1,
  "related": ["tarot", "saju", "tojeong", "zodiac"]
}`;

function json(data, init = {}) {
  return Response.json(data, {
    ...init,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
      ...(init.headers || {})
    }
  });
}

function hash(input) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function fallback(language, date) {
  const items = [
    {
      headline: 'Today favors review and adjustment over rushing into expansion.',
      overall: 'The day works better when you organize what is already open rather than starting too many new threads. Put your tasks in order and handle the smallest clear item first.',
      relationship: 'In relationships, read the tone before reacting to the words. A slower reply may prevent unnecessary friction and leave room for a better conversation.',
      workMoney: 'Work, study, and money benefit from checking details before confirming anything important. Review times, files, amounts, and promises with a calm eye.',
      condition: 'Your energy may respond better to rhythm than force. Short focused blocks with real breaks will work better than pushing through for too long.',
      caution: 'Be careful with instant replies and emotional promises. Today rewards accuracy more than speed.',
      action: 'Before sending an important message, payment, or confirmation, read it once more.',
      keyword: 'Review',
      moodColor: 'Calm blue',
      rhythmNumber: 7
    },
    {
      headline: 'Today opens through conversation, but boundaries still matter.',
      overall: 'You may find useful hints in casual exchanges today. Let other people provide context, but avoid letting the whole day be pulled by their pace.',
      relationship: 'A gentle first message can smooth the mood. Still, it helps to keep your own needs visible instead of quietly adjusting to everything.',
      workMoney: 'Collaboration and double-checking are useful for work or study. With money, compare the details instead of following the mood of the moment.',
      condition: 'Your condition may be sensitive to your surroundings. Reducing noise and visual clutter can bring your focus back faster than expected.',
      caution: 'Taking on every request can disturb your balance. Separate what you can do from what needs to wait.',
      action: 'Share one task or plan with someone who can give a quick, practical check.',
      keyword: 'Dialogue',
      moodColor: 'Warm gold',
      rhythmNumber: 3
    }
  ];
  const pick = items[hash(`${language}:${date}`) % items.length];
  return { language, date, ...pick, related: ['tarot', 'saju', 'tojeong', 'zodiac'] };
}

function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function buildPrompt(language, date) {
  const languageName = { ko: 'Korean', en: 'English', ja: 'Japanese' }[language] || 'English';
  return `Create one SajuOrbit Daily Fortune for ${date}.
Respond in ${languageName} only.

This fortune is not a replacement for Saju, Tojeong Fortune, Zodiac horoscope, or Tarot.
It is a practical daily guide for the overall mood and useful actions for today.

Rules:
- Be specific, but do not predict fixed future events.
- Give direction without fear.
- Avoid vague comfort-only writing.
- Do not define someone's lifelong personality, fate, annual fortune, zodiac traits, or answer a specific tarot question.
- Do not make medical, legal, investment, accident, illness, death, bankruptcy, or disaster predictions.
- Treat lucky color and rhythm number as light mood elements only.
- Keep each body field practical and readable, about 1-3 sentences.
- Return JSON only. No markdown. No surrounding commentary.

Required JSON shape:
${JSON_SCHEMA_HINT}`;
}

function cleanGeminiText(text) {
  return String(text || '')
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function normalizeFortune(parsed, language, date) {
  const base = fallback(language, date);
  const out = { ...base, ...(parsed && typeof parsed === 'object' ? parsed : {}), language, date };
  for (const key of REQUIRED_KEYS) {
    if (key === 'rhythmNumber') {
      const n = Number(out.rhythmNumber);
      out.rhythmNumber = Number.isFinite(n) && n >= 1 && n <= 99 ? Math.round(n) : base.rhythmNumber;
    } else if (typeof out[key] !== 'string' || !out[key].trim()) {
      out[key] = base[key];
    } else {
      out[key] = out[key].trim();
    }
  }
  out.related = ['tarot', 'saju', 'tojeong', 'zodiac'];
  return out;
}

async function requestGemini(env, language, date) {
  const response = await fetch(`${GEMINI_ENDPOINT}?key=${env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: buildPrompt(language, date) }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 1100
      }
    })
  });
  if (!response.ok) throw new Error(`Gemini ${response.status}`);
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return JSON.parse(cleanGeminiText(text));
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (request.method !== 'POST') return json({ error: 'Method Not Allowed' }, { status: 405 });

  let body = {};
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Bad Request' }, { status: 400 });
  }

  const language = ['ko', 'en', 'ja'].includes(body.language) ? body.language : 'en';
  const date = validDate(body.date) ? body.date : new Date().toISOString().slice(0, 10);
  const cache = caches.default;
  const cacheKey = new Request(`https://sajuorbit.com/api/daily-fortune/${language}/${date}`);
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const debug = request.headers.get('X-Saju-Debug') === '1';

  if (!env.GEMINI_API_KEY) {
    return json(
      { error: 'daily_fortune_unavailable', language, date, ...(debug ? { debug: { hasKey: false, model: GEMINI_MODEL } } : {}) },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  try {
    const parsed = await requestGemini(env, language, date);
    const fortune = normalizeFortune(parsed, language, date);
    const response = json(fortune, {
      headers: { 'Cache-Control': 'public, max-age=86400' }
    });
    await cache.put(cacheKey, response.clone());
    return response;
  } catch (error) {
    return json(
      { error: 'daily_fortune_unavailable', language, date, ...(debug ? { debug: { hasKey: true, model: GEMINI_MODEL, message: String(error && error.message ? error.message : error) } } : {}) },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
