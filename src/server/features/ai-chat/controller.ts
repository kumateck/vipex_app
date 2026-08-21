import type { GetLatestAiChatConversationInput, SendAiChatMessageInput } from './dto';
import { getLatestAiChatConversationSvc, sendAiChatMessageSvc } from './service';

export async function sendAiChatMessageCtrl(input: SendAiChatMessageInput) {
  return sendAiChatMessageSvc(input);
}

export async function getLatestAiChatConversationCtrl(input: GetLatestAiChatConversationInput) {
  return getLatestAiChatConversationSvc(input);
}
