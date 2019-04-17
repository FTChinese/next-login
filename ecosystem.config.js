const path = require('path');
const interpreter = path.resolve(process.env.HOME, 'n/n/versions/node/11.13.0/bin/node');

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
        URL_PREFIX: "/user",
        PORT: 4100,
        DEBUG: "user*"
      },
      max_restart: 10,
      error_file: path.resolve(process.env.HOME, 'logs/next-user-err.log'),
      out_file: path.resolve(process.env.HOME, 'logs/next-user-out.log')
    }
  ],
  deploy: {
    "production": {
      user: "node",
      host: "nodeserver",
      ref: "origin/master",
      repo: "https://github.com/FTChinese/next-user.git",
      path: "/home/node/next/next-user",
      "pre-setup": "node -v",
      "post-setup": "ls -la",
      "pre-deploy-local": "echo 'Begin to deploy'",
      "post-deploy": "npm install --production && git stash && pm2 startOrRestart ecosystem.config.js --env production"
    }
  }
}
