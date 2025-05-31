import * as postmark from 'postmark';

const client = new postmark.ServerClient(process.env.POSTMARK_API_KEY);

/**
 * Send a templated email via Postmark
 * @param {string} to - Recipient email
 * @param {string} templateId - Postmark template ID
 * @param {object} templateModel - Object with variables to inject into the template
 * @returns {Promise<object>} - Postmark API response
 */
export const sendTemplateEmail = async (to, templateId, templateModel) => {
  try {
    const response = await client.sendEmailWithTemplate({
      From: process.env.EMAIL_FROM,
      To: to,
      TemplateId: templateId,
      TemplateModel: templateModel,
    });
    console.log('Template email sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Error sending template email:', error);
    throw error;
  }
};

/**
 * Send a standard email via Postmark
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} textBody - Plain text email body
 * @param {string} htmlBody - HTML email body
 * @returns {Promise<object>} - Postmark API response
 */
export const sendEmail = async (to, subject, textBody, htmlBody) => {
  try {
    const response = await client.sendEmail({
      From: process.env.EMAIL_FROM,
      To: to,
      Subject: subject,
      TextBody: textBody,
      HtmlBody: htmlBody,
    });
    console.log('Email sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send a batch of emails via Postmark
 * @param {Array<object>} messages - Array of message objects
 * @returns {Promise<object>} - Postmark API response
 */
export const sendBatchEmails = async (messages) => {
  try {
    // Ensure all messages have the From field set
    const formattedMessages = messages.map(msg => ({
      ...msg,
      From: msg.From || process.env.EMAIL_FROM
    }));
    
    const response = await client.sendEmailBatch(formattedMessages);
    console.log('Batch emails sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Error sending batch emails:', error);
    throw error;
  }
};

/**
 * Get email delivery stats from Postmark
 * @returns {Promise<object>} - Postmark API response with delivery stats
 */
export const getEmailDeliveryStats = async () => {
  try {
    const response = await client.getDeliveryStats();
    console.log('Email delivery stats:', response);
    return response;
  } catch (error) {
    console.error('Error getting email delivery stats:', error);
    throw error;
  }
};
