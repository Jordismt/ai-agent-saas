import { describe, it, expect, vi } from "vitest";
import { BusinessController } from "../src/modules/businesses/presentation/BusinessController.js";

describe("BusinessController", () => {
  it("should create a business", async () => {
    const businessRepository = {
      create: vi.fn().mockResolvedValue({
        id: "business-123",
        owner_id: "user-123",
        name: "Peluquería Laura",
      }),
    };

    const businessServiceRepository = {};

    const controller = new BusinessController({
      businessRepository,
      businessServiceRepository,
    });

    const req = {
      user: {
        id: "user-123",
      },
      body: {
        name: "Peluquería Laura",
        description: "Peluquería y barbería",
        phone: "600000000",
        address: "Calle Mayor 10",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    await controller.create(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);

    expect(res.json).toHaveBeenCalledWith({
      id: "business-123",
      owner_id: "user-123",
      name: "Peluquería Laura",
    });

    expect(next).not.toHaveBeenCalled();

    expect(businessRepository.create).toHaveBeenCalledTimes(1);
  });

  it("should pass validation errors to next", async () => {
    const businessRepository = {
      create: vi.fn(),
    };

    const businessServiceRepository = {};

    const controller = new BusinessController({
      businessRepository,
      businessServiceRepository,
    });

    const req = {
      user: {
        id: "user-123",
      },
      body: {
        name: "",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    await controller.create(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    expect(next.mock.calls[0][0]).toBeInstanceOf(Error);

    expect(businessRepository.create).not.toHaveBeenCalled();

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("should return an owned business by id", async () => {
    const businessRepository = {
      findById: vi.fn().mockResolvedValue({
        id: "business-123",
        owner_id: "user-123",
        name: "Peluquería Laura",
      }),
    };

    const businessServiceRepository = {};

    const controller = new BusinessController({
      businessRepository,
      businessServiceRepository,
    });

    const req = {
      user: {
        id: "user-123",
      },
      params: {
        id: "business-123",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    await controller.getById(req, res, next);

    expect(res.status).not.toHaveBeenCalled();

    expect(res.json).toHaveBeenCalledWith({
      id: "business-123",
      owner_id: "user-123",
      name: "Peluquería Laura",
    });

    expect(next).not.toHaveBeenCalled();

    expect(businessRepository.findById).toHaveBeenCalledWith("business-123");
  });

  it("should pass a 404 error to next when the business is not owned", async () => {
    const businessRepository = {
      findById: vi.fn().mockResolvedValue(null),
    };

    const businessServiceRepository = {};

    const controller = new BusinessController({
      businessRepository,
      businessServiceRepository,
    });

    const req = {
      user: {
        id: "user-123",
      },
      params: {
        id: "business-123",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    await controller.getById(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    expect(next.mock.calls[0][0]).toMatchObject({
      statusCode: 404,
      message: "Business not found",
    });

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();

    expect(businessRepository.findById).toHaveBeenCalledWith("business-123");
  });

  it("should return the services of an owned business", async () => {
    const businessRepository = {
      findById: vi.fn().mockResolvedValue({
        id: "business-123",
        owner_id: "user-123",
        name: "Peluquería Laura",
      }),
    };

    const businessServiceRepository = {
      findByBusinessId: vi.fn().mockResolvedValue([
        {
          id: "service-1",
          business_id: "business-123",
          name: "Corte de pelo",
          price: 15,
        },
        {
          id: "service-2",
          business_id: "business-123",
          name: "Corte premium",
          price: 25,
        },
      ]),
    };

    const controller = new BusinessController({
      businessRepository,
      businessServiceRepository,
    });

    const req = {
      user: {
        id: "user-123",
      },
      params: {
        id: "business-123",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    await controller.getServices(req, res, next);

    expect(res.json).toHaveBeenCalledWith([
      {
        id: "service-1",
        business_id: "business-123",
        name: "Corte de pelo",
        price: 15,
      },
      {
        id: "service-2",
        business_id: "business-123",
        name: "Corte premium",
        price: 25,
      },
    ]);

    expect(next).not.toHaveBeenCalled();

    expect(businessRepository.findById).toHaveBeenCalledWith("business-123");

    expect(businessServiceRepository.findByBusinessId).toHaveBeenCalledWith("business-123");
  });

  it("should create a service for an owned business", async () => {
    const businessRepository = {
      findById: vi.fn().mockResolvedValue({
        id: "business-123",
        owner_id: "user-123",
        name: "Peluquería Laura",
      }),
    };

    const businessServiceRepository = {
      create: vi.fn().mockResolvedValue({
        id: "service-123",
        business_id: "business-123",
        name: "Corte premium",
        description: "Corte premium con acabado",
        price: 25,
        duration_minutes: 45,
      }),
    };

    const controller = new BusinessController({
      businessRepository,
      businessServiceRepository,
    });

    const req = {
      user: {
        id: "user-123",
      },
      params: {
        id: "business-123",
      },
      body: {
        name: "Corte premium",
        description: "Corte premium con acabado",
        price: 25,
        duration_minutes: 45,
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    await controller.createService(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);

    expect(res.json).toHaveBeenCalledWith({
      id: "service-123",
      business_id: "business-123",
      name: "Corte premium",
      description: "Corte premium con acabado",
      price: 25,
      duration_minutes: 45,
    });

    expect(next).not.toHaveBeenCalled();

    expect(businessRepository.findById).toHaveBeenCalledWith("business-123");

    expect(businessServiceRepository.create).toHaveBeenCalledWith("business-123", {
      name: "Corte premium",
      description: "Corte premium con acabado",
      price: 25,
      duration_minutes: 45,
    });
  });

  it("should delete a service from an owned business", async () => {
    const businessRepository = {
      findById: vi.fn().mockResolvedValue({
        id: "business-123",
        owner_id: "user-123",
        name: "Peluquería Laura",
      }),
    };

    const businessServiceRepository = {
      delete: vi.fn().mockResolvedValue({
        id: "service-123",
        business_id: "business-123",
        name: "Corte premium",
        price: 25,
      }),
    };

    const controller = new BusinessController({
      businessRepository,
      businessServiceRepository,
    });

    const req = {
      user: {
        id: "user-123",
      },
      params: {
        id: "business-123",
        serviceId: "service-123",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    await controller.deleteService(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      id: "service-123",
      business_id: "business-123",
      name: "Corte premium",
      price: 25,
    });

    expect(next).not.toHaveBeenCalled();

    expect(businessRepository.findById).toHaveBeenCalledWith("business-123");

    expect(businessServiceRepository.delete).toHaveBeenCalledWith("business-123", "service-123");
  });

  it("should update a service from an owned business", async () => {
    const businessRepository = {
      findById: vi.fn().mockResolvedValue({
        id: "business-123",
        owner_id: "user-123",
        name: "Peluquería Laura",
      }),
    };

    const businessServiceRepository = {
      update: vi.fn().mockResolvedValue({
        id: "service-123",
        business_id: "business-123",
        name: "Corte premium",
        description: "Corte premium actualizado",
        price: 30,
        duration_minutes: 50,
      }),
    };

    const controller = new BusinessController({
      businessRepository,
      businessServiceRepository,
    });

    const req = {
      user: {
        id: "user-123",
      },
      params: {
        id: "business-123",
        serviceId: "service-123",
      },
      body: {
        name: "Corte premium",
        description: "Corte premium actualizado",
        price: 30,
        duration_minutes: 50,
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    await controller.updateService(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      id: "service-123",
      business_id: "business-123",
      name: "Corte premium",
      description: "Corte premium actualizado",
      price: 30,
      duration_minutes: 50,
    });

    expect(next).not.toHaveBeenCalled();

    expect(businessRepository.findById).toHaveBeenCalledWith("business-123");

    expect(businessServiceRepository.update).toHaveBeenCalledWith("business-123", "service-123", {
      name: "Corte premium",
      description: "Corte premium actualizado",
      price: 30,
      duration_minutes: 50,
    });
  });

  it("should pass validation errors to next when creating an invalid service", async () => {
    const businessRepository = {
      findById: vi.fn(),
    };

    const businessServiceRepository = {
      create: vi.fn(),
    };

    const controller = new BusinessController({
      businessRepository,
      businessServiceRepository,
    });

    const req = {
      user: {
        id: "user-123",
      },
      params: {
        id: "business-123",
      },
      body: {
        name: "",
        description: "Servicio inválido",
        price: -10,
        duration_minutes: 0,
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    await controller.createService(req, res, next);

    expect(next).toHaveBeenCalled();

    expect(businessRepository.findById).not.toHaveBeenCalled();

    expect(businessServiceRepository.create).not.toHaveBeenCalled();
  });

  it("should pass validation errors to next when updating an invalid service", async () => {
    const businessRepository = {
      findById: vi.fn(),
    };

    const businessServiceRepository = {
      update: vi.fn(),
    };

    const controller = new BusinessController({
      businessRepository,
      businessServiceRepository,
    });

    const req = {
      user: {
        id: "user-123",
      },
      params: {
        id: "business-123",
        serviceId: "service-123",
      },
      body: {
        name: "",
        description: "Servicio inválido",
        price: -10,
        duration_minutes: 0,
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    await controller.updateService(req, res, next);

    expect(next).toHaveBeenCalled();

    expect(businessRepository.findById).not.toHaveBeenCalled();

    expect(businessServiceRepository.update).not.toHaveBeenCalled();
  });

  it("should pass a 404 error to next when deleting a service from a business that is not owned", async () => {
    const businessRepository = {
      findById: vi.fn().mockResolvedValue({
        id: "business-123",
        owner_id: "other-user-456",
        name: "Otro negocio",
      }),
    };

    const businessServiceRepository = {
      delete: vi.fn(),
    };

    const controller = new BusinessController({
      businessRepository,
      businessServiceRepository,
    });

    const req = {
      user: {
        id: "user-123",
      },
      params: {
        id: "business-123",
        serviceId: "service-123",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    await controller.deleteService(req, res, next);

    expect(next).toHaveBeenCalled();

    expect(next.mock.calls[0][0]).toMatchObject({
      statusCode: 404,
      message: "Business not found",
    });

    expect(businessServiceRepository.delete).not.toHaveBeenCalled();
  });

  it("should pass a 404 error to next when updating a service from a business that is not owned", async () => {
    const businessRepository = {
      findById: vi.fn().mockResolvedValue({
        id: "business-123",
        owner_id: "other-user-456",
        name: "Otro negocio",
      }),
    };

    const businessServiceRepository = {
      update: vi.fn(),
    };

    const controller = new BusinessController({
      businessRepository,
      businessServiceRepository,
    });

    const req = {
      user: {
        id: "user-123",
      },
      params: {
        id: "business-123",
        serviceId: "service-123",
      },
      body: {
        name: "Corte premium",
        description: "Corte actualizado",
        price: 30,
        duration_minutes: 50,
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    await controller.updateService(req, res, next);

    expect(next).toHaveBeenCalled();

    expect(next.mock.calls[0][0]).toMatchObject({
      statusCode: 404,
      message: "Business not found",
    });

    expect(businessServiceRepository.update).not.toHaveBeenCalled();
  });

  it("should pass a 404 error to next when creating a service for a business that does not exist", async () => {
    const businessRepository = {
      findById: vi.fn().mockResolvedValue(null),
    };

    const businessServiceRepository = {
      create: vi.fn(),
    };

    const controller = new BusinessController({
      businessRepository,
      businessServiceRepository,
    });

    const req = {
      user: {
        id: "user-123",
      },
      params: {
        id: "business-123",
      },
      body: {
        name: "Corte premium",
        description: "Corte premium con acabado",
        price: 25,
        duration_minutes: 45,
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    await controller.createService(req, res, next);

    expect(next).toHaveBeenCalled();

    expect(next.mock.calls[0][0]).toMatchObject({
      statusCode: 404,
      message: "Business not found",
    });

    expect(businessServiceRepository.create).not.toHaveBeenCalled();
  });

  it("should pass a 404 error to next when getting services from a business that is not owned", async () => {
    const businessRepository = {
      findById: vi.fn().mockResolvedValue(null),
    };

    const businessServiceRepository = {
      findByBusinessId: vi.fn(),
    };

    const controller = new BusinessController({
      businessRepository,
      businessServiceRepository,
    });

    const req = {
      user: {
        id: "user-123",
      },
      params: {
        id: "business-123",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    await controller.getServices(req, res, next);

    expect(next).toHaveBeenCalled();

    expect(next.mock.calls[0][0]).toMatchObject({
      statusCode: 404,
      message: "Business not found",
    });

    expect(businessServiceRepository.findByBusinessId).not.toHaveBeenCalled();
  });

  it("should pass a 404 error to next when deleting a service from a business that does not exist", async () => {
    const businessRepository = {
      findById: vi.fn().mockResolvedValue(null),
    };

    const businessServiceRepository = {
      delete: vi.fn(),
    };

    const controller = new BusinessController({
      businessRepository,
      businessServiceRepository,
    });

    const req = {
      user: {
        id: "user-123",
      },
      params: {
        id: "business-123",
        serviceId: "service-123",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    await controller.deleteService(req, res, next);

    expect(next).toHaveBeenCalled();

    expect(next.mock.calls[0][0]).toMatchObject({
      statusCode: 404,
      message: "Business not found",
    });

    expect(businessServiceRepository.delete).not.toHaveBeenCalled();
  });

  it("should pass a 404 error to next when updating a service from a business that does not exist", async () => {
    const businessRepository = {
      findById: vi.fn().mockResolvedValue(null),
    };

    const businessServiceRepository = {
      update: vi.fn(),
    };

    const controller = new BusinessController({
      businessRepository,
      businessServiceRepository,
    });

    const req = {
      user: {
        id: "user-123",
      },
      params: {
        id: "business-123",
        serviceId: "service-123",
      },
      body: {
        name: "Corte premium",
        description: "Corte actualizado",
        price: 30,
        duration_minutes: 50,
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    await controller.updateService(req, res, next);

    expect(next).toHaveBeenCalled();

    expect(next.mock.calls[0][0]).toMatchObject({
      statusCode: 404,
      message: "Business not found",
    });

    expect(businessServiceRepository.update).not.toHaveBeenCalled();
  });
});
