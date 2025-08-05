import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import type MessageResponse from "./interfaces/message-response.js";

import api from "./api/index.js";

import dataRoutes from './routes/dataRoutes.js';
import providerData from './routes/providerData';

import * as middlewares from "./middlewares.js";

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

app.use("/api/v1", api);

app.use('/api/v1/foo', dataRoutes);

app.use('/api/v1/providerData', providerData);


app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

export default app;
