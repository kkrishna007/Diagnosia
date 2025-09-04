import pool from '../../config/db.js';

// Get all notifications for the logged-in user
export const getAllNotifications = async (req, res, next) => {
  try {
    const notifications = await pool.query(
      `SELECT n.*, t.template_name, t.subject_template
       FROM notifications n
       LEFT JOIN notification_templates t ON n.template_id = t.template_id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC`,
      [req.user.user_id]
    );
    res.json(notifications.rows);
  } catch (err) {
    next(err);
  }
};

// Mark a notification as read (set status to delivered)
export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query(
      `UPDATE notifications SET status = 'delivered', delivered_at = NOW() WHERE notification_id = $1 AND user_id = $2`,
      [id, req.user.user_id]
    );
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    next(err);
  }
};

// Get unread notification count
export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await pool.query(
      `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND status != 'delivered'`,
      [req.user.user_id]
    );
    res.json({ unread: parseInt(count.rows[0].count, 10) });
  } catch (err) {
    next(err);
  }
};
