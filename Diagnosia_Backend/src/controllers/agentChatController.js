import { sessionStateManager } from '../agents/state/SessionStateManager.js';
import { ApiClient } from '../agents/services/ApiClient.js';
import { getGemini } from '../agents/gemini/geminiClient.js';
import { RouterAgent } from '../agents/RouterAgent.js';

export async function agentChat(req, res, next) {
  try {
    const { message, session_id } = req.body || {};
    if (!message) return res.status(400).json({ message: 'message is required' });
    const sid = session_id || `sess_${req.user?.user_id || 'anon'}_${Date.now()}`;

    const gemini = await getGemini();
    if (!gemini) return res.status(500).json({ message: 'Gemini not configured' });

    const apiClient = new ApiClient({
      baseUrl: process.env.PUBLIC_API_BASE_URL || (process.env.API_BASE_URL || 'http://localhost:5000/api'),
      userToken: req.headers.authorization ? req.headers.authorization.replace(/^Bearer\s+/i, '') : null
    });

    const router = new RouterAgent({ apiClient, gemini, sessionStateManager });
    const out = await router.handle(sid, message);

    res.json({
      session_id: sid,
      intent: out.intent,
      messages: out.messages,
      state: out.state
    });
  } catch (err) {
    console.error('[agent-chat] primary error:', err);
    let fallback = 'Sorry, an internal error occurred. Please try again shortly.';
    try {
      const gemini = await getGemini();
      if (gemini) {
        fallback = await gemini.generateText('Write a brief, polite message telling the user an internal error occurred and they can retry.');
      }
    } catch (secondary) {
      console.error('[agent-chat] secondary error generating apology:', secondary);
    }
    if (res.headersSent) {
      return; // cannot modify response now
    }
    return res.status(500).json({ message: fallback });
  }
}
