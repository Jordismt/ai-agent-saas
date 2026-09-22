import { MessageRepository } from "../domain/MessageRepository.js";
import { AppError } from "../../../shared/errors/AppError.js";

export class SupabaseMessageRepository extends MessageRepository {
  constructor(supabase) {
    super();
    this.supabase = supabase;
  }

  async create(message) {
    const { data, error } = await this.supabase
      .from("messages")
      .insert({
        conversation_id: message.conversationId,
        role: message.role,
        content: message.content,
      })
      .select()
      .single();

    if (error) {
      throw new AppError(`Failed to create message: ${error.message}`, 500);
    }

    return data;
  }

  async findByConversationId(conversationId) {
    const { data, error } = await this.supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new AppError(`Failed to find messages: ${error.message}`, 500);
    }

    return data;
  }
}
