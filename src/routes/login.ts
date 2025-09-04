import { Router } from "express";
import jwt from "jsonwebtoken";

import { env } from "../env.js";

const router = Router();

router.post<object, any>("/login", async (req, res) => {
  const { email, password } = req.body;

  // hardcoded user check (replace with DB lookup)
  if (email !== "team3si" || password !== "Team3siRocks") {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const payload = { email, password };
  const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: "1h" });

  res.status(200).json({ token });
});

export default router;
