import { describe, it, expect } from "vitest";
import { UpdateBusinessService } from "../src/modules/businesses/application/UpdateBusinessService.js";

describe("UpdateBusinessService", () => {
  it("should update a business service", async () => {
    const repository = {
      update: async (businessId, serviceId, serviceData) => ({
        id: serviceId,
        business_id: businessId,
        ...serviceData,
      }),
    };

    const updateBusinessService = new UpdateBusinessService(repository);

    const service = await updateBusinessService.execute("business-123", "service-123", {
      name: "Corte premium",
      description: "Corte premium con acabado",
      price: 25,
      duration_minutes: 45,
    });

    expect(service.id).toBe("service-123");
    expect(service.business_id).toBe("business-123");
    expect(service.name).toBe("Corte premium");
    expect(service.price).toBe(25);
    expect(service.duration_minutes).toBe(45);
  });
});
