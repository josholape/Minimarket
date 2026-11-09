const nodemailer = require('nodemailer');

const emailConfigured = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);
const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);

// Created once, so a warm server instance can reuse it. The timeouts stop a
// stuck connection from hanging the request.
const transporter = emailConfigured
  ? nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // implicit TLS on port 465
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    })
  : null;

// Names are typed by users, so never put them into HTML unescaped
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function sendResetEmail(user, link) {
  if (!transporter) {
    if (isProduction) {
      // Never print reset links in production logs: anyone who can read them could take over accounts
      console.warn('Password reset requested, but email is not configured (EMAIL_USER / EMAIL_PASS).');
    } else {
      console.log('\n=== PASSWORD RESET (dev mode, email not configured) ===');
      console.log(`To:   ${user.email}`);
      console.log(`Link: ${link}\n`);
    }
    return;
  }

  try {
    // Must be awaited: on serverless hosting, work still running after the response is paused
    await transporter.sendMail({
      from: `"MiniMarket" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Reset your MiniMarket password',
      text:
        `Hi ${user.name},\n\n` +
        `Use this link to set a new password (it works for one hour):\n${link}\n\n` +
        `If you didn't ask for this, you can ignore this email.`,
      html:
        `<p>Hi ${escapeHtml(user.name)},</p>` +
        `<p><a href="${link}">Set a new password</a> (the link works for one hour).</p>` +
        `<p>If you didn't ask for this, you can ignore this email.</p>`,
    });
  } catch (err) {
    // Log it, but don't throw: an error here would tell an attacker that the email exists
    console.error('Could not send reset email:', err.message);
  }
}

module.exports = sendResetEmail;