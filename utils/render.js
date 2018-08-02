const path = require('path');
const nunjucks = require('nunjucks');
const util = require('util');
nunjucks.configure(
  [
    path.resolve(__dirname, '../views'),
    path.resolve(__dirname, '../client')
  ], 
  {
    noCache: true,
    watch: false
  }
);

module.exports = util.promisify(nunjucks.render);
