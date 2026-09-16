import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSupabase } = vi.hoisted(() => ({
  mockSupabase: {
    from: vi.fn(),
  },
}));

vi.mock("../src/infrastructure/database/supabase.js", () => ({
  supabase: mockSupabase,
}));

import { SupabaseBusinessServiceRepository } from "../src/modules/businesses/infrastructure/SupabaseBusinessServiceRepository.js";

describe("SupabaseBusinessServiceRepository", () => {
  let repository;

  beforeEach(() => {
    vi.clearAllMocks();

    repository = new SupabaseBusinessServiceRepository();
  });

  it("should create a business service", async () => {
    const service = {
      id: "service-123",
      business_id: "business-123",
      name: "Corte premium",
      description: "Corte con acabado",
      price: 25,
      duration_minutes: 45,
    };

    const single = vi.fn().mockResolvedValue({
      data: service,
      error: null,
    });

    const select = vi.fn().mockReturnValue({
      single,
    });

    const insert = vi.fn().mockReturnValue({
      select,
    });

    mockSupabase.from.mockReturnValue({
      insert,
    });

    const result = await repository.create("business-123", {
      name: "Corte premium",
      description: "Corte con acabado",
      price: 25,
      duration_minutes: 45,
    });

    expect(result).toEqual(service);

    expect(mockSupabase.from).toHaveBeenCalledWith("business_services");

    expect(insert).toHaveBeenCalledWith({
      business_id: "business-123",
      name: "Corte premium",
      description: "Corte con acabado",
      price: 25,
      duration_minutes: 45,
    });

    expect(single).toHaveBeenCalled();
  });

  it("should find services by business id", async () => {
    const services = [
      {
        id: "service-1",
        business_id: "business-123",
        name: "Corte",
        price: 20,
      },
      {
        id: "service-2",
        business_id: "business-123",
        name: "Color",
        price: 40,
      },
    ];

    const order = vi.fn().mockResolvedValue({
      data: services,
      error: null,
    });

    const eq = vi.fn().mockReturnValue({
      order,
    });

    const select = vi.fn().mockReturnValue({
      eq,
    });

    mockSupabase.from.mockReturnValue({
      select,
    });

    const result = await repository.findByBusinessId("business-123");

    expect(result).toEqual(services);

    expect(mockSupabase.from).toHaveBeenCalledWith("business_services");

    expect(select).toHaveBeenCalledWith("*");

    expect(eq).toHaveBeenCalledWith("business_id", "business-123");

    expect(order).toHaveBeenCalledWith("created_at", { ascending: true });
  });

  it("should delete a business service", async () => {
    const deletedService = {
      id: "service-123",
      business_id: "business-123",
      name: "Corte premium",
      price: 25,
    };

    const single = vi.fn().mockResolvedValue({
      data: deletedService,
      error: null,
    });

    const select = vi.fn().mockReturnValue({
      single,
    });

    const eqServiceId = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select,
      }),
    });

    const deleteMethod = vi.fn().mockReturnValue({
      eq: eqServiceId,
    });

    mockSupabase.from.mockReturnValue({
      delete: deleteMethod,
    });

    const result = await repository.delete("business-123", "service-123");

    expect(result).toEqual(deletedService);

    expect(mockSupabase.from).toHaveBeenCalledWith("business_services");

    expect(deleteMethod).toHaveBeenCalled();

    expect(eqServiceId).toHaveBeenCalledWith("id", "service-123");

    expect(eqServiceId.mock.results[0].value.eq).toHaveBeenCalledWith("business_id", "business-123");

    expect(select).toHaveBeenCalled();

    expect(single).toHaveBeenCalled();
  });

  it("should update a business service", async () => {
    const updatedService = {
      id: "service-123",
      business_id: "business-123",
      name: "Corte premium actualizado",
      description: "Nuevo acabado",
      price: 30,
      duration_minutes: 50,
    };

    const single = vi.fn().mockResolvedValue({
      data: updatedService,
      error: null,
    });

    const select = vi.fn().mockReturnValue({
      single,
    });

    const eqServiceId = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select,
      }),
    });

    const update = vi.fn().mockReturnValue({
      eq: eqServiceId,
    });

    mockSupabase.from.mockReturnValue({
      update,
    });

    const serviceData = {
      name: "Corte premium actualizado",
      description: "Nuevo acabado",
      price: 30,
      duration_minutes: 50,
    };

    const result = await repository.update("business-123", "service-123", serviceData);

    expect(result).toEqual(updatedService);

    expect(mockSupabase.from).toHaveBeenCalledWith("business_services");

    expect(update).toHaveBeenCalledWith({
      name: "Corte premium actualizado",
      description: "Nuevo acabado",
      price: 30,
      duration_minutes: 50,
    });

    expect(eqServiceId).toHaveBeenCalledWith("id", "service-123");

    expect(eqServiceId.mock.results[0].value.eq).toHaveBeenCalledWith("business_id", "business-123");

    expect(select).toHaveBeenCalled();

    expect(single).toHaveBeenCalled();
  });

  it("should throw an AppError when creating a business service fails", async () => {
    const single = vi.fn().mockResolvedValue({
      data: null,
      error: {
        message: "Database error",
      },
    });

    const select = vi.fn().mockReturnValue({
      single,
    });

    const insert = vi.fn().mockReturnValue({
      select,
    });

    mockSupabase.from.mockReturnValue({
      insert,
    });

    await expect(
      repository.create("business-123", {
        name: "Corte premium",
        description: "Corte con acabado",
        price: 25,
        duration_minutes: 45,
      }),
    ).rejects.toMatchObject({
      message: "Failed to create business service: Database error",
      statusCode: 500,
    });
  });

  it("should throw an AppError when finding business services fails", async () => {
    const order = vi.fn().mockResolvedValue({
      data: null,
      error: {
        message: "Database error",
      },
    });

    const eq = vi.fn().mockReturnValue({
      order,
    });

    const select = vi.fn().mockReturnValue({
      eq,
    });

    mockSupabase.from.mockReturnValue({
      select,
    });

    await expect(repository.findByBusinessId("business-123")).rejects.toMatchObject({
      message: "Failed to find business services: Database error",
      statusCode: 500,
    });
  });

  it("should throw an AppError when deleting a business service fails", async () => {
    const single = vi.fn().mockResolvedValue({
      data: null,
      error: {
        message: "Database error",
      },
    });

    const select = vi.fn().mockReturnValue({
      single,
    });

    const eqBusinessId = vi.fn().mockReturnValue({
      select,
    });

    const eqServiceId = vi.fn().mockReturnValue({
      eq: eqBusinessId,
    });

    const deleteMethod = vi.fn().mockReturnValue({
      eq: eqServiceId,
    });

    mockSupabase.from.mockReturnValue({
      delete: deleteMethod,
    });

    await expect(repository.delete("business-123", "service-123")).rejects.toMatchObject({
      message: "Failed to delete business service: Database error",
      statusCode: 500,
    });
  });

  it("should throw an AppError when updating a business service fails", async () => {
    const single = vi.fn().mockResolvedValue({
      data: null,
      error: {
        message: "Database error",
      },
    });

    const select = vi.fn().mockReturnValue({
      single,
    });

    const eqBusinessId = vi.fn().mockReturnValue({
      select,
    });

    const eqServiceId = vi.fn().mockReturnValue({
      eq: eqBusinessId,
    });

    const update = vi.fn().mockReturnValue({
      eq: eqServiceId,
    });

    mockSupabase.from.mockReturnValue({
      update,
    });

    await expect(
      repository.update("business-123", "service-123", {
        name: "Corte premium",
        description: "Corte actualizado",
        price: 30,
        duration_minutes: 50,
      }),
    ).rejects.toMatchObject({
      message: "Failed to update business service: Database error",
      statusCode: 500,
    });
  });
});
