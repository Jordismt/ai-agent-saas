import { describe, it, expect } from "vitest";
import { GetOwnedBusinessOrThrow } from "../src/modules/businesses/application/GetOwnedBusinessOrThrow.js";

describe("GetOwnedBusinessOrThrow", () => {
  it("should return the business when it belongs to the owner", async () => {
    const getOwnedBusiness = {
      execute: async () => ({
        id: "business-123",
        owner_id: "user-123",
        name: "Peluquería Laura",
      }),
    };

    const useCase = new GetOwnedBusinessOrThrow(getOwnedBusiness);

    const business = await useCase.execute("business-123", "user-123");

    expect(business.id).toBe("business-123");
    expect(business.owner_id).toBe("user-123");
  });

  it("should throw a 404 when the business does not exist", async () => {
    const getOwnedBusiness = {
      execute: async () => null,
    };

    const useCase = new GetOwnedBusinessOrThrow(getOwnedBusiness);

    await expect(useCase.execute("business-123", "user-123")).rejects.toMatchObject({
      statusCode: 404,
      message: "Business not found",
    });
  });
});
