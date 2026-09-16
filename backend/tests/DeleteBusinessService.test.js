import { describe, it, expect } from "vitest";
import { DeleteBusinessService } from "../src/modules/businesses/application/DeleteBusinessService.js";

describe("DeleteBusinessService", () => {
  it("should delete a business service", async () => {
    const repository = {
      delete: async (businessId, serviceId) => ({
        id: serviceId,
        business_id: businessId,
      }),
    };

    const deleteBusinessService = new DeleteBusinessService(repository);

    const service = await deleteBusinessService.execute("business-123", "service-123");

    expect(service.id).toBe("service-123");
    expect(service.business_id).toBe("business-123");
  });
});
