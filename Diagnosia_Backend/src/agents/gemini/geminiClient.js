let geminiState = null;

async function loadGemini() {
  if (geminiState) return geminiState;
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const key = process.env.GEMINI_API_KEY;
    if (!key) return null;
    const genAI = new GoogleGenerativeAI(key);
    const modelIds = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'];
    geminiState = { genAI, modelIds };
    return geminiState;
  } catch {
    return null;
  }
}

export class GeminiWrapper {
  async generateJSON(prompt) {
    const modelState = await loadGemini();
    if (!modelState) throw new Error('Gemini not configured');
    const { genAI, modelIds } = modelState;
    let lastErr;
    for (const id of modelIds) {
      try {
        const m = genAI.getGenerativeModel({ model: id });
        const resp = await m.generateContent([{ text: prompt }]);
        const text = (resp?.response?.text?.() || '').trim();
        const cleaned = text.replace(/^```json|^```|```$/g, '').trim();
        try {
          return JSON.parse(cleaned);
        } catch {
          const match = cleaned.match(/\{[\s\S]*\}/);
          if (match) return JSON.parse(match[0]);
        }
      } catch (e) {
        lastErr = e;
      }
    }
    throw (lastErr || new Error('Gemini JSON generation failed'));
  }

  async generateText(prompt) {
    const modelState = await loadGemini();
    if (!modelState) throw new Error('Gemini not configured');
    const { genAI, modelIds } = modelState;
    let lastErr;
    for (const id of modelIds) {
      try {
        const m = genAI.getGenerativeModel({ model: id });
        const resp = await m.generateContent([{ text: prompt }]);
        const text = (resp?.response?.text?.() || '').trim();
        return text;
      } catch (e) {
        lastErr = e;
      }
    }
    throw (lastErr || new Error('Gemini text generation failed'));
  }
}

export async function getGemini() {
  const w = new GeminiWrapper();
  return w;
}
