import Koa from "koa";
const pkg = require("../../package.json");

export default async function bootUp(app: Koa, appName: string = pkg.name, port: string = process.env.PORT) {
    console.log(`Booting ${appName}`);
    // Create HTTP server
    const server = app.listen(port || 3000);
    // Logging server error.
    server.on("error", (error) => {
      console.error("Server error: %o", error);
    });
    // Listening event handler
    server.on("listening", () => {
      console.log("%s running on port %o", appName, server.address());
    });
  }