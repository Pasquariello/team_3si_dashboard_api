import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import type MessageResponse from "./interfaces/messageResponse.js";

import * as middlewares from "./middlewares.js";
import login from "./routes/login.js";
import providerData from "./routes/providerData.js";
import providerScenario from "./routes/providerScenario.js";

const app = express();

app.use(morgan("dev"));
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get<object, MessageResponse>("/", (req, res) => {
  res.json({
    message: "🦄🌈✨👋🌎🌍🌏✨🌈🦄",
  });
});

app.use("/api/v1", login);
app.use("/api/v1/providerData", providerData);
app.use("/api/v1/scenario", providerScenario)

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

export default app;
