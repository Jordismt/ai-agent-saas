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

import { SupabaseAgentActionExecutor } from "../../conversations/application/SupabaseAgentActionExecutor.js";
import { SupabaseLeadRepository } from "../../leads/infrastructure/SupabaseLeadRepository.js";

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

  const agentActionExecutor = new SupabaseAgentActionExecutor({
    leadRepository,
    conversationRepository,
  });

  const aiService = new GroqLLMService();

  return {
    createPublicConversation: new CreatePublicConversation(conversationRepository),

    getPublicConversation: new GetPublicConversation(conversationRepository),

    createPublicMessage: new CreatePublicMessage(messageRepository),

    getPublicMessages: new GetPublicMessages(messageRepository),

    generatePublicAIResponse: new GeneratePublicAIResponse({
      messageRepository,
      aiService,
      agentActionExecutor,
    }),

    getPublicBusinessContext: new GetPublicBusinessContext({
      businessRepository,
      businessServiceRepository,
      businessHoursRepository,
      businessAgentConfigRepository,
    }),

    getPublicBusinessConfig: new GetPublicBusinessConfig({
      businessRepository,
      businessAgentConfigRepository,
    }),

    businessRepository,
  };
}

/*
 * =========================
 * CONFIGURACIÓN PÚBLICA
 * =========================
 *
 * GET /public/businesses/:businessId/config
 */
router.get("/businesses/:businessId/config", async (req, res, next) => {
  try {
    const { getPublicBusinessConfig } = createController();

    const config = await getPublicBusinessConfig.execute(req.params.businessId);

    if (!config) {
      return res.status(404).json({
        error: "Business not found",
      });
    }

    return res.json(config);
  } catch (error) {
    next(error);
  }
});

/*
 * =========================
 * CREAR CONVERSACIÓN
 * =========================
 *
 * POST /public/businesses/:businessId/conversations
 */
router.post("/businesses/:businessId/conversations", async (req, res, next) => {
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

/*
 * =========================
 * ENVIAR MENSAJE
 * =========================
 *
 * POST /public/conversations/:conversationId/messages
 */

router.post("/conversations/:conversationId/messages", async (req, res, next) => {
  try {
    const data = createPublicMessageSchema.parse(req.body);

    const {
      getPublicConversation,
      createPublicMessage,
      getPublicMessages,
      generatePublicAIResponse,
      getPublicBusinessContext,
    } = createController();

    const conversation = await getPublicConversation.execute(req.params.conversationId, data.publicToken);

    await createPublicMessage.execute({
      conversationId: req.params.conversationId,
      content: data.content,
    });

    /*
     * Si la conversación está en manos de una persona,
     * guardamos el mensaje pero no llamamos a la IA.
     */
    if (conversation.status === "human") {
      return res.status(201).json({
        user_message: {
          content: data.content,
        },

        assistant_message: {
          id: null,
          content: "Tu mensaje ha sido recibido. Una persona del negocio se pondrá en contacto contigo.",
          created_at: new Date().toISOString(),
        },
      });
    }

    const businessContext = await getPublicBusinessContext.execute(conversation.business_id);

    const messages = await getPublicMessages.execute(req.params.conversationId);

    const assistantMessage = await generatePublicAIResponse.execute({
      conversationId: req.params.conversationId,
      messages,
      businessContext,
    });

    return res.status(201).json({
      user_message: {
        content: data.content,
      },

      assistant_message: {
        id: assistantMessage.id,
        content: assistantMessage.content,
        created_at: assistantMessage.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
