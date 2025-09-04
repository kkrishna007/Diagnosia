import express from 'express';
import { getAllNotifications, markAsRead, getUnreadCount } from '../controllers/notificationController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, getAllNotifications);
router.put('/:id/read', auth, markAsRead);
router.get('/unread-count', auth, getUnreadCount);

export default router;
