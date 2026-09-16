import { describe, it, expect } from "vitest";
import { CreateBusiness } from "../src/modules/businesses/application/CreateBusiness.js";

describe("CreateBusiness", () => {
  it("should create a business", async () => {
    const repository = {
      create: async (business) => business,
    };

    const createBusiness = new CreateBusiness(repository);

    const business = await createBusiness.execute({
      ownerId: "user-123",
      name: "Peluquería Laura",
      description: "Peluquería y barbería",
      phone: "600000000",
      address: "Calle Mayor 10",
    });

    expect(business.name).toBe("Peluquería Laura");
    expect(business.ownerId).toBe("user-123");
  });
});
