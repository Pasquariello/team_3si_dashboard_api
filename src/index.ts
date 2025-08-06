/* eslint-disable no-console */
import http from "node:http";

import app from "./app.js";
import { env } from "./env.js";

const port = env.PORT || 3000;
const server = http.createServer(app).listen(port, () => {
  console.log("Listening (HTTP): ", port);
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
