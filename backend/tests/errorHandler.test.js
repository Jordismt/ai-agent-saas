import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { errorHandler } from "../src/shared/middleware/errorHandler.js";
import { AppError } from "../src/shared/errors/AppError.js";

describe("errorHandler", () => {
  it("should return 400 for a ZodError", () => {
    const schema = z.object({
      name: z.string(),
    });

    let error;

    try {
      schema.parse({
        name: 123,
      });
    } catch (err) {
      error = err;
    }

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    errorHandler(error, {}, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: expect.any(String),
    });
  });

  it("should return the status code from an AppError", () => {
    const error = new AppError("Business not found", 404);

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    errorHandler(error, {}, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: "Business not found",
    });
  });

  it("should return 500 for an unknown error", () => {
    const error = new Error("Something went wrong");

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    errorHandler(error, {}, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Internal server error",
    });

    consoleSpy.mockRestore();
  });
});
