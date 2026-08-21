import type { GenerateFleetAnomalyBriefInput, GetLatestFleetAnomalyBriefInput } from './dto';
import { generateFleetAnomalyBriefSvc, getLatestFleetAnomalyBriefSvc } from './service';

export async function generateFleetAnomalyBriefCtrl(input: GenerateFleetAnomalyBriefInput) {
  return generateFleetAnomalyBriefSvc(input);
}

export async function getLatestFleetAnomalyBriefCtrl(input: GetLatestFleetAnomalyBriefInput) {
  return getLatestFleetAnomalyBriefSvc(input);
}
