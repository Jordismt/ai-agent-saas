import { describe, it, expect, vi } from "vitest";

import { LeadController } from "../src/modules/leads/presentation/LeadController.js";

describe("LeadController", () => {
  function createResponse() {
    return {
      statusCode: 200,
      body: null,

      status(code) {
        this.statusCode = code;
        return this;
      },

      json(data) {
        this.body = data;
        return this;
      },
    };
  }

  it("should allow owner to get business leads", async () => {
    const leads = [
      {
        id: "lead-1",
        business_id: "business-123",
        phone: "600000000",
        status: "new",
      },
    ];

    const leadRepository = {
      findByBusinessId: async () => leads,
    };

    const businessRepository = {
      findById: async () => ({
        id: "business-123",
        owner_id: "user-123",
      }),
    };

    const controller = new LeadController({
      leadRepository,
      businessRepository,
    });

    const req = {
      params: {
        businessId: "business-123",
      },
      user: {
        id: "user-123",
      },
    };

    const res = createResponse();
    const next = vi.fn();

    await controller.getByBusinessId(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.body).toEqual(leads);
  });

  it("should reject access to leads from another user's business", async () => {
    const findByBusinessId = vi.fn();

    const leadRepository = {
      findByBusinessId,
    };

    const businessRepository = {
      findById: async () => ({
        id: "business-123",
        owner_id: "another-user",
      }),
    };

    const controller = new LeadController({
      leadRepository,
      businessRepository,
    });

    const req = {
      params: {
        businessId: "business-123",
      },
      user: {
        id: "user-123",
      },
    };

    const res = createResponse();
    const next = vi.fn();

    await controller.getByBusinessId(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(findByBusinessId).not.toHaveBeenCalled();
  });

  it("should reject updating a lead belonging to another user", async () => {
    const update = vi.fn();

    const leadRepository = {
      findById: async () => ({
        id: "lead-123",
        business_id: "business-123",
        phone: "600000000",
        status: "new",
      }),
      update,
    };

    const businessRepository = {
      findById: async () => ({
        id: "business-123",
        owner_id: "another-user",
      }),
    };

    const controller = new LeadController({
      leadRepository,
      businessRepository,
    });

    const req = {
      params: {
        id: "lead-123",
      },
      body: {
        status: "contacted",
      },
      user: {
        id: "user-123",
      },
    };

    const res = createResponse();
    const next = vi.fn();

    await controller.updateStatus(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it("should return 404 when updating a missing lead", async () => {
    const leadRepository = {
      findById: async () => null,
    };

    const businessRepository = {};

    const controller = new LeadController({
      leadRepository,
      businessRepository,
    });

    const req = {
      params: {
        id: "missing-lead",
      },
      body: {
        status: "contacted",
      },
      user: {
        id: "user-123",
      },
    };

    const res = createResponse();
    const next = vi.fn();

    await controller.updateStatus(req, res, next);

    expect(next).toHaveBeenCalledOnce();

    const error = next.mock.calls[0][0];

    expect(error).toMatchObject({
      message: "Lead not found",
      statusCode: 404,
    });
  });
});
