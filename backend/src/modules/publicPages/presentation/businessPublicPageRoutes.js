import { requireActiveBusiness } from "../../../shared/billing/requireActiveBusiness.js";
import { bookingLimiter } from "../../../shared/middleware/rateLimits.js";
import { Router } from "express";
import { SupabaseBookingRepository } from "../../bookings/infrastructure/SupabaseBookingRepository.js";
import { SupabaseConversationRepository } from "../../conversations/infrastructure/SupabaseConversationRepository.js";
import { SupabaseLeadRepository } from "../../leads/infrastructure/SupabaseLeadRepository.js";
import { GetAvailableSlots } from "../../bookings/application/GetAvailableSlots.js";
import { CreateBooking } from "../../bookings/application/CreateBooking.js";
import { createBookingSchema } from "../../bookings/application/createBookingSchema.js";
import { getAvailableSlotsSchema } from "../../bookings/application/getAvailableSlotsSchema.js";
import { ResendEmailService } from "../../notifications/infrastructure/ResendEmailService.js";
import { SendBookingConfirmation } from "../../notifications/application/SendBookingConfirmation.js";
import { AppError } from "../../../shared/errors/AppError.js";

import { authMiddleware } from "../../../shared/middleware/authMiddleware.js";

import { createSupabaseServerClient } from "../../../infrastructure/database/supabase.js";

import { SupabaseBusinessRepository } from "../../businesses/infrastructure/SupabaseBusinessRepository.js";

import { SupabaseBusinessServiceRepository } from "../../businesses/infrastructure/SupabaseBusinessServiceRepository.js";

import { SupabaseBusinessHoursRepository } from "../../businesses/infrastructure/SupabaseBusinessHoursRepository.js";

import { SupabaseEmployeeRepository } from "../../employees/infrastructure/SupabaseEmployeeRepository.js";

import { SupabaseBusinessPublicPageRepository } from "../infrastructure/SupabaseBusinessPublicPageRepository.js";

import { BusinessPublicPageController } from "./BusinessPublicPageController.js";

const router = Router();

function createAuthenticatedController(req) {
  const supabase = req.supabase;

  const businessRepository = new SupabaseBusinessRepository(supabase);

  const businessServiceRepository = new SupabaseBusinessServiceRepository(supabase);

  const businessHoursRepository = new SupabaseBusinessHoursRepository(supabase);

  const employeeRepository = new SupabaseEmployeeRepository(supabase);

  const publicPageRepository = new SupabaseBusinessPublicPageRepository(supabase);

  return new BusinessPublicPageController({
    businessRepository,
    publicPageRepository,
    businessServiceRepository,
    businessHoursRepository,
    employeeRepository,
  });
}

function createPublicController() {
  const supabase = createSupabaseServerClient();

  const businessRepository = new SupabaseBusinessRepository(supabase);

  const businessServiceRepository = new SupabaseBusinessServiceRepository(supabase);

  const businessHoursRepository = new SupabaseBusinessHoursRepository(supabase);

  const employeeRepository = new SupabaseEmployeeRepository(supabase);

  const publicPageRepository = new SupabaseBusinessPublicPageRepository(supabase);

  return new BusinessPublicPageController({
    businessRepository,
    publicPageRepository,
    businessServiceRepository,
    businessHoursRepository,
    employeeRepository,
  });
}

/*
 * DASHBOARD
 *
 * GET /businesses/:businessId/public-page
 */

router.get("/businesses/:businessId/public-page", authMiddleware, (req, res, next) =>
  createAuthenticatedController(req).getByBusinessId(req, res, next),
);

/*
 * DASHBOARD
 *
 * PUT /businesses/:businessId/public-page
 */

router.put("/businesses/:businessId/public-page", authMiddleware, (req, res, next) =>
  createAuthenticatedController(req).upsert(req, res, next),
);

/*
 * PUBLIC
 *
 * GET /public/pages/:slug
 */

router.get("/public/pages/:slug", async (req, res, next) => {
  try {
    const supabase = createSupabaseServerClient();
    await resolvePublishedPage(supabase, String(req.params.slug || "").trim().toLowerCase());
    return createPublicController().getPublished(req, res, next);
  } catch (error) { next(error); }
});



// Public direct booking: only published slugs can use these endpoints.
// Reuse the same availability and booking domain logic as the AI/dashboard.
function createPublicBookingServices(supabase) {
  const bookingRepository = new SupabaseBookingRepository(supabase);
  const businessRepository = new SupabaseBusinessRepository(supabase);
  const businessServiceRepository = new SupabaseBusinessServiceRepository(supabase);
  const businessHoursRepository = new SupabaseBusinessHoursRepository(supabase);
  const employeeRepository = new SupabaseEmployeeRepository(supabase);
  const getAvailableSlots = new GetAvailableSlots({bookingRepository,businessServiceRepository,businessHoursRepository,businessRepository,employeeRepository});
  const createBooking = new CreateBooking({
    bookingRepository,businessRepository,businessServiceRepository,employeeRepository,
    conversationRepository:new SupabaseConversationRepository(supabase),
    leadRepository:new SupabaseLeadRepository(supabase),getAvailableSlots,
    sendBookingConfirmation:new SendBookingConfirmation(new ResendEmailService()),
  });
  return {getAvailableSlots,createBooking};
}
async function resolvePublishedPage(supabase, slug) {
  const page = await new SupabaseBusinessPublicPageRepository(supabase).findBySlug(slug);
  if (!page || !page.published) throw new AppError('Web no disponible', 404);
  await requireActiveBusiness(page.business_id, supabase);
  return page;
}
router.get('/public/pages/:slug/availability', async (req,res,next) => {
  try {
    const supabase = createSupabaseServerClient();
    const page = await resolvePublishedPage(supabase,req.params.slug);
    const input = getAvailableSlotsSchema.parse({businessId:page.business_id,serviceId:req.query.serviceId,date:req.query.date,employeeId:req.query.employeeId||undefined});
    const {getAvailableSlots} = createPublicBookingServices(supabase);
    res.json(await getAvailableSlots.execute(input));
  } catch(err) { next(err); }
});
router.post('/public/pages/:slug/bookings', bookingLimiter, async (req,res,next) => {
  try {
    const supabase = createSupabaseServerClient();
    const page = await resolvePublishedPage(supabase,req.params.slug);
    const input = createBookingSchema.parse({
      businessId:page.business_id,serviceId:req.body?.serviceId,employeeId:req.body?.employeeId||null,
      customerName:req.body?.customerName,customerPhone:req.body?.customerPhone||null,
      customerEmail:req.body?.customerEmail,date:req.body?.date,time:req.body?.time,
    });
    const {createBooking} = createPublicBookingServices(supabase);
    const booking = await createBooking.execute(input);
    res.status(201).json({id:booking.id,status:booking.status,starts_at:booking.starts_at});
  } catch(err) { next(err); }
});

export default router;
