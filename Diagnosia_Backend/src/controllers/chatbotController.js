import pool from '../../config/db.js';

// Get chat history for a session (or latest session if not provided)
export const getChatHistory = async (req, res, next) => {
  try {
    let { session_id } = req.query;
    if (!session_id) {
      // Get latest session for user
      const sessionRes = await pool.query(
        `SELECT session_id FROM chatbot_sessions WHERE user_id = $1 ORDER BY started_at DESC LIMIT 1`,
        [req.user.user_id]
      );
      session_id = sessionRes.rows[0]?.session_id;
    }
    if (!session_id) return res.json([]);
    const messages = await pool.query(
      `SELECT * FROM chatbot_messages WHERE session_id = $1 ORDER BY created_at ASC`,
      [session_id]
    );
    res.json(messages.rows);
  } catch (err) {
    next(err);
  }
};

// Send a message to the chatbot (creates session if needed)
export const sendMessage = async (req, res, next) => {
  try {
    const { message, session_id } = req.body;
    let sid = session_id;
    if (!sid) {
      // Create new session
      const sessionRes = await pool.query(
        `INSERT INTO chatbot_sessions (user_id, started_at) VALUES ($1, NOW()) RETURNING session_id`,
        [req.user.user_id]
      );
      sid = sessionRes.rows[0].session_id;
    }
    // Save user message
    await pool.query(
      `INSERT INTO chatbot_messages (session_id, user_id, message, is_bot, created_at) VALUES ($1, $2, $3, false, NOW())`,
      [sid, req.user.user_id, message]
    );
    // Simulate bot reply
    const reply = `Echo: ${message}`;
    await pool.query(
      `INSERT INTO chatbot_messages (session_id, user_id, message, is_bot, created_at) VALUES ($1, $2, $3, true, NOW())`,
      [sid, req.user.user_id, reply]
    );
    res.json({ message: reply, session_id: sid });
  } catch (err) {
    next(err);
  }
};
// ...existing code...

export const getFaqs = async (req, res, next) => {
  try {
    // Dummy FAQs, replace with real data
    res.json([
      { question: 'How do I book a test?', answer: 'Go to the booking page and select your test.' },
      { question: 'How do I view my results?', answer: 'Results are available in your dashboard.' },
    ]);
  } catch (err) {
    next(err);
  }
};
