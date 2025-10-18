const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

// Create transporter using environment variables
const createTransporter = () => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // use TLS
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

  return transporter;
};

// Email templates directory
const templatesDir = path.join(__dirname, '../templates/emails');

// Compile email template
const compileTemplate = (templateName, data) => {
  try {
    const templatePath = path.join(templatesDir, `${templateName}.hbs`);
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(templateSource);
    return template(data);
  } catch (error) {
    console.error(`Error compiling template ${templateName}:`, error);
    throw new Error(`Email template ${templateName} not found`);
  }
};

// Send email function
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();
    
    // Compile template if provided
    let html = options.html;
    if (options.template) {
      html = compileTemplate(options.template, options.data || {});
    }

    const mailOptions = {
      from: `5ELM E-commerce <${process.env.EMAIL_FROM || 'noreply@5elm.com'}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: html
    };

    const result = await transporter.sendMail(mailOptions);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('📧 Email sent successfully!');
      console.log('Preview URL:', nodemailer.getTestMessageUrl(result));
    }

    return result;

  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error('Failed to send email');
  }
};

module.exports = {
  sendEmail,
  compileTemplate
};
