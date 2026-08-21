import type { HelpAssistantAskInput } from './dto';
import { askHelpAssistantSvc } from './service';

export async function askHelpAssistantCtrl(input: HelpAssistantAskInput) {
  return askHelpAssistantSvc(input);
}
