/* eslint-disable no-console */
import fs from "node:fs";
import https from "node:https";

import app from "./app.js";
import { env } from "./env.js";

const port = env.PORT || 3000;
const sslCert = env.SSL_CERT_PATH
const sslKey = env.SSL_KEY_PATH

const httpsOptions = {
  key: fs.readFileSync(sslKey || "./cert/key.pem"),
  cert: fs.readFileSync(sslCert || "./cert/cert.pem"),
};

const server = https.createServer(httpsOptions, app).listen(port, () => {
  console.log('Listening (HTTPS):');
  console.table([
  { "Address Type": "localhost", URL: `https://localhost:${port}` },
  { "Address Type": "IPv4 (127.0.0.1)", URL: `https://127.0.0.1:${port}` },
  { "Address Type": "IPv6 (::1)", URL: `https://[::1]:${port}` },
]);

   
});

server.on("error", (err) => {
  if ("code" in err && err.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use. Please choose another port or stop the process using it.`);
  }
  else {
    console.error("Failed to start server:", err);
  }
  process.exit(1);
});
