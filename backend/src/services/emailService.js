const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send email using Resend
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @param {string} html
 * @returns {Promise<{success: boolean, error?: string}>}
 */
const sendEmail = async (to, subject, text, html = null) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY environment variable is required");
    }

    if (!process.env.FROM_EMAIL) {
      throw new Error("FROM_EMAIL environment variable is required");
    }

    if (!to || !subject || !text) {
      throw new Error("Missing required email parameters: to, subject, or text");
    }

    const emailData = {
      from: `${process.env.FROM_NAME || "StormNeighbor"} <${process.env.FROM_EMAIL}>`,
      to: [to.trim()],
      subject: subject.trim(),
      text: text.trim(),
      html: html || generateDefaultHtml(subject, text),
    };

    console.log(`Sending email to ${to}: ${subject}`);
    const response = await resend.emails.send(emailData);

    console.log("Email sent successfully:", {
      to,
      subject,
      messageId: response.data?.id,
    });

    return {
      success: true,
      messageId: response.data?.id,
    };
  } catch (error) {
    console.error("Email send error:", {
      to,
      subject,
      error: error.message,
    });

    if (error.message && error.message.includes("API key")) {
      console.error("Check your RESEND_API_KEY configuration");
    }

    return {
      success: false,
      error: error.message,
    };
  }
};

const sendVerificationEmail = async (to, code) => {
  const subject = "Verify your StormNeighbor account";
  const text = `Welcome to StormNeighbor! Your verification code is: ${code}. This code expires in 24 hours.`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify your account</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to StormNeighbor!</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
            <h2 style="color: #333; margin-top: 0;">Verify Your Email Address</h2>
            
            <p>Thank you for joining StormNeighbor! To complete your registration, please use the verification code below:</p>
            
            <div style="background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #666;">Your verification code:</p>
                <h1 style="margin: 10px 0; font-size: 32px; color: #667eea; letter-spacing: 4px; font-family: monospace;">${code}</h1>
            </div>
            
            <p><strong>Important:</strong> This code expires in 24 hours for security reasons.</p>
            
            <p>If you didn't create an account with StormNeighbor, please ignore this email.</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #666;">
                This email was sent by StormNeighbor. If you have questions, please contact us at support@stormneighbor.com
            </p>
        </div>
    </body>
    </html>
  `;

  return sendEmail(to, subject, text, html);
};

const sendPasswordResetEmail = async (to, code) => {
  const subject = "Reset your StormNeighbor password";
  const text = `You requested a password reset for your StormNeighbor account. Your reset code is: ${code}. This code expires in 1 hour.`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
            <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
            
            <p>You requested a password reset for your StormNeighbor account. Use the code below to reset your password:</p>
            
            <div style="background: white; border: 2px solid #e74c3c; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #666;">Your reset code:</p>
                <h1 style="margin: 10px 0; font-size: 32px; color: #e74c3c; letter-spacing: 4px; font-family: monospace;">${code}</h1>
            </div>
            
            <p><strong>Important:</strong> This code expires in 1 hour for security reasons.</p>
            
            <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #666;">
                This email was sent by StormNeighbor. If you have questions, please contact us at support@stormneighbor.com
            </p>
        </div>
    </body>
    </html>
  `;

  return sendEmail(to, subject, text, html);
};

const generateDefaultHtml = (subject, text) => {
  return `
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
};

const testEmailService = async () => {
  try {
    console.log("Testing email service configuration...");

    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    if (!process.env.FROM_EMAIL) {
      throw new Error("FROM_EMAIL not configured");
    }

    console.log("Email service configuration is valid");
    return { success: true };
  } catch (error) {
    console.error("Email service test failed:", error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  testEmailService,
};
