import { requireActiveBusiness } from "../../../shared/billing/requireActiveBusiness.js";
import { publicConversationLimiter, publicAiMinuteLimiter, publicAiHourLimiter, publicAiConcurrency } from "../../../shared/middleware/rateLimits.js";
import { Router } from "express";
import { z } from "zod";

import { CreatePublicConversation } from "../application/CreatePublicConversation.js";
import { GetPublicConversation } from "../application/GetPublicConversation.js";
import { CreatePublicMessage } from "../application/CreatePublicMessage.js";
import { GetPublicMessages } from "../application/GetPublicMessages.js";
import { GeneratePublicAIResponse } from "../application/GeneratePublicAIResponse.js";
import { GetPublicBusinessContext } from "../application/GetPublicBusinessContext.js";
import { GetPublicBusinessConfig } from "../application/GetPublicBusinessConfig.js";

import { SupabaseConversationRepository } from "../../conversations/infrastructure/SupabaseConversationRepository.js";
import { SupabaseMessageRepository } from "../../conversations/infrastructure/SupabaseMessageRepository.js";
import { SupabaseBusinessRepository } from "../../businesses/infrastructure/SupabaseBusinessRepository.js";
import { SupabaseBusinessServiceRepository } from "../../businesses/infrastructure/SupabaseBusinessServiceRepository.js";
import { SupabaseBusinessHoursRepository } from "../../businesses/infrastructure/SupabaseBusinessHoursRepository.js";
import { SupabaseBusinessAgentConfigRepository } from "../../businesses/infrastructure/SupabaseBusinessAgentConfigRepository.js";
import { SupabaseBookingRepository } from "../../bookings/infrastructure/SupabaseBookingRepository.js";
import { SupabaseAgentActionExecutor } from "../../conversations/application/SupabaseAgentActionExecutor.js";
import { SupabaseLeadRepository } from "../../leads/infrastructure/SupabaseLeadRepository.js";
import { SupabaseEmployeeRepository } from "../../employees/infrastructure/SupabaseEmployeeRepository.js";

import { createPublicConversationSchema } from "./createPublicConversationSchema.js";
import { createPublicMessageSchema } from "./createPublicMessageSchema.js";

import { createSupabaseServerClient } from "../../../infrastructure/database/supabase.js";
import { GroqLLMService } from "../../../infrastructure/ai/GroqLLMService.js";

const router = Router();

function createController() {
  const supabase = createSupabaseServerClient();

  const conversationRepository = new SupabaseConversationRepository(supabase);
  const messageRepository = new SupabaseMessageRepository(supabase);
  const businessRepository = new SupabaseBusinessRepository(supabase);
  const businessServiceRepository = new SupabaseBusinessServiceRepository(supabase);
  const businessHoursRepository = new SupabaseBusinessHoursRepository(supabase);
  const businessAgentConfigRepository = new SupabaseBusinessAgentConfigRepository(supabase);
  const leadRepository = new SupabaseLeadRepository(supabase);
  const bookingRepository = new SupabaseBookingRepository(supabase);
  const employeeRepository = new SupabaseEmployeeRepository(supabase);

  const agentActionExecutor = new SupabaseAgentActionExecutor({
    leadRepository,
    conversationRepository,
    bookingRepository,
    businessRepository,
    businessServiceRepository,
    businessHoursRepository,
    employeeRepository,
  });

  const aiService = new GroqLLMService();

  return {
    createPublicConversation: new CreatePublicConversation(conversationRepository),

    getPublicConversation: new GetPublicConversation(conversationRepository),

    createPublicMessage: new CreatePublicMessage({
      messageRepository,
      conversationRepository,
    }),

    getPublicMessages: new GetPublicMessages(messageRepository),

    generatePublicAIResponse: new GeneratePublicAIResponse({
      messageRepository,
      conversationRepository,
      aiService,
      agentActionExecutor,
    }),

    getPublicBusinessContext: new GetPublicBusinessContext({
      businessRepository,
      businessServiceRepository,
      businessHoursRepository,
      businessAgentConfigRepository,
      employeeRepository,
    }),

    getPublicBusinessConfig: new GetPublicBusinessConfig({
      businessRepository,
      businessAgentConfigRepository,
    }),

    businessRepository,
  };
}

router.get("/businesses/:businessId/config", async (req, res, next) => {
  try {
    const { getPublicBusinessConfig } = createController();

    const config = await getPublicBusinessConfig.execute(req.params.businessId);

    if (!config) {
      return res.status(404).json({
        error: "Business not found",
      });
    }

    await requireActiveBusiness(req.params.businessId);
    return res.json(config);
  } catch (error) {
    next(error);
  }
});

router.post("/businesses/:businessId/conversations", publicConversationLimiter, async (req, res, next) => {
  try {
    const data = createPublicConversationSchema.parse({
      businessId: req.params.businessId,
      visitorId: req.body.visitorId,
    });

    const { createPublicConversation, businessRepository } = createController();

    const business = await businessRepository.findById(data.businessId);

    if (!business) {
      return res.status(404).json({
        error: "Business not found",
      });
    }

    await requireActiveBusiness(data.businessId);

    const conversation = await createPublicConversation.execute({
      businessId: data.businessId,
      visitorId: data.visitorId,
    });

    return res.status(201).json({
      id: conversation.id,
      business_id: conversation.business_id,
      channel: conversation.channel,
      status: conversation.status,
      visitor_id: conversation.visitor_id,
      public_token: conversation.public_token,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/conversations/:conversationId/messages", async (req, res, next) => {
  try {
    const publicToken = z.string().uuid().parse(req.query.publicToken);

    const { getPublicConversation, getPublicMessages } = createController();

    await getPublicConversation.execute(req.params.conversationId, publicToken);

    const messages = await getPublicMessages.execute(req.params.conversationId);

    return res.json(
      messages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        created_at: message.created_at,
      })),
    );
  } catch (error) {
    next(error);
  }
});

router.post("/conversations/:conversationId/messages", publicAiMinuteLimiter, publicAiHourLimiter, publicAiConcurrency, async (req, res, next) => {
  try {
    const data = createPublicMessageSchema.parse(req.body);

    const {
      getPublicConversation,
      createPublicMessage,
      getPublicMessages,
      generatePublicAIResponse,
      getPublicBusinessContext,
    } = createController();

    const conversation = await getPublicConversation.execute(
      req.params.conversationId,
      data.publicToken,
    );

    await requireActiveBusiness(conversation.business_id);

    if (conversation.status === "closed") {
      return res.status(409).json({
        error: "This conversation is closed",
      });
    }

    const userMessage = await createPublicMessage.execute({
      conversationId: req.params.conversationId,
      content: data.content,
    });

    if (conversation.status === "human") {
      return res.status(201).json({
        user_message: {
          id: userMessage.id,
          content: userMessage.content,
          created_at: userMessage.created_at,
        },
        assistant_message: null,
        handled_by: "human",
      });
    }

    /*
     * Contexto y mensajes pueden cargarse en paralelo.
     */
    const [businessContext, allMessages] = await Promise.all([
      getPublicBusinessContext.execute(conversation.business_id),
      getPublicMessages.execute(req.params.conversationId),
    ]);

    if (!businessContext) {
      return res.status(404).json({
        error: "Business not found",
      });
    }

    /*
     * El servicio de IA vuelve a aplicar su propio límite.
     * Aquí reducimos también el objeto que movemos por la capa de aplicación.
     */
    const messages = allMessages.slice(-12);

    const assistantMessage = await generatePublicAIResponse.execute({
      conversationId: req.params.conversationId,
      messages,
      businessContext,
    });

    return res.status(201).json({
      user_message: {
        id: userMessage.id,
        content: userMessage.content,
        created_at: userMessage.created_at,
      },

      assistant_message: {
        id: assistantMessage.id,
        content: assistantMessage.content,
        created_at: assistantMessage.created_at,
      },

      handled_by: "ai",
    });
  } catch (error) {
    next(error);
  }
});

export default router;
