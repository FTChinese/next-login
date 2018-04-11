const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAILER_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAILER_USER,
    pass: process.env.MAILER_PASS
  }
});

module.exports = function ({name, address, subject, text}) {
  const mailOptions = {
    from: {
      name: 'FT中文网',
      address: 'report@ftchinese.com'
    },
    to: {
      name: name || '',
      address
    },
    subject,
    text
  };

  return transporter.sendMail(mailOptions);
};