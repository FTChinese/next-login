const path = require('path');
const nunjucks = require('nunjucks');
const markdown = require('nunjucks-markdown');
const marked = require('marked');
const util = require('util');
const env = nunjucks.configure(path.resolve(__dirname, '../views'), {
  noCache: true,
  watch: false
});
markdown.register(env, marked);

module.exports = util.promisify(nunjucks.render);
