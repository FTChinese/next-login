const path = require('path');
const interpreter = path.resolve(process.env.HOME, 'n/n/versions/node/9.9.0/bin/node');

module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps : [
    {
      name      : "next-user",
      script    : "./index.js",
      cwd: __dirname,
      interpreter: interpreter,
      env: {
        NODE_ENV: "development",
        PORT: 4100,
        DEBUG: "user*"
      },
      env_production : {
        NODE_ENV: "production",
        PORT: 4100,
        DEBUG: "user*"
      },
      max_restart: 10,
      error_file: path.resolve(process.env.HOME, 'logs/login-err.log'),
      out_file: path.resolve(process.env.HOME, 'logs/login-out.log')
    }
  ]
}
