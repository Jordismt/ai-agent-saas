import { describe, it, expect, vi } from "vitest";

import { UpdateLeadStatus } from "../src/modules/leads/application/UpdateLeadStatus.js";

describe("UpdateLeadStatus", () => {
  it("should update lead from new to contacted", async () => {
    const lead = {
      id: "lead-123",
      business_id: "business-123",
      phone: "600000000",
      status: "new",
    };

    const repository = {
      findById: async () => lead,
      update: async (id, data) => ({
        ...data,
        id,
      }),
    };

    const updateLeadStatus = new UpdateLeadStatus(repository);

    const result = await updateLeadStatus.execute("lead-123", "contacted");

    expect(result.status).toBe("contacted");
  });

  it("should update lead from contacted to qualified", async () => {
    const repository = {
      findById: async () => ({
        id: "lead-123",
        status: "contacted",
      }),
      update: async (id, data) => ({
        ...data,
        id,
      }),
    };

    const updateLeadStatus = new UpdateLeadStatus(repository);

    const result = await updateLeadStatus.execute("lead-123", "qualified");

    expect(result.status).toBe("qualified");
  });

  it("should update lead from qualified to won", async () => {
    const repository = {
      findById: async () => ({
        id: "lead-123",
        status: "qualified",
      }),
      update: async (id, data) => ({
        ...data,
        id,
      }),
    };

    const updateLeadStatus = new UpdateLeadStatus(repository);

    const result = await updateLeadStatus.execute("lead-123", "won");

    expect(result.status).toBe("won");
  });

  it("should update lead from qualified to lost", async () => {
    const repository = {
      findById: async () => ({
        id: "lead-123",
        status: "qualified",
      }),
      update: async (id, data) => ({
        ...data,
        id,
      }),
    };

    const updateLeadStatus = new UpdateLeadStatus(repository);

    const result = await updateLeadStatus.execute("lead-123", "lost");

    expect(result.status).toBe("lost");
  });

  it("should not update when status is already the same", async () => {
    const update = vi.fn();

    const lead = {
      id: "lead-123",
      status: "new",
    };

    const repository = {
      findById: async () => lead,
      update,
    };

    const updateLeadStatus = new UpdateLeadStatus(repository);

    const result = await updateLeadStatus.execute("lead-123", "new");

    expect(result).toBe(lead);
    expect(update).not.toHaveBeenCalled();
  });

  it("should reject an invalid status", async () => {
    const repository = {
      findById: async () => null,
      update: async () => null,
    };

    const updateLeadStatus = new UpdateLeadStatus(repository);

    await expect(updateLeadStatus.execute("lead-123", "whatever")).rejects.toMatchObject({
      message: "Invalid lead status: whatever",
      statusCode: 400,
    });
  });

  it("should return 404 when lead does not exist", async () => {
    const repository = {
      findById: async () => null,
      update: async () => null,
    };

    const updateLeadStatus = new UpdateLeadStatus(repository);

    await expect(updateLeadStatus.execute("lead-123", "contacted")).rejects.toMatchObject({
      message: "Lead not found",
      statusCode: 404,
    });
  });

  it("should reject when lead id is missing", async () => {
    const repository = {
      findById: async () => null,
      update: async () => null,
    };

    const updateLeadStatus = new UpdateLeadStatus(repository);

    await expect(updateLeadStatus.execute(null, "contacted")).rejects.toMatchObject({
      message: "Lead id is required",
      statusCode: 400,
    });
  });
});
