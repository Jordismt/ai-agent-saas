import { describe, it, expect, vi, beforeEach } from "vitest";

import { SupabaseBookingRepository } from "../src/modules/bookings/infrastructure/SupabaseBookingRepository.js";

describe("SupabaseBookingRepository", () => {
  let repository;

  const mockSupabase = {
    from: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    repository = new SupabaseBookingRepository(mockSupabase);
  });

  describe("create", () => {
    const booking = {
      businessId: "business-123",
      serviceId: "service-123",
      conversationId: "conversation-123",
      leadId: "lead-123",

      customerName: "Jordi",
      customerPhone: "600000000",
      customerEmail: "jordi@example.com",

      serviceName: "Corte",
      durationMinutes: 30,
      price: 20,

      startsAt: "2026-09-25T15:00:00.000Z",
      endsAt: "2026-09-25T15:30:00.000Z",

      status: "confirmed",
      notes: "Cliente habitual",
    };

    it("should create a booking", async () => {
      const createdBooking = {
        id: "booking-123",

        business_id: "business-123",
        service_id: "service-123",
        conversation_id: "conversation-123",
        lead_id: "lead-123",

        customer_name: "Jordi",
        customer_phone: "600000000",
        customer_email: "jordi@example.com",

        service_name: "Corte",
        duration_minutes: 30,
        price: 20,

        starts_at: "2026-09-25T15:00:00.000Z",
        ends_at: "2026-09-25T15:30:00.000Z",

        status: "confirmed",
        notes: "Cliente habitual",
      };

      const single = vi.fn().mockResolvedValue({
        data: createdBooking,
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

      const result = await repository.create(booking);

      expect(result).toEqual(createdBooking);

      expect(mockSupabase.from).toHaveBeenCalledWith("bookings");

      expect(insert).toHaveBeenCalledWith({
        business_id: "business-123",
        service_id: "service-123",
        conversation_id: "conversation-123",
        lead_id: "lead-123",

        customer_name: "Jordi",
        customer_phone: "600000000",
        customer_email: "jordi@example.com",

        service_name: "Corte",
        duration_minutes: 30,
        price: 20,

        starts_at: "2026-09-25T15:00:00.000Z",
        ends_at: "2026-09-25T15:30:00.000Z",

        status: "confirmed",
        notes: "Cliente habitual",
      });

      expect(select).toHaveBeenCalled();
      expect(single).toHaveBeenCalled();
    });

    it("should return 409 when PostgreSQL rejects an overlapping booking", async () => {
      const single = vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: "23P01",
          message: "conflicting key value violates exclusion constraint",
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

      await expect(repository.create(booking)).rejects.toMatchObject({
        message: "The selected time is not available",
        statusCode: 409,
      });
    });

    it("should return 500 for other database errors", async () => {
      const single = vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: "SOME_ERROR",
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

      await expect(repository.create(booking)).rejects.toMatchObject({
        message: "Failed to create booking: Database error",
        statusCode: 500,
      });
    });
  });

  describe("findById", () => {
    it("should find a booking by id", async () => {
      const booking = {
        id: "booking-123",
        business_id: "business-123",
        status: "confirmed",
      };

      const maybeSingle = vi.fn().mockResolvedValue({
        data: booking,
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

      const result = await repository.findById("booking-123");

      expect(result).toEqual(booking);

      expect(mockSupabase.from).toHaveBeenCalledWith("bookings");

      expect(select).toHaveBeenCalledWith("*");

      expect(eq).toHaveBeenCalledWith("id", "booking-123");

      expect(maybeSingle).toHaveBeenCalled();
    });

    it("should return null when booking does not exist", async () => {
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

      const result = await repository.findById("booking-123");

      expect(result).toBeNull();
    });

    it("should throw an AppError when finding a booking fails", async () => {
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

      await expect(repository.findById("booking-123")).rejects.toMatchObject({
        message: "Failed to find booking: Database error",
        statusCode: 500,
      });
    });
  });

  describe("findByBusinessId", () => {
    it("should find bookings by business id", async () => {
      const bookings = [
        {
          id: "booking-1",
          business_id: "business-123",
          status: "confirmed",
        },
        {
          id: "booking-2",
          business_id: "business-123",
          status: "completed",
        },
      ];

      const order = vi.fn().mockResolvedValue({
        data: bookings,
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

      expect(result).toEqual(bookings);

      expect(mockSupabase.from).toHaveBeenCalledWith("bookings");

      expect(select).toHaveBeenCalledWith("*");

      expect(eq).toHaveBeenCalledWith("business_id", "business-123");

      expect(order).toHaveBeenCalledWith("starts_at", {
        ascending: true,
      });
    });

    it("should throw an AppError when finding business bookings fails", async () => {
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
        message: "Failed to find business bookings: Database error",
        statusCode: 500,
      });
    });
  });

  describe("findByBusinessIdAndDateRange", () => {
    it("should find bookings overlapping a date range", async () => {
      const bookings = [
        {
          id: "booking-123",
          business_id: "business-123",
        },
      ];

      const order = vi.fn().mockResolvedValue({
        data: bookings,
        error: null,
      });

      const gt = vi.fn().mockReturnValue({
        order,
      });

      const lt = vi.fn().mockReturnValue({
        gt,
      });

      const eq = vi.fn().mockReturnValue({
        lt,
      });

      const select = vi.fn().mockReturnValue({
        eq,
      });

      mockSupabase.from.mockReturnValue({
        select,
      });

      const result = await repository.findByBusinessIdAndDateRange(
        "business-123",
        "2026-09-25T00:00:00.000Z",
        "2026-09-26T00:00:00.000Z",
      );

      expect(result).toEqual(bookings);

      expect(eq).toHaveBeenCalledWith("business_id", "business-123");

      expect(lt).toHaveBeenCalledWith("starts_at", "2026-09-26T00:00:00.000Z");

      expect(gt).toHaveBeenCalledWith("ends_at", "2026-09-25T00:00:00.000Z");

      expect(order).toHaveBeenCalledWith("starts_at", {
        ascending: true,
      });
    });

    it("should throw an AppError when date range query fails", async () => {
      const order = vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: "Database error",
        },
      });

      const gt = vi.fn().mockReturnValue({
        order,
      });

      const lt = vi.fn().mockReturnValue({
        gt,
      });

      const eq = vi.fn().mockReturnValue({
        lt,
      });

      const select = vi.fn().mockReturnValue({
        eq,
      });

      mockSupabase.from.mockReturnValue({
        select,
      });

      await expect(
        repository.findByBusinessIdAndDateRange(
          "business-123",
          "2026-09-25T00:00:00.000Z",
          "2026-09-26T00:00:00.000Z",
        ),
      ).rejects.toMatchObject({
        message: "Failed to find bookings by date range: Database error",
        statusCode: 500,
      });
    });
  });

  describe("findConflictingBookings", () => {
    it("should find pending or confirmed overlapping bookings", async () => {
      const bookings = [
        {
          id: "booking-existing",
          status: "confirmed",
        },
      ];

      const order = vi.fn().mockResolvedValue({
        data: bookings,
        error: null,
      });

      const gt = vi.fn().mockReturnValue({
        order,
      });

      const lt = vi.fn().mockReturnValue({
        gt,
      });

      const inMock = vi.fn().mockReturnValue({
        lt,
      });

      const eq = vi.fn().mockReturnValue({
        in: inMock,
      });

      const select = vi.fn().mockReturnValue({
        eq,
      });

      mockSupabase.from.mockReturnValue({
        select,
      });

      const result = await repository.findConflictingBookings(
        "business-123",
        "2026-09-25T15:00:00.000Z",
        "2026-09-25T15:30:00.000Z",
      );

      expect(result).toEqual(bookings);

      expect(eq).toHaveBeenCalledWith("business_id", "business-123");

      expect(inMock).toHaveBeenCalledWith("status", ["pending", "confirmed"]);

      expect(lt).toHaveBeenCalledWith("starts_at", "2026-09-25T15:30:00.000Z");

      expect(gt).toHaveBeenCalledWith("ends_at", "2026-09-25T15:00:00.000Z");
    });

    it("should throw an AppError when conflict query fails", async () => {
      const order = vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: "Database error",
        },
      });

      const gt = vi.fn().mockReturnValue({
        order,
      });

      const lt = vi.fn().mockReturnValue({
        gt,
      });

      const inMock = vi.fn().mockReturnValue({
        lt,
      });

      const eq = vi.fn().mockReturnValue({
        in: inMock,
      });

      const select = vi.fn().mockReturnValue({
        eq,
      });

      mockSupabase.from.mockReturnValue({
        select,
      });

      await expect(
        repository.findConflictingBookings(
          "business-123",
          "2026-09-25T15:00:00.000Z",
          "2026-09-25T15:30:00.000Z",
        ),
      ).rejects.toMatchObject({
        message: "Failed to find conflicting bookings: Database error",
        statusCode: 500,
      });
    });
  });

  describe("updateStatus", () => {
    it("should update booking status", async () => {
      const booking = {
        id: "booking-123",
        business_id: "business-123",
        status: "cancelled",
      };

      const single = vi.fn().mockResolvedValue({
        data: booking,
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

      const result = await repository.updateStatus("booking-123", "cancelled");

      expect(result).toEqual(booking);

      expect(mockSupabase.from).toHaveBeenCalledWith("bookings");

      expect(update).toHaveBeenCalledWith({
        status: "cancelled",
        updated_at: expect.any(String),
      });

      expect(eq).toHaveBeenCalledWith("id", "booking-123");

      expect(select).toHaveBeenCalled();
      expect(single).toHaveBeenCalled();
    });

    it("should return 409 when activating a booking causes an overlap", async () => {
      const single = vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: "23P01",
          message: "conflicting key value violates exclusion constraint",
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

      await expect(repository.updateStatus("booking-123", "confirmed")).rejects.toMatchObject({
        message: "The selected time is not available",
        statusCode: 409,
      });
    });

    it("should return 500 for other update errors", async () => {
      const single = vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: "SOME_ERROR",
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

      await expect(repository.updateStatus("booking-123", "cancelled")).rejects.toMatchObject({
        message: "Failed to update booking status: Database error",
        statusCode: 500,
      });
    });
  });
});
