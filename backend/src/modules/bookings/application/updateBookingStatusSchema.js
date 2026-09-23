import { z } from "zod";

import { BOOKING_STATUSES } from "../domain/Booking.js";

export const updateBookingStatusSchema = z.object({
  status: z.enum(Object.values(BOOKING_STATUSES)),
});
