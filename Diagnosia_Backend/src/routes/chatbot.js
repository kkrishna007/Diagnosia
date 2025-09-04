import express from 'express';
import { sendMessage, getFaqs } from '../controllers/chatbotController.js';

const router = express.Router();

router.post('/message', sendMessage);
router.get('/faqs', getFaqs);

export default router;
