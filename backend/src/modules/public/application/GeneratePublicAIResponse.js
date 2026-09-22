export class GeneratePublicAIResponse {
  constructor({ messageRepository, aiService, agentActionExecutor }) {
    this.messageRepository = messageRepository;

    this.aiService = aiService;

    this.agentActionExecutor = agentActionExecutor;
  }

  async execute({ conversationId, messages, businessContext }) {
    const response = await this.aiService.generateResponse({
      businessContext,
      messages,
    });

    await this.agentActionExecutor.execute({
      action: response.action.type,
      businessId: businessContext.id,
      conversationId,
      data: response.action.data,
    });

    return this.messageRepository.create({
      conversationId,
      role: "assistant",
      content: response.content,
    });
  }
}
