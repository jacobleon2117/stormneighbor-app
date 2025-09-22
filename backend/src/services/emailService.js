const { Resend } = require("resend");
const logger = require("../utils/logger");

const getResendClient = () => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY environment variable is required");
  }
  return new Resend(process.env.RESEND_API_KEY);
};

const sendEmail = async (to, subject, text, html = null) => {
  try {
    if (!process.env.FROM_EMAIL) {
      throw new Error("FROM_EMAIL environment variable is required");
    }
    if (!to || !subject || !text) {
      throw new Error("Missing required email parameters: to, subject, or text");
    }

    const resend = getResendClient();
    const emailData = {
      from: `${process.env.FROM_NAME || "StormNeighbor"} <${process.env.FROM_EMAIL}>`,
      to: [to.trim()],
      subject: subject.trim(),
      text: text.trim(),
      html: html || generateDefaultHtml(subject, text),
    };

    logger.info(`Sending email to ${to}: ${subject}`);
    const response = await resend.emails.send(emailData);

    logger.info("Email sent successfully", {
      to,
      subject,
      messageId: response.data?.id,
    });

    return {
      success: true,
      messageId: response.data?.id,
      providerResponse: response.data,
    };
  } catch (error) {
    logger.error("Email send error", {
      to,
      subject,
      error: error.message,
    });

    if (error.message?.includes("API key")) {
      logger.error("Check your RESEND_API_KEY configuration");
    }

    return { success: false, error: error.message };
  }
};

const generateStyledEmail = (title, bodyText, code, accentColor, expiryText) => `
  <!DOCTYPE html>
  <html>
  <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">${title}</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
          <p>${bodyText}</p>
          <div style="background: white; border: 2px solid ${accentColor}; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #666;">Your code:</p>
              <h1 style="margin: 10px 0; font-size: 32px; color: ${accentColor}; letter-spacing: 4px; font-family: monospace;">${code}</h1>
          </div>
          <p><strong>Important:</strong> ${expiryText}</p>
          <p>If you didn’t request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">
              This email was sent by StormNeighbor. If you have questions, please contact us at support@stormneighbor.com
          </p>
      </div>
  </body>
  </html>
`;

const sendVerificationEmail = (to, code) => {
  const subject = "Verify your StormNeighbor account";
  const text = `Welcome to StormNeighbor! Your verification code is: ${code}. This code expires in 24 hours.`;
  const html = generateStyledEmail(
    "Welcome to StormNeighbor!",
    "Thank you for joining StormNeighbor! To complete your registration, use the verification code below:",
    code,
    "#667eea",
    "This code expires in 24 hours for security reasons."
  );
  return sendEmail(to, subject, text, html);
};

const sendPasswordResetEmail = (to, code) => {
  const subject = "Reset your StormNeighbor password";
  const text = `You requested a password reset for your StormNeighbor account. Your reset code is: ${code}. This code expires in 1 hour.`;
  const html = generateStyledEmail(
    "Password Reset",
    "You requested a password reset for your StormNeighbor account. Use the code below to reset your password:",
    code,
    "#e74c3c",
    "This code expires in 1 hour for security reasons."
  );
  return sendEmail(to, subject, text, html);
};

const generateDefaultHtml = (subject, text) => `
  <!DOCTYPE html>
  <html>
  <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">StormNeighbor</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #ddd;">
          <div style="white-space: pre-line;">${text}</div>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">
              This email was sent by StormNeighbor. If you have questions, please contact us at support@stormneighbor.com
          </p>
      </div>
  </body>
  </html>
`;

const testEmailService = async () => {
  try {
    logger.info("Testing email service configuration...");

    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }
    if (!process.env.FROM_EMAIL) {
      throw new Error("FROM_EMAIL not configured");
    }

    logger.info("Email service configuration is valid");
    return { success: true };
  } catch (error) {
    logger.error("Email service test failed:", error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  testEmailService,
};
