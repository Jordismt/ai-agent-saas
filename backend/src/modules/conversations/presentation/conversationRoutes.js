import { Router } from "express";

import { ConversationController } from "./ConversationController.js";

import { SupabaseConversationRepository } from "../infrastructure/SupabaseConversationRepository.js";

import { SupabaseMessageRepository } from "../infrastructure/SupabaseMessageRepository.js";

import { SupabaseBusinessRepository } from "../../businesses/infrastructure/SupabaseBusinessRepository.js";

import { authMiddleware } from "../../../shared/middleware/authMiddleware.js";

const router = Router();

function createController(req) {
  const conversationRepository = new SupabaseConversationRepository(req.supabase);

  const messageRepository = new SupabaseMessageRepository(req.supabase);

  const businessRepository = new SupabaseBusinessRepository(req.supabase);

  return new ConversationController({
    conversationRepository,
    messageRepository,
    businessRepository,
  });
}

router.post("/", authMiddleware, (req, res, next) => createController(req).create(req, res, next));

router.get("/:id", authMiddleware, (req, res, next) => createController(req).getById(req, res, next));

router.get("/business/:businessId", authMiddleware, (req, res, next) =>
  createController(req).getByBusinessId(req, res, next),
);

router.post("/:id/messages", authMiddleware, (req, res, next) =>
  createController(req).createMessage(req, res, next),
);

router.get("/:id/messages", authMiddleware, (req, res, next) =>
  createController(req).getMessages(req, res, next),
);

router.patch("/:id/status", authMiddleware, (req, res, next) =>
  createController(req).updateStatus(req, res, next),
);

export default router;
