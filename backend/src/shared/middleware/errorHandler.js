import { ZodError } from "zod";
import { AppError } from "../errors/AppError.js";

export function errorHandler(error, req, res, _next) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: error.issues[0].message,
    });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: error.message,
    });
  }

  console.error(error);

  return res.status(500).json({
    error: "Internal server error",
  });
}
