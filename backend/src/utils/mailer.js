const fs = require('node:fs');
const path = require('node:path');
const nodemailer = require('nodemailer');
const env = require('../config/env');

let cachedTransporter = null;

function getTransporter() {
  const { host, port, secure, user, pass } = env.smtp;

  if (!user || !pass) {
    return null;
  }

  if (!cachedTransporter) {
    const isGmail = host.includes('gmail.com');
    const options = isGmail
      ? {
          service: 'gmail',
          auth: { user, pass },
        }
      : {
          host,
          port,
          secure,
          auth: { user, pass },
          tls: { rejectUnauthorized: false },
        };

    cachedTransporter = nodemailer.createTransport(options);
  }

  return cachedTransporter;
}

function getLogoWhiteAttachment() {
  const localAsset = path.resolve(__dirname, '../assets/logo-white.png');
  const frontendAsset = path.resolve(__dirname, '../../../frontend/public/logo-white.png');
  const filePath = fs.existsSync(localAsset)
    ? localAsset
    : fs.existsSync(frontendAsset)
      ? frontendAsset
      : null;

  if (filePath) {
    return {
      filename: 'dexfora-logo.png',
      path: filePath,
      cid: 'dexfora-logo-white',
    };
  }
  return null;
}

/**
 * Verify SMTP connection
 */
async function verifySmtp() {
  const transporter = getTransporter();
  if (!transporter) {
    return {
      connected: false,
      configured: false,
      message: 'SMTP credentials missing. Please set SMTP_USER and SMTP_PASS (Gmail App Password) in backend/.env',
    };
  }

  try {
    await transporter.verify();
    return { connected: true, configured: true, message: 'Gmail SMTP connection verified successfully.' };
  } catch (error) {
    return {
      connected: false,
      configured: true,
      error: error.message,
      message: `Failed to connect to SMTP server: ${error.message}`,
    };
  }
}

/**
 * Send Subscription Welcome Email with temporary password and password creation link
 */
async function sendSubscriptionWelcomeEmail({
  to,
  name,
  firmName,
  plan,
  seats,
  temporaryPassword,
  setupToken,
  clientUrl,
}) {
  const baseUrl = clientUrl || env.clientUrl || 'http://localhost:3000';
  const setupUrl = setupToken
    ? `${baseUrl}/set-password?token=${setupToken}&email=${encodeURIComponent(to)}`
    : `${baseUrl}/login?email=${encodeURIComponent(to)}`;
  const loginUrl = `${baseUrl}/login?email=${encodeURIComponent(to)}`;

  const subject = `Welcome to DexFora — Your ${firmName} Workspace is Ready (${plan})`;

  const textContent = `Welcome to DexFora, ${name}!

Your law firm workspace for "${firmName}" has been successfully provisioned on DexFora (${plan} plan, ${seats} seats).

Your initial login credentials:
• Firm: ${firmName}
• Username / Email: ${to}
• Temporary Password: ${temporaryPassword}

Set up your own private password using this secure link:
${setupUrl}

Alternatively, you can sign in at:
${loginUrl}

Note: For security and client confidentiality, you will be prompted to set your permanent private password before accessing matter dockets and documents.

DexFora Practice Management System
Support: dexforaofficial@gmail.com | +91 84470 14799`;

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Welcome to DexFora</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
    .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(7, 27, 73, 0.08); border: 1px solid #e2e8f0; }
    .email-header { background: #071B49; padding: 32px 36px 26px; text-align: left; }
    .email-logo-img { height: 38px; width: auto; max-width: 200px; display: block; border: 0; outline: none; margin-top: 6px; }
    .email-kicker { font-size: 11px; text-transform: uppercase; letter-spacing: 0.14em; color: #94a3b8; margin-bottom: 6px; font-weight: 700; }
    .email-body { padding: 36px; line-height: 1.6; }
    .greeting { font-size: 18px; font-weight: 700; color: #071B49; margin-top: 0; margin-bottom: 12px; }
    .lead-text { font-size: 15px; color: #334155; margin-bottom: 24px; }
    .plan-pill { display: inline-block; background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 99px; font-size: 12px; font-weight: 700; }
    .credentials-box { background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 22px; margin: 24px 0; }
    .credentials-box h3 { margin: 0 0 14px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #475569; }
    .cred-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    .cred-row:last-child { border-bottom: none; }
    .cred-label { color: #64748b; font-weight: 500; }
    .cred-value { color: #071B49; font-weight: 700; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .temp-pass { background: #fee2e2; color: #991b1b; padding: 3px 8px; border-radius: 4px; font-size: 13px; font-weight: 800; }
    .cta-container { text-align: center; margin: 32px 0 24px; }
    .cta-button { display: inline-block; background: #0047D9; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 30px; border-radius: 8px; box-shadow: 0 4px 14px rgba(0, 71, 217, 0.35); }
    .security-callout { background: #eff6ff; border-left: 4px solid #008CFF; padding: 14px 16px; margin: 24px 0; border-radius: 0 8px 8px 0; font-size: 13px; color: #1e3a8a; }
    .link-alt { font-size: 12px; color: #64748b; word-break: break-all; margin-top: 18px; }
    .email-footer { background: #f1f5f9; padding: 24px 36px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
    .email-footer a { color: #0047D9; text-decoration: none; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <div class="email-kicker">Practice Management Workspace</div>
      <img src="cid:dexfora-logo-white" alt="DexFora" class="email-logo-img" />
    </div>
    <div class="email-body">
      <h2 class="greeting">Welcome, ${name}!</h2>
      <p class="lead-text">
        Your firm workspace for <strong>${firmName}</strong> is ready. You have been provisioned as Firm Administrator on the <strong>${plan}</strong> plan (<span class="plan-pill">${seats} Seats</span>).
      </p>

      <div class="credentials-box">
        <h3>Your Authorized Credentials</h3>
        <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
          <tr>
            <td style="color:#64748b;width:35%;">Firm Name:</td>
            <td style="color:#071B49;font-weight:700;">${firmName}</td>
          </tr>
          <tr>
            <td style="color:#64748b;">Username / Email:</td>
            <td style="color:#071B49;font-weight:700;font-family:monospace;">${to}</td>
          </tr>
          <tr>
            <td style="color:#64748b;">Temporary Password:</td>
            <td><span class="temp-pass">${temporaryPassword}</span></td>
          </tr>
        </table>
      </div>

      <div class="cta-container">
        <a href="${setupUrl}" class="cta-button" target="_blank">
          Create Your Password &amp; Open Workspace &rarr;
        </a>
      </div>

      <div class="security-callout">
        <strong>🔒 Zero-Trust Protection:</strong>
        This temporary password must be changed before accessing your matters, cause lists, and client documents. The setup link expires in 7 days.
      </div>

      <p class="link-alt">
        If the button above does not work, copy and paste this link into your browser:<br>
        <a href="${setupUrl}" style="color:#0047D9;">${setupUrl}</a>
      </p>
    </div>
    <div class="email-footer">
      <p style="margin:0 0 6px;">© 2026 DexFora · Confidential Legal Practice Management System</p>
      <p style="margin:0;">Support: <a href="mailto:dexforaofficial@gmail.com">dexforaofficial@gmail.com</a> · +91 84470 14799</p>
    </div>
  </div>
</body>
</html>`;

  const transporter = getTransporter();

  if (!transporter) {
    console.warn(`[DexFora Mailer] Gmail SMTP credentials not configured. Email to ${to} was not dispatched.`);
    return {
      sent: false,
      configured: false,
      reason: 'SMTP_CREDENTIALS_MISSING',
      message: 'Gmail App Password is not configured in backend/.env',
      preview: { to, subject, setupUrl, temporaryPassword },
    };
  }

  try {
    const logoAttachment = getLogoWhiteAttachment();
    const attachments = logoAttachment ? [logoAttachment] : [];

    const info = await transporter.sendMail({
      from: env.smtp.from,
      to,
      subject,
      text: textContent,
      html: htmlContent,
      attachments,
    });

    console.log(`[DexFora Mailer] Subscription welcome email sent to ${to}: ${info.messageId}`);
    return {
      sent: true,
      configured: true,
      messageId: info.messageId,
      preview: { to, subject, setupUrl },
    };
  } catch (error) {
    console.error(`[DexFora Mailer] Error sending email to ${to}:`, error.message);
    return {
      sent: false,
      configured: true,
      error: error.message,
      reason: 'SMTP_SEND_FAILED',
      preview: { to, subject, setupUrl, temporaryPassword },
    };
  }
}

/**
 * Send Team Member Invitation Email
 */
async function sendTeamInviteEmail({
  to,
  name,
  firmName,
  role,
  temporaryPassword,
  setupToken,
  clientUrl,
}) {
  const baseUrl = clientUrl || env.clientUrl || 'http://localhost:3000';
  const setupUrl = setupToken
    ? `${baseUrl}/set-password?token=${setupToken}&email=${encodeURIComponent(to)}`
    : `${baseUrl}/login?email=${encodeURIComponent(to)}`;

  const subject = `You've been added to ${firmName} on DexFora`;

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to DexFora</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
    .email-container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(7, 27, 73, 0.08); border: 1px solid #e2e8f0; }
    .email-header { background: #071B49; padding: 28px 32px 22px; text-align: left; }
    .email-logo-img { height: 34px; width: auto; max-width: 180px; display: block; border: 0; outline: none; margin-top: 4px; }
    .email-kicker { font-size: 11px; text-transform: uppercase; letter-spacing: 0.14em; color: #94a3b8; margin-bottom: 6px; font-weight: 700; }
    .email-body { padding: 32px; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <div class="email-kicker">Practice Management Workspace</div>
      <img src="cid:dexfora-logo-white" alt="DexFora" class="email-logo-img" />
    </div>
    <div class="email-body">
      <h2 style="color:#071B49;margin-top:0;">Hello ${name},</h2>
      <p>You have been invited to join <strong>${firmName}</strong> on DexFora as an <strong>${role}</strong>.</p>
      <div style="background:#f8fafc;border:1.5px solid #cbd5e1;border-radius:8px;padding:18px;margin:20px 0;">
        <p style="margin:4px 0;font-size:14px;"><strong>Username:</strong> ${to}</p>
        <p style="margin:4px 0;font-size:14px;"><strong>Temporary Password:</strong> <span style="background:#fee2e2;color:#991b1b;padding:2px 8px;border-radius:4px;font-weight:bold;font-family:monospace;">${temporaryPassword}</span></p>
      </div>
      <div style="text-align:center;margin:28px 0;">
        <a href="${setupUrl}" style="background:#0047D9;color:#fff;text-decoration:none;padding:12px 26px;border-radius:8px;font-weight:bold;display:inline-block;font-size:14px;">Set Your Password &amp; Join Firm &rarr;</a>
      </div>
      <p style="font-size:12px;color:#64748b;">Direct link: <a href="${setupUrl}" style="color:#0047D9;">${setupUrl}</a></p>
    </div>
  </div>
</body>
</html>`;

  const transporter = getTransporter();
  if (!transporter) {
    return { sent: false, configured: false, reason: 'SMTP_CREDENTIALS_MISSING' };
  }

  try {
    const logoAttachment = getLogoWhiteAttachment();
    const attachments = logoAttachment ? [logoAttachment] : [];

    const info = await transporter.sendMail({
      from: env.smtp.from,
      to,
      subject,
      html: htmlContent,
      attachments,
    });
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    return { sent: false, error: error.message };
  }
}

/**
 * Send New Enquiry Notification to DexFora Team (dexforaofficial@gmail.com)
 */
async function sendEnquiryNotificationEmail({ name, firm, email, phone, plan, message }) {
  const transporter = getTransporter();
  if (!transporter) {
    return { sent: false, configured: false, reason: 'SMTP_CREDENTIALS_MISSING' };
  }

  const subject = `🔔 New Subscription Enquiry: ${firm} (${plan || 'General'})`;
  const adminRecipient = env.smtp.user || 'dexforaofficial@gmail.com';

  const textContent = `New DexFora Subscription Enquiry!

From: ${name}
Firm / Chambers: ${firm}
Email: ${email}
Phone: ${phone || 'Not provided'}
Interested Plan: ${plan || 'General enquiry'}

Message:
${message}

Submitted at: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)
Reply directly to this email to respond to the prospect.`;

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>New Subscription Enquiry</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
    .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(7, 27, 73, 0.08); border: 1px solid #e2e8f0; }
    .email-header { background: #071B49; padding: 28px 32px; text-align: left; }
    .email-logo-img { height: 34px; width: auto; max-width: 180px; display: block; border: 0; margin-top: 6px; }
    .email-kicker { font-size: 11px; text-transform: uppercase; letter-spacing: 0.14em; color: #00D9E8; font-weight: 800; }
    .email-body { padding: 32px; line-height: 1.6; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 99px; font-size: 12px; font-weight: 700; background: #e0f2fe; color: #0369a1; }
    .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; background: #f8fafc; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; }
    .info-table td { padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    .info-table tr:last-child td { border-bottom: none; }
    .info-label { font-weight: 700; color: #475569; width: 35%; }
    .info-val { color: #071B49; font-weight: 600; }
    .message-box { background: #f1f5f9; border-left: 4px solid #0047D9; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0; font-size: 14px; color: #1e293b; white-space: pre-wrap; }
    .cta-button { display: inline-block; background: #0047D9; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 24px; border-radius: 6px; }
    .email-footer { background: #f1f5f9; padding: 18px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <span class="email-kicker">New Commercial Enquiry</span>
      <img src="cid:dexfora-logo-white" alt="DexFora" class="email-logo-img" />
    </div>
    <div class="email-body">
      <h2 style="margin: 0 0 12px; color: #071B49; font-size: 20px;">New Prospect Connection Request</h2>
      <p style="margin: 0 0 16px; color: #475569; font-size: 14px;">An advocate or firm has requested a conversation through the DexFora landing page.</p>

      <table class="info-table">
        <tr><td class="info-label">Advocate / Contact</td><td class="info-val">${name}</td></tr>
        <tr><td class="info-label">Firm / Chambers</td><td class="info-val"><strong>${firm}</strong></td></tr>
        <tr><td class="info-label">Work Email</td><td class="info-val"><a href="mailto:${email}" style="color: #0047D9;">${email}</a></td></tr>
        <tr><td class="info-label">Phone</td><td class="info-val">${phone || '—'}</td></tr>
        <tr><td class="info-label">Requested Plan</td><td class="info-val"><span class="badge">${plan || 'General / Not specified'}</span></td></tr>
        <tr><td class="info-label">Submitted At</td><td class="info-val">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })} IST</td></tr>
      </table>

      <h4 style="margin: 20px 0 8px; color: #071B49; font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em;">Enquiry Message:</h4>
      <div class="message-box">${message}</div>

      <div style="text-align: center; margin: 24px 0 12px;">
        <a href="mailto:${email}?subject=DexFora%20Practice%20Management%20%E2%80%94%20Connecting%20regarding%20your%20enquiry" class="cta-button">
          ✉️ Reply to ${name}
        </a>
      </div>
    </div>
    <div class="email-footer">
      DexFora Commercial Inbound Dispatcher · <a href="mailto:${adminRecipient}">${adminRecipient}</a>
    </div>
  </div>
</body>
</html>`;

  try {
    const logoAttachment = getLogoWhiteAttachment();
    const attachments = logoAttachment ? [logoAttachment] : [];

    const info = await transporter.sendMail({
      from: env.smtp.from,
      to: adminRecipient,
      replyTo: email,
      subject,
      text: textContent,
      html: htmlContent,
      attachments,
    });
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    return { sent: false, error: error.message };
  }
}

/**
 * Send Automatic Confirmation to Prospective Subscriber
 */
async function sendEnquiryConfirmationToUser({ name, firm, email, plan }) {
  const transporter = getTransporter();
  if (!transporter) {
    return { sent: false, configured: false, reason: 'SMTP_CREDENTIALS_MISSING' };
  }

  const subject = `We received your DexFora enquiry — ${firm}`;

  const textContent = `Dear ${name},

Thank you for reaching out to DexFora. We have received your enquiry for "${firm}" regarding our legal practice management software (${plan || 'Chambers'}).

Our practice onboarding team is reviewing your requirements and will connect with you shortly to schedule a walkthrough and confirm your private workspace setup.

If you have urgent questions, you can reach us directly:
• Phone / WhatsApp: +91 84470 14799
• Email: dexforaofficial@gmail.com
• Hours: Monday–Saturday · 09:30–19:30 IST

Warm regards,
DexFora Practice Management Team
https://dexfora.com`;

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>DexFora Enquiry Confirmation</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
    .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(7, 27, 73, 0.08); border: 1px solid #e2e8f0; }
    .email-header { background: #071B49; padding: 28px 32px; text-align: left; }
    .email-logo-img { height: 34px; width: auto; max-width: 180px; display: block; border: 0; margin-top: 6px; }
    .email-kicker { font-size: 11px; text-transform: uppercase; letter-spacing: 0.14em; color: #00D9E8; font-weight: 800; }
    .email-body { padding: 32px; line-height: 1.6; }
    .greeting { font-size: 18px; font-weight: 700; color: #071B49; margin-top: 0; margin-bottom: 12px; }
    .lead-text { font-size: 14px; color: #334155; margin-bottom: 20px; }
    .summary-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 20px; margin: 20px 0; font-size: 14px; }
    .summary-box strong { color: #071B49; }
    .contact-card { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px 20px; margin: 24px 0; font-size: 13px; color: #1e3a8a; }
    .email-footer { background: #f1f5f9; padding: 20px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <span class="email-kicker">Practice Onboarding</span>
      <img src="cid:dexfora-logo-white" alt="DexFora" class="email-logo-img" />
    </div>
    <div class="email-body">
      <h2 class="greeting">Hello ${name},</h2>
      <p class="lead-text">Thank you for your interest in <strong>DexFora Legal Practice Management</strong>. We have successfully received your enquiry.</p>

      <div class="summary-box">
        <div><strong>Firm / Practice:</strong> ${firm}</div>
        <div style="margin-top: 6px;"><strong>Requested Plan:</strong> ${plan || 'Chambers'}</div>
        <div style="margin-top: 6px;"><strong>Your Email:</strong> ${email}</div>
      </div>

      <p style="font-size: 14px; color: #475569;">
        Our team connects directly with every prospective practice to understand your team structure, recommend the best configuration, and schedule a personalized walkthrough before setting up your private workspace.
      </p>

      <div class="contact-card">
        <strong>Need immediate assistance?</strong>
        <div style="margin-top: 6px;">📞 Phone / WhatsApp: <strong>+91 84470 14799</strong></div>
        <div style="margin-top: 4px;">✉️ Direct Email: <strong>dexforaofficial@gmail.com</strong></div>
        <div style="margin-top: 4px;">🕒 Support Hours: Monday–Saturday · 09:30–19:30 IST</div>
      </div>
    </div>
    <div class="email-footer">
      DexFora Practice Management · Built for Indian Courts, Registries &amp; Legal Teams<br/>
      <span style="font-size: 11px; color: #94a3b8;">© 2026 DexFora. All rights reserved.</span>
    </div>
  </div>
</body>
</html>`;

  try {
    const logoAttachment = getLogoWhiteAttachment();
    const attachments = logoAttachment ? [logoAttachment] : [];

    const info = await transporter.sendMail({
      from: env.smtp.from,
      to: email,
      subject,
      text: textContent,
      html: htmlContent,
      attachments,
    });
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    return { sent: false, error: error.message };
  }
}

module.exports = {
  verifySmtp,
  sendSubscriptionWelcomeEmail,
  sendTeamInviteEmail,
  sendEnquiryNotificationEmail,
  sendEnquiryConfirmationToUser,
};
