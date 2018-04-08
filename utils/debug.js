const debug = require('debug');

module.exports = function(namespace) {
  const error = debug(namespace);
  const log = debug(namespace);
  log.log = console.log.bind(console);

  return {
    log,
    error
  };
}