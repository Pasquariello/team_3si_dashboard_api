import express from "express";

import type MessageResponse from "../interfaces/message-response.js";

import databricks from "./databricks.js";
import emojis from "./emojis.js";

const router = express.Router();

router.get<object, MessageResponse>("/", (req, res) => {
  res.json({
    message: "API - 👋🌎🌍🌏",
  });
});

router.use("/emojis", emojis);
router.use("/databricks", databricks);

export default router;
