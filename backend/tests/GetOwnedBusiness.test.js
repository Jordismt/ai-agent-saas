import { describe, it, expect } from "vitest";
import { GetOwnedBusiness } from "../src/modules/businesses/application/GetOwnedBusiness.js";

describe("GetOwnedBusiness", () => {
  it("should return the business when it belongs to the owner", async () => {
    const repository = {
      findById: async () => ({
        id: "business-123",
        owner_id: "user-123",
        name: "Peluquería Laura",
      }),
    };

    const getOwnedBusiness = new GetOwnedBusiness(repository);

    const business = await getOwnedBusiness.execute("business-123", "user-123");

    expect(business).not.toBeNull();
    expect(business.id).toBe("business-123");
    expect(business.owner_id).toBe("user-123");
  });

  it("should return null when the business belongs to another owner", async () => {
    const repository = {
      findById: async () => ({
        id: "business-123",
        owner_id: "other-user",
        name: "Peluquería Laura",
      }),
    };

    const getOwnedBusiness = new GetOwnedBusiness(repository);

    const business = await getOwnedBusiness.execute("business-123", "user-123");

    expect(business).toBeNull();
  });

  it("should return null when the business does not exist", async () => {
    const repository = {
      findById: async () => null,
    };

    const getOwnedBusiness = new GetOwnedBusiness(repository);

    const business = await getOwnedBusiness.execute("business-123", "user-123");

    expect(business).toBeNull();
  });
});
