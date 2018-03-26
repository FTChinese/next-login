const logger = require('../utils/logger');
// redis://user:password@hostname:port/db
const redisUri = process.env.NODE_ENV === 'production' ? process.env.REDIS_URI : 'redis://@localhost:6379/';

logger.info(`Using redis ${redisUri}`);

const Redis = require('ioredis');
const nodemailer = require('nodemailer');

const redis = new Redis(redisUri, {
  keyPrefix: 'reset:'
});

const random = require('../utils/random');

const transporter = nodemailer.createTransport({
  host: process.env.MAILER_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAILER_USER,
    pass: process.env.MAILER_PASS
  }
});

exports.generateCode = function () {
  return random.hex();
};

exports.sendEmail = function({name, address, code, host}) {
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
    text: `重置密码请点击以下链接

http://${host}/password-reset/${code}
本链接三小时内有效。

FT中文网`
  };

  return transporter.sendMail(mailOptions);
};

exports.store = function({code, address}) {
  return redis.set(code, address, 'EX', 3 * 60 * 60);
};

exports.load = function(code) {
  return redis.get(code);
};

exports.delete = function(code) {
  return redis.del(code);
}


