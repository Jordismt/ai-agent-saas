import { describe, it, expect } from "vitest";
import { GetBusinesses } from "../src/modules/businesses/application/GetBusinesses.js";

describe("GetBusinesses", () => {
  it("should return the businesses of an owner", async () => {
    const repository = {
      findByOwnerId: async (ownerId) => [
        {
          id: "business-1",
          owner_id: ownerId,
          name: "Peluquería Laura",
        },
        {
          id: "business-2",
          owner_id: ownerId,
          name: "Bar Pepe",
        },
      ],
    };

    const getBusinesses = new GetBusinesses(repository);

    const businesses = await getBusinesses.execute("user-123");

    expect(businesses).toHaveLength(2);
    expect(businesses[0].owner_id).toBe("user-123");
    expect(businesses[0].name).toBe("Peluquería Laura");
    expect(businesses[1].name).toBe("Bar Pepe");
  });
});
