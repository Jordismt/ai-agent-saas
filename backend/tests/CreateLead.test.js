import { describe, it, expect } from "vitest";
import { CreateLead } from "../src/modules/leads/application/CreateLead.js";

describe("CreateLead", () => {
  it("should create a lead with phone", async () => {
    const repository = {
      create: async (lead) => lead,
    };

    const createLead = new CreateLead(repository);

    const lead = await createLead.execute({
      businessId: "business-123",
      conversationId: "conversation-123",
      name: "Jordi",
      phone: "600000000",
    });

    expect(lead.businessId).toBe("business-123");
    expect(lead.conversationId).toBe("conversation-123");
    expect(lead.name).toBe("Jordi");
    expect(lead.phone).toBe("600000000");
    expect(lead.email).toBeNull();
    expect(lead.status).toBe("new");
  });

  it("should create a lead with email", async () => {
    const repository = {
      create: async (lead) => lead,
    };

    const createLead = new CreateLead(repository);

    const lead = await createLead.execute({
      businessId: "business-123",
      email: "jordi@example.com",
    });

    expect(lead.businessId).toBe("business-123");
    expect(lead.phone).toBeNull();
    expect(lead.email).toBe("jordi@example.com");
    expect(lead.status).toBe("new");
  });

  it("should normalize optional strings", async () => {
    const repository = {
      create: async (lead) => lead,
    };

    const createLead = new CreateLead(repository);

    const lead = await createLead.execute({
      businessId: "business-123",
      name: "  Jordi  ",
      phone: "  600000000  ",
      email: "  jordi@example.com  ",
      notes: "  Quiere información  ",
    });

    expect(lead.name).toBe("Jordi");
    expect(lead.phone).toBe("600000000");
    expect(lead.email).toBe("jordi@example.com");
    expect(lead.notes).toBe("Quiere información");
  });

  it("should reject a lead without phone or email", async () => {
    const repository = {
      create: async (lead) => lead,
    };

    const createLead = new CreateLead(repository);

    await expect(
      createLead.execute({
        businessId: "business-123",
        name: "Jordi",
      }),
    ).rejects.toMatchObject({
      message: "A lead requires at least a phone or email",
      statusCode: 400,
    });
  });
});
