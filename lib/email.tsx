import nodemailer from 'nodemailer';

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const SENDER_NAME = 'Cloud-drive';

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// Professional HTML Template
const getHtmlTemplate = (title: string, bodyContent: string, buttonText: string, buttonUrl: string, footerNote: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden; }
    .header { background-color: #2563eb; padding: 30px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; }
    .content { padding: 40px 30px; color: #374151; line-height: 1.6; }
    .content h2 { margin-top: 0; color: #111827; font-size: 20px; }
    .button-container { text-align: center; margin: 30px 0; }
    .button { display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; transition: background-color 0.2s; mso-padding-alt: 0; text-underline-color: #2563eb; }
    .button:hover { background-color: #1d4ed8; } 
    /* Force white text for all link states */
    a.button, a.button:link, a.button:visited, a.button:hover, a.button:active { color: #ffffff !important; text-decoration: none !important; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; background-color: #f9fafb; border-top: 1px solid #e5e7eb; }
    .footer p { margin: 5px 0; }
    .link-fallback { margin-top: 20px; font-size: 13px; color: #6b7280; word-break: break-all; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <h1>Cloud-drive</h1>
      </div>
      <div class="content">
        ${bodyContent}
        <div class="button-container">
          <a href="${buttonUrl}" class="button" target="_blank" style="color: #ffffff !important; text-decoration: none;">${buttonText}</a>
        </div>
        <div class="link-fallback">
          <p>Or paste this link in your browser:</p>
          <a href="${buttonUrl}" style="color: #2563eb;">${buttonUrl}</a>
        </div>
      </div>
      <div class="footer">
        <p>${footerNote}</p>
        <p>&copy; ${new Date().getFullYear()} Cloud-drive. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

  const title = 'Verify Your Email';
  const body = `
    <h2>Welcome to Cloud-drive!</h2>
    <p>Thank you for signing up. To start using your cloud storage, please verify your email address by clicking the button below.</p>
  `;
  const footer = 'This verification link will expire in 24 hours.';

  const html = getHtmlTemplate(title, body, 'Verify Email', verificationUrl, footer);

  const mailOptions = {
    from: `"${SENDER_NAME}" <${EMAIL_USER}>`,
    to: email,
    subject: `Verify your ${SENDER_NAME} account`,
    html: html,
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('[v0] Email send error:', error);
        reject(error);
      } else {
        console.log('[v0] Verification email sent to:', email);
        resolve(info);
      }
    });
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

  const title = 'Reset Your Password';
  const body = `
    <h2>Password Reset Request</h2>
    <p>We received a request to reset your password for your Cloud-drive account. If you didn't make this request, you can safely ignore this email.</p>
  `;
  const footer = 'This password reset link will expire in 1 hour.';

  const html = getHtmlTemplate(title, body, 'Reset Password', resetUrl, footer);

  const mailOptions = {
    from: `"${SENDER_NAME}" <${EMAIL_USER}>`,
    to: email,
    subject: `${SENDER_NAME} Password Reset`,
    html: html,
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('[v0] Email send error:', error);
        reject(error);
      } else {
        console.log('[v0] Password reset email sent to:', email);
        resolve(info);
      }
    });
  });
}
