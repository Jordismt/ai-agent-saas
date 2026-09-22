import { apiFetch } from "../../../infrastructure/http/apiClient.js";

export class ConversationService {
  async getByBusinessId(businessId) {
    return apiFetch(`/conversations/business/${businessId}`);
  }

  async getById(conversationId) {
    return apiFetch(`/conversations/${conversationId}`);
  }

  async getMessages(conversationId) {
    return apiFetch(`/conversations/${conversationId}/messages`);
  }

  async updateStatus(conversationId, status) {
    return apiFetch(`/conversations/${conversationId}/status`, {
      method: "PATCH",
      body: JSON.stringify({
        status,
      }),
    });
  }

  async createMessage(conversationId, content) {
    return apiFetch(`/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({
        role: "assistant",
        content,
      }),
    });
  }
}
