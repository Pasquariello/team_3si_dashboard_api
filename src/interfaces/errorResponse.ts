import type MessageResponse from "./messageResponse.js";

type ErrorResponse = {
  stack?: string;
} & MessageResponse;
export default ErrorResponse;
