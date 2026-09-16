import { describe, it, expect } from "vitest";
import { CreateBusinessService } from "../src/modules/businesses/application/CreateBusinessService.js";

describe("CreateBusinessService", () => {
  it("should create a business service", async () => {
    const repository = {
      create: async (businessId, serviceData) => ({
        id: "service-123",
        business_id: businessId,
        ...serviceData,
      }),
    };

    const createBusinessService = new CreateBusinessService(repository);

    const service = await createBusinessService.execute("business-123", {
      name: "Corte premium",
      description: "Corte premium con acabado",
      price: 25,
      duration_minutes: 45,
    });

    expect(service.id).toBe("service-123");
    expect(service.business_id).toBe("business-123");
    expect(service.name).toBe("Corte premium");
    expect(service.description).toBe("Corte premium con acabado");
    expect(service.price).toBe(25);
    expect(service.duration_minutes).toBe(45);
  });
});
