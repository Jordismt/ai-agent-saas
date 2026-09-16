import { describe, it, expect } from "vitest";
import { GetBusinessServices } from "../src/modules/businesses/application/GetBusinessServices.js";

describe("GetBusinessServices", () => {
  it("should return the services of a business", async () => {
    const repository = {
      findByBusinessId: async (businessId) => [
        {
          id: "service-1",
          business_id: businessId,
          name: "Corte de pelo",
          price: 15,
        },
        {
          id: "service-2",
          business_id: businessId,
          name: "Corte premium",
          price: 25,
        },
      ],
    };

    const getBusinessServices = new GetBusinessServices(repository);

    const services = await getBusinessServices.execute("business-123");

    expect(services).toHaveLength(2);
    expect(services[0].business_id).toBe("business-123");
    expect(services[0].name).toBe("Corte de pelo");
    expect(services[1].name).toBe("Corte premium");
  });
});
