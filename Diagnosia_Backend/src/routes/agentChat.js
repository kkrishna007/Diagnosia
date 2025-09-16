import express from 'express';
import auth from '../middleware/auth.js';
import { agentChat } from '../controllers/agentChatController.js';
import { getGemini } from '../agents/gemini/geminiClient.js';

const router = express.Router();

router.post('/', auth, agentChat);

// Lightweight readiness / health check
router.get('/health', auth, async (req, res) => {
	try {
		const gemini = await getGemini();
		if (!gemini) return res.status(503).json({ ok: false, gemini: false, message: 'Gemini not configured' });
		// very cheap token test
		try {
			await gemini.generateText('ok');
			return res.json({ ok: true, gemini: true });
		} catch (modelErr) {
			return res.status(500).json({ ok: false, gemini: false, message: modelErr.message });
		}
	} catch (e) {
		return res.status(500).json({ ok: false, error: e.message });
	}
});

export default router;
