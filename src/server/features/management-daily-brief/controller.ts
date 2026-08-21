import type { GenerateManagementDailyBriefInput, GetLatestManagementDailyBriefInput } from './dto';
import { generateManagementDailyBriefSvc, getLatestManagementDailyBriefSvc } from './service';

export async function generateManagementDailyBriefCtrl(input: GenerateManagementDailyBriefInput) {
  return generateManagementDailyBriefSvc(input);
}

export async function getLatestManagementDailyBriefCtrl(input: GetLatestManagementDailyBriefInput) {
  return getLatestManagementDailyBriefSvc(input);
}
