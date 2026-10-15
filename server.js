// Production entry point for hosts that start the app from a single file
// (Plesk's Node.js / Phusion Passenger). Run `npm run build` first.
const { execFileSync } = require("node:child_process");
const { createServer } = require("node:http");
const path = require("node:path");
const next = require("next");

// Apply pending migrations at startup, since this is where the host's env vars
// (DATABASE_URL) are available — Plesk's command runner doesn't pass them.
// Set SKIP_MIGRATE=1 to opt out.
if (!process.env.SKIP_MIGRATE) {
  execFileSync(process.execPath, [path.join(__dirname, "node_modules/prisma/build/index.js"), "migrate", "deploy"], {
    cwd: __dirname,
    stdio: "inherit",
  });
}

const port = Number(process.env.PORT) || 3000;
const app = next({ dev: false, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => handle(req, res)).listen(port, () => {
    console.log(`> Ready on port ${port}`);
  });
});
