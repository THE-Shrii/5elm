const nodemailer = require('nodemailer');

// Create transporter (singleton pattern for better performance)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // use TLS (true for 465, false for other ports)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Verify connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email server connection failed:", error.message);
  } else {
    console.log("✅ Email server is ready to send messages!");
  }
});

const sendEmail = async (options) => {

  // Message options
  const message = {
    from: `${process.env.FROM_NAME || '5ELM'} <${process.env.SMTP_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message
  };

  // Add HTML if provided
  if (options.html) {
    message.html = options.html;
  }

  // Send email
  const info = await transporter.sendMail(message);
  console.log('📧 Email sent: ', info.messageId);
  return info;
};

module.exports = sendEmail;
