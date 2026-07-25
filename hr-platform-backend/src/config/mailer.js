const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let transporterPromise;

async function getTransporter() {
  if (!transporterPromise) {
    transporterPromise = (async () => {
      const testAccount = await nodemailer.createTestAccount();

      const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      logger.info(`Ethereal test account created: ${testAccount.user}`);
      return transporter;
    })();
  }
  return transporterPromise;
}

async function sendPasswordResetEmail(toEmail, resetLink) {
  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: '"HR Platform" <no-reply@hrplatform.com>',
    to: toEmail,
    subject: 'Password Reset Request',
    text: `You requested a password reset. Click this link to reset your password: ${resetLink}\n\nThis link expires in 30 minutes. If you did not request this, ignore this email.`,
    html: `<p>You requested a password reset.</p><p><a href="${resetLink}">Click here to reset your password</a></p><p>This link expires in 30 minutes. If you did not request this, ignore this email.</p>`,
  });

  logger.info(`Password reset email sent. Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
  return info;
}

module.exports = { sendPasswordResetEmail };
