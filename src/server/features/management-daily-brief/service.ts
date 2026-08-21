import { selectProvider } from '@/server/services/llm/router';
import { ServiceUnavailable } from '@/server/utils/http-error';
import { buildManagementDailyBriefSnapshot } from './aggregation';
import type {
  ManagementDailyBriefResult,
  GenerateManagementDailyBriefInput,
  GetLatestManagementDailyBriefInput,
  GroundingSnapshot,
  SubBriefSummary,
} from './dto';
import { getLatestManagementDailyBriefRepo, insertManagementDailyBriefRepo } from './repository';

const SYSTEM_PROMPT = `You are synthesizing a "what needs attention today" briefing for the CEO of Vipex, a logistics/courier company, from three separate AI brief narratives: financial (executive insights), fleet (anomaly brief), and operations (exceptions brief). You are NOT re-analyzing raw data — you are synthesizing narratives that were already generated from real figures.

Rules:
- You are given each sub-brief's own narrative text (if available), whether it is stale (older than staleAfterHours), and whether it succeeded. Do not invent figures beyond what each narrative already states.
- If a sub-brief is unavailable or its succeeded flag is false, say plainly that section could not be generated — do not guess what it might say.
- If a sub-brief is marked stale, say so explicitly and note its "as of" timestamp — never present stale information as current.
- Structure the answer as: 1) one-paragraph headline pulling together the most important theme across finance/fleet/operations today, 2) the top 1-2 things needing attention from each available section, 3) any sections that are stale, missing, or failed and should be regenerated.
- Keep it under ~250 words, plain business language, no jargon.`;

function formatSubBrief(label: string, summary: SubBriefSummary): string {
  if (!summary.available) return `${label}: not yet generated.`;
  if (summary.succeeded === false)
    return `${label}: last generation attempt failed (as of ${summary.asOf}).`;
  const staleNote = summary.isStale ? ' [STALE — treat as outdated]' : '';
  return `${label} (as of ${summary.asOf}${staleNote}): ${summary.narrative ?? 'no narrative text available'}`;
}

function formatSnapshot(snapshot: GroundingSnapshot): string {
  return [
    `Generated at: ${snapshot.generatedAt}. Sections older than ${snapshot.staleAfterHours}h are flagged stale.`,
    formatSubBrief('Executive (financial) insights', snapshot.executiveInsights),
    formatSubBrief('Fleet anomaly brief', snapshot.fleetAnomalyBrief),
    formatSubBrief('Operations exceptions brief', snapshot.operationsExceptionsBrief),
  ].join('\n\n');
}

export async function generateManagementDailyBriefSvc(
  input: GenerateManagementDailyBriefInput,
): Promise<ManagementDailyBriefResult> {
  const snapshot = await buildManagementDailyBriefSnapshot(input);
  const provider = selectProvider('complex');
  const now = new Date().toISOString();

  if (!provider) {
    await insertManagementDailyBriefRepo({
      companyId: input.companyId,
      generatedByUserId: input.userId,
      branchId: null,
      periodFrom: now,
      periodTo: now,
      groundingSnapshot: snapshot,
      narrative: null,
      provider: null,
      succeeded: false,
      errorReason: 'no_provider_configured',
    });
    throw ServiceUnavailable(
      'The management daily brief is not set up yet. The individual briefs above are still accurate — only this synthesis is unavailable.',
    );
  }

  try {
    const result = await provider.complete('complex', {
      systemPrompt: SYSTEM_PROMPT,
      userMessage: formatSnapshot(snapshot),
    });

    if (!result.text) throw new Error('Empty response from provider');

    const saved = await insertManagementDailyBriefRepo({
      companyId: input.companyId,
      generatedByUserId: input.userId,
      branchId: null,
      periodFrom: now,
      periodTo: now,
      groundingSnapshot: snapshot,
      narrative: result.text,
      provider: result.provider,
      succeeded: true,
    });

    if (saved) return saved;

    return {
      id: 'unsaved',
      periodFrom: now,
      periodTo: now,
      branchId: null,
      narrative: result.text,
      provider: result.provider,
      succeeded: true,
      grounding: snapshot,
      generatedByUserId: input.userId,
      createdAt: now,
    };
  } catch {
    await insertManagementDailyBriefRepo({
      companyId: input.companyId,
      generatedByUserId: input.userId,
      branchId: null,
      periodFrom: now,
      periodTo: now,
      groundingSnapshot: snapshot,
      narrative: null,
      provider: provider.name,
      succeeded: false,
      errorReason: 'provider_error',
    });
    throw ServiceUnavailable(
      'Could not generate the management daily brief right now. The individual briefs above are still accurate.',
    );
  }
}

export async function getLatestManagementDailyBriefSvc(
  input: GetLatestManagementDailyBriefInput,
): Promise<ManagementDailyBriefResult | null> {
  return getLatestManagementDailyBriefRepo(input);
}
