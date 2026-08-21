import type { GenerateExecutiveInsightsInput, GetLatestExecutiveInsightsInput } from './dto';
import { generateExecutiveInsightsSvc, getLatestExecutiveInsightsSvc } from './service';

export async function generateExecutiveInsightsCtrl(input: GenerateExecutiveInsightsInput) {
  return generateExecutiveInsightsSvc(input);
}

export async function getLatestExecutiveInsightsCtrl(input: GetLatestExecutiveInsightsInput) {
  return getLatestExecutiveInsightsSvc(input);
}
