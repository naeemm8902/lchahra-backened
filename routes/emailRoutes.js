import express from 'express';
import { sendWelcomeEmail, sendOtpEmail, sendTestEmail, getEmailStats } from '../controllers/emailController.js';

const router = express.Router();

// Template-based email endpoints
router.post('/welcome', sendWelcomeEmail);
router.post('/otp', sendOtpEmail);

// Simple test email endpoint for Postmark testing
router.post('/test', sendTestEmail);

// Email statistics endpoint
router.get('/stats', getEmailStats);

export default router;
