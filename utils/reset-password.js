const Redis = require('ioredis');
const logger = require('../utils/logger');
const random = require('../utils/random');
const sendEmail = require('./send-email');

// redis://user:password@hostname:port/db
const redisUri = process.env.NODE_ENV === 'production' ? process.env.REDIS_URI : 'redis://@localhost:6379/';

logger.info(`Using redis ${redisUri}`);

const redis = new Redis(redisUri, {
  keyPrefix: 'reset:'
});

exports.generateCode = function () {
  return random.hex();
};

exports.sendEmail = function ({name, address, host, code}={}) {
  return sendEmail({
    name,
    address,
    subject: '[FTC]重置密码',
    text: `重置密码请点击以下链接

http://${host}/password-reset/${code}
本链接三小时内有效。

FT中文网`
  });
}

exports.store = function({code, address}) {
  return redis.set(code, address, 'EX', 3 * 60 * 60);
};

exports.load = function(code) {
  return redis.get(code);
};

exports.delete = function(code) {
  return redis.del(code);
}


