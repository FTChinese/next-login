const Redis = require('ioredis');
// redis://user:password@hostname:port/db
const redisUri = process.env.NODE_ENV === 'production' ? process.env.REDIS_URI : 'redis://@localhost:6379/';

module.exports = function(options) {
  return new new Redis(redisUri, opitons);
};