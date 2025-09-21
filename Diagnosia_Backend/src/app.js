import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import testRoutes from './routes/tests.js';
import bookingRoutes from './routes/bookings.js';
import userRoutes from './routes/users.js';
import chatbotRoutes from './routes/chatbot.js';
import notificationRoutes from './routes/notifications.js';
import paymentRoutes from './routes/payments.js';
import reportRoutes from './routes/reports.js';
import employeeAuthRoutes from './routes/employeeAuth.js';
import employeeRoutes from './routes/employee.js';
import agentChatRoutes from './routes/agentChat.js';
import errorHandler from './middleware/errorHandler.js';
import { verifyEmailConfig } from './services/emailService.js';

dotenv.config();

const app = express();

app.use(cors());
// Accept JSON primitives (e.g. `null`) without throwing and normalize null bodies to {}
app.use(express.json({ strict: false }));
app.use((req, res, next) => {
  try {
    if (req.headers['content-type'] && req.headers['content-type'].includes('application/json') && req.body === null) {
      req.body = {};
    }
  } catch (e) {
    // ignore
  }
  return next();
});

// Health-check endpoint for Render or other platforms to monitor service
// Responds quickly with service status and uptime
app.get('/_health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/employee/auth', employeeAuthRoutes);
app.use('/api/employee', employeeRoutes);

app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/agent-chat', agentChatRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Verify SMTP configuration once server is up (non-blocking)
  verifyEmailConfig();
});
