import { describe, it, expect } from "vitest";
import { GetBusinessById } from "../src/modules/businesses/application/GetBusinessById.js";

describe("GetBusinessById", () => {
  it("should return a business by its id", async () => {
    const repository = {
      findById: async (id) => ({
        id,
        owner_id: "user-123",
        name: "Peluquería Laura",
      }),
    };

    const getBusinessById = new GetBusinessById(repository);

    const business = await getBusinessById.execute("business-123");

    expect(business.id).toBe("business-123");
    expect(business.owner_id).toBe("user-123");
    expect(business.name).toBe("Peluquería Laura");
  });
});
