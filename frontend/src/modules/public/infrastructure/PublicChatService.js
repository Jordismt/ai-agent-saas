import { apiFetch } from "../../../infrastructure/http/apiClient.js";

export class PublicChatService {
  async createConversation(businessId, visitorId) {
    return apiFetch(`/public/businesses/${businessId}/conversations`, {
      method: "POST",
      body: JSON.stringify({
        visitorId,
      }),
    });
  }

  async sendMessage(conversationId, publicToken, content) {
    return apiFetch(`/public/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({
        publicToken,
        content,
      }),
    });
  }

  async getBusinessConfig(businessId) {
    return apiFetch(`/public/businesses/${businessId}/config`);
  }

  async getMessages(conversationId, publicToken) {
    return apiFetch(`/public/conversations/${conversationId}/messages?publicToken=${publicToken}`);
  }
}
