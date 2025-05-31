import { sendTemplateEmail, sendEmail, getEmailDeliveryStats } from '../helpers/mailer.js';

/**
 * Send a welcome email using Postmark template
 * @param {object} req - Request object with email and name in body
 * @param {object} res - Response object
 */
export const sendWelcomeEmail = async (req, res) => {
  const { email, name } = req.body;

  if (!email || !name) {
    return res.status(400).json({ error: 'Email and name are required' });
  }

  try {
    // You need to create this template in Postmark dashboard and get its ID
    // Using a placeholder ID for now (replace with actual template ID)
    const templateId = '40229871';
    
    const result = await sendTemplateEmail(email, templateId, {
      name,
      email,
      product_name: 'Lchahra',
      company_name: 'Lchahra',
    });

    res.status(200).json({ 
      message: 'Welcome email sent successfully!',
      messageId: result.MessageID
    });
  } catch (err) {
    console.error('Error in sendWelcomeEmail:', err);
    res.status(500).json({ 
      error: 'Failed to send welcome email', 
      details: err.message 
    });
  }
};

/**
 * Send an OTP email using Postmark template
 * @param {object} req - Request object with email and otp in body
 * @param {object} res - Response object
 */
export const sendOtpEmail = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  try {
    // You need to create this template in Postmark dashboard and get its ID
    // Trying to get from env, but using a placeholder as fallback
    const templateId = process.env.POSTMARK_OTP_TEMPLATE_ID || '29231134';
    
    const result = await sendTemplateEmail(email, templateId, {
      otp,
      product_name: 'Lchahra',
    });

    res.status(200).json({ 
      message: 'OTP email sent successfully!',
      messageId: result.MessageID
    });
  } catch (err) {
    console.error('Error in sendOtpEmail:', err);
    res.status(500).json({ 
      error: 'Failed to send OTP email', 
      details: err.message 
    });
  }
};

/**
 * Test route to send a simple email via Postmark
 * @param {object} req - Request object with email, subject, and message in body
 * @param {object} res - Response object
 */
export const sendTestEmail = async (req, res) => {
  const { email, subject, message } = req.body;

  if (!email || !subject || !message) {
    return res.status(400).json({ 
      error: 'Email, subject, and message are required' 
    });
  }

  try {
    const htmlBody = `
      <html>
        <body>
          <h1>Test Email from Lchahra</h1>
          <p>${message}</p>
          <hr>
          <p>This is a test email sent from the Lchahra application.</p>
        </body>
      </html>
    `;

    const result = await sendEmail(
      email,
      subject,
      message, // Plain text version
      htmlBody // HTML version
    );

    res.status(200).json({ 
      message: 'Test email sent successfully!',
      messageId: result.MessageID 
    });
  } catch (err) {
    console.error('Error in sendTestEmail:', err);
    res.status(500).json({ 
      error: 'Failed to send test email', 
      details: err.message 
    });
  }
};

/**
 * Get Postmark delivery statistics
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const getEmailStats = async (req, res) => {
  try {
    const stats = await getEmailDeliveryStats();
    res.status(200).json(stats);
  } catch (err) {
    console.error('Error getting email stats:', err);
    res.status(500).json({ 
      error: 'Failed to get email delivery stats', 
      details: err.message 
    });
  }
};
