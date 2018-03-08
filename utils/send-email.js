const debug = require('debug')('user:email');
const nodemailer = require('nodemailer');
const minify = require('html-minifier').minify;
const path = require('path');

const transporter = nodemailer.createTransport({
  host: process.env.MAILER_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAILER_USER,
    pass: process.env.MAILER_PASS
  }
});


module.exports = async function({name, address, code}) {

  const mailOptions = {
    from: {
      name: 'FT中文网',
      address: 'report@ftchinese.com'
    },
    to: {
      name: name || '',
      address
    },
    subject: '[FTC]重置密码',
    text: `Reset your password by clicking http://localhost:4100/password-reset/${code}`
  };

  return transporter.sendMail(mailOptions);
};
