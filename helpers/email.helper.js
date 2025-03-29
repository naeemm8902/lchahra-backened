import { createTransport } from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();
const transporter = createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
  debug: true,
});

transporter.verify((error, success) => {
  if (error) {
    console.error('Error verifying transporter: ', error);
  } else {
    console.log('Transporter is ready to send emails');
  }
});

export const sendMail = async (to, subject, text, html) => {
  const mailOptions = {
    from: process.env.EMAIL,
    to: to,
    subject: subject,
    text: text,
    html: html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return info;
  } catch (error) {
    console.error('Error sending email: ', error);
    throw error;
  }
};
