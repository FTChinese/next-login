const path = require('path');
const nunjucks = require('nunjucks');
const util = require('util');
nunjucks.configure(
  [
    path.resolve(__dirname, '../view'),
    path.resolve(__dirname, '../client')
  ], 
  {
    noCache: process.env.NODE_ENV === 'development',
    watch: process.env.NODE_ENV === 'development'
  }
);

module.exports = util.promisify(nunjucks.render);
