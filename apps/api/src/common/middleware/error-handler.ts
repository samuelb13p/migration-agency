import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { HttpError } from "../http-error";

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    return res.status(422).json({
      error: "validation_error",
      message: "Validation failed",
      details: error.flatten(),
    });
  }

  if (error instanceof HttpError) {
    return res.status(error.statusCode).json({
      error: "request_error",
      message: error.message,
      details: error.details,
    });
  }

  console.error(error);
  return res.status(500).json({
    error: "internal_server_error",
    message: "An unexpected error occurred.",
  });
}
