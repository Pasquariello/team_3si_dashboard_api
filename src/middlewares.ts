import type { NextFunction, Request, Response } from "express";
import type { JwtPayload } from "jsonwebtoken";

import jwt from "jsonwebtoken";

import type ErrorResponse from "./interfaces/errorResponse.js";

import { env } from "./env.js";

export function notFound(req: Request, res: Response, next: NextFunction) {
  res.status(404);
  const error = new Error(`🔍 - Not Found - ${req.originalUrl}`);
  next(error);
}

export function errorHandler(err: Error, req: Request, res: Response<ErrorResponse>, _next: NextFunction) {
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: env.NODE_ENV === "production" ? "🥞" : err.stack,
  });
}

type AuthenticatedRequest = {
  user?: JwtPayload | string;
} & Request;

export function authenticateJWT(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET as string);
    req.user = decoded;
    next();
  }
  // eslint-disable-next-line unused-imports/no-unused-vars
  catch (_err: any) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
