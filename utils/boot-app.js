const package = require('../package.json');

/**
 * @param {Application} app
 * @param {String} appName
 * @param {Number} port
 */
module.exports = async function bootUp(app, appName=package.name, port=process.env.PORT) {
  console.log(`Booting ${appName}`);

  // Create HTTP server
  const server = app.listen(port || 3000);

  // Logging server error.
  server.on('error', (error) => {
    console.error('Server error: %o', error);
  });

  // Listening event handler
  server.on('listening', () => {
    console.log('%s running on port %o', appName, server.address());
  });
}