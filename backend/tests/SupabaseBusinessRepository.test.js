import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSupabase } = vi.hoisted(() => ({
  mockSupabase: {
    from: vi.fn(),
  },
}));

vi.mock("../src/infrastructure/database/supabase.js", () => ({
  supabase: mockSupabase,
}));

import { SupabaseBusinessRepository } from "../src/modules/businesses/infrastructure/SupabaseBusinessRepository.js";

describe("SupabaseBusinessRepository", () => {
  let repository;

  beforeEach(() => {
    vi.clearAllMocks();

    repository = new SupabaseBusinessRepository(mockSupabase);
  });

  describe("create", () => {
    it("should create a business", async () => {
      const business = {
        id: "business-123",
        owner_id: "user-123",
        name: "Peluquería Laura",
        description: "Peluquería profesional",
        phone: "600123456",
        address: "Calle Mayor 10",
      };

      const single = vi.fn().mockResolvedValue({
        data: business,
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

      const result = await repository.create({
        ownerId: "user-123",
        name: "Peluquería Laura",
        description: "Peluquería profesional",
        phone: "600123456",
        address: "Calle Mayor 10",
      });

      expect(result).toEqual(business);

      expect(mockSupabase.from).toHaveBeenCalledWith("businesses");

      expect(insert).toHaveBeenCalledWith({
        owner_id: "user-123",
        name: "Peluquería Laura",
        description: "Peluquería profesional",
        phone: "600123456",
        address: "Calle Mayor 10",
      });

      expect(select).toHaveBeenCalled();

      expect(single).toHaveBeenCalled();
    });

    it("should throw an AppError when creating a business fails", async () => {
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
        repository.create({
          ownerId: "user-123",
          name: "Peluquería Laura",
          description: null,
          phone: null,
          address: null,
        }),
      ).rejects.toMatchObject({
        message: "Failed to create business: Database error",
        statusCode: 500,
      });
    });
  });

  describe("findById", () => {
    it("should find a business by id", async () => {
      const business = {
        id: "business-123",
        owner_id: "user-123",
        name: "Peluquería Laura",
      };

      const maybeSingle = vi.fn().mockResolvedValue({
        data: business,
        error: null,
      });

      const eq = vi.fn().mockReturnValue({
        maybeSingle,
      });

      const select = vi.fn().mockReturnValue({
        eq,
      });

      mockSupabase.from.mockReturnValue({
        select,
      });

      const result = await repository.findById("business-123");

      expect(result).toEqual(business);

      expect(mockSupabase.from).toHaveBeenCalledWith("businesses");

      expect(select).toHaveBeenCalledWith("*");

      expect(eq).toHaveBeenCalledWith("id", "business-123");

      expect(maybeSingle).toHaveBeenCalled();
    });

    it("should return null when the business does not exist", async () => {
      const maybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      const eq = vi.fn().mockReturnValue({
        maybeSingle,
      });

      const select = vi.fn().mockReturnValue({
        eq,
      });

      mockSupabase.from.mockReturnValue({
        select,
      });

      const result = await repository.findById("business-123");

      expect(result).toBeNull();
    });

    it("should throw an AppError when finding a business fails", async () => {
      const maybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: "Database error",
        },
      });

      const eq = vi.fn().mockReturnValue({
        maybeSingle,
      });

      const select = vi.fn().mockReturnValue({
        eq,
      });

      mockSupabase.from.mockReturnValue({
        select,
      });

      await expect(repository.findById("business-123")).rejects.toMatchObject({
        message: "Failed to find business: Database error",
        statusCode: 500,
      });
    });
  });

  describe("findByOwnerId", () => {
    it("should find businesses by owner id", async () => {
      const businesses = [
        {
          id: "business-1",
          owner_id: "user-123",
          name: "Peluquería Laura",
        },
        {
          id: "business-2",
          owner_id: "user-123",
          name: "Barbería Jordi",
        },
      ];

      const eq = vi.fn().mockResolvedValue({
        data: businesses,
        error: null,
      });

      const select = vi.fn().mockReturnValue({
        eq,
      });

      mockSupabase.from.mockReturnValue({
        select,
      });

      const result = await repository.findByOwnerId("user-123");

      expect(result).toEqual(businesses);

      expect(mockSupabase.from).toHaveBeenCalledWith("businesses");

      expect(select).toHaveBeenCalledWith("*");

      expect(eq).toHaveBeenCalledWith("owner_id", "user-123");
    });

    it("should throw an AppError when finding businesses fails", async () => {
      const eq = vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: "Database error",
        },
      });

      const select = vi.fn().mockReturnValue({
        eq,
      });

      mockSupabase.from.mockReturnValue({
        select,
      });

      await expect(repository.findByOwnerId("user-123")).rejects.toMatchObject({
        message: "Failed to find businesses: Database error",
        statusCode: 500,
      });
    });
  });

  describe("update", () => {
    it("should update a business", async () => {
      const updatedBusiness = {
        id: "business-123",
        owner_id: "user-123",
        name: "Peluquería Laura Updated",
        description: "Nueva descripción",
        phone: "600999999",
        address: "Nueva dirección",
      };

      const single = vi.fn().mockResolvedValue({
        data: updatedBusiness,
        error: null,
      });

      const select = vi.fn().mockReturnValue({
        single,
      });

      const eq = vi.fn().mockReturnValue({
        select,
      });

      const update = vi.fn().mockReturnValue({
        eq,
      });

      mockSupabase.from.mockReturnValue({
        update,
      });

      const business = {
        name: "Peluquería Laura Updated",
        description: "Nueva descripción",
        phone: "600999999",
        address: "Nueva dirección",
      };

      const result = await repository.update("business-123", business);

      expect(result).toEqual(updatedBusiness);

      expect(mockSupabase.from).toHaveBeenCalledWith("businesses");

      expect(update).toHaveBeenCalledWith({
        name: "Peluquería Laura Updated",
        description: "Nueva descripción",
        phone: "600999999",
        address: "Nueva dirección",
        updated_at: expect.any(String),
      });

      expect(eq).toHaveBeenCalledWith("id", "business-123");

      expect(select).toHaveBeenCalled();

      expect(single).toHaveBeenCalled();
    });

    it("should throw an AppError when updating a business fails", async () => {
      const single = vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: "Database error",
        },
      });

      const select = vi.fn().mockReturnValue({
        single,
      });

      const eq = vi.fn().mockReturnValue({
        select,
      });

      const update = vi.fn().mockReturnValue({
        eq,
      });

      mockSupabase.from.mockReturnValue({
        update,
      });

      await expect(
        repository.update("business-123", {
          name: "Peluquería Laura",
          description: null,
          phone: null,
          address: null,
        }),
      ).rejects.toMatchObject({
        message: "Failed to update business: Database error",
        statusCode: 500,
      });
    });
  });
});
