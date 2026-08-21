import { selectProvider } from '@/server/services/llm/router';
import { ServiceUnavailable } from '@/server/utils/http-error';
import { buildOperationsExceptionsGroundingSnapshot } from './aggregation';
import type {
  OperationsExceptionsBriefResult,
  GenerateOperationsExceptionsBriefInput,
  GetLatestOperationsExceptionsBriefInput,
  GroundingSnapshot,
} from './dto';
import {
  getLatestOperationsExceptionsBriefRepo,
  insertOperationsExceptionsBriefRepo,
} from './repository';

const SYSTEM_PROMPT = `You are an operations analyst narrating pre-computed parcel/consignment exception counts for a Branch or Operations Manager at Vipex, a logistics/courier company. You are NOT a calculator.

Rules:
- Use ONLY the figures provided below. Every number you state must be copied exactly from the data block — never recompute, estimate, or infer a number that isn't present.
- If a section is marked unavailable in dataCompleteness, say plainly that this data is not currently available rather than guessing or omitting the caveat.
- Discrepancy, reconciliation-case, aged-parcel, and stuck-parcel counts are the CURRENT open backlog (as of generation time), not counts created within the selected date range — only the misrouted-scan count is bounded to the selected period. Never imply all figures share the same time window.
- "Stuck" parcels means no status update for at least the given stuckAfterDays threshold while still in a non-terminal status — describe it as such, not as a confirmed delivery failure.
- Structure the answer as: 1) one-paragraph headline (overall exception load and severity), 2) key risks (discrepancies, reconciliation backlog, misrouted/stuck parcels), 3) what needs attention this period.
- Keep it under ~250 words, plain business language, no jargon.`;

function formatSnapshot(snapshot: GroundingSnapshot): string {
  const lines: string[] = [
    `Period: ${snapshot.periodFrom} to ${snapshot.periodTo}${snapshot.branchId ? ` (branch ${snapshot.branchId})` : ' (all branches)'}`,
    `Open discrepancies: ${snapshot.openDiscrepancyCount ?? 'unavailable'} [openDiscrepancies: ${snapshot.dataCompleteness.openDiscrepancies}]`,
    `Open reconciliation cases (requested/approved): ${snapshot.openReconciliationCaseCount ?? 'unavailable'} [reconciliationCases: ${snapshot.dataCompleteness.reconciliationCases}]`,
    `Aged parcels (past ageing threshold): ${snapshot.agedParcelCount ?? 'unavailable'}, storage-charge accruing: ${snapshot.storageChargeAccruingCount ?? 'unavailable'} [agedParcels: ${snapshot.dataCompleteness.agedParcels}]`,
    `Misrouted consignment scans (in period): ${snapshot.misroutedScanCount ?? 'unavailable'} [misroutedScans: ${snapshot.dataCompleteness.misroutedScans}]`,
    `Stuck parcels (no status update in ${snapshot.stuckAfterDays}+ days, non-terminal status): ${snapshot.stuckParcelCount ?? 'unavailable'} [stuckParcels: ${snapshot.dataCompleteness.stuckParcels}]`,
  ];

  if (snapshot.openDiscrepancyTypeBreakdown.length) {
    lines.push('Discrepancy types (sampled):');
    for (const row of snapshot.openDiscrepancyTypeBreakdown) {
      lines.push(`- ${row.type}: ${row.count}`);
    }
  }

  if (snapshot.reconciliationCaseTypeBreakdown.length) {
    lines.push('Reconciliation case types (sampled):');
    for (const row of snapshot.reconciliationCaseTypeBreakdown) {
      lines.push(`- ${row.type}: ${row.count}`);
    }
  }

  return lines.join('\n');
}

export async function generateOperationsExceptionsBriefSvc(
  input: GenerateOperationsExceptionsBriefInput,
): Promise<OperationsExceptionsBriefResult> {
  const snapshot = await buildOperationsExceptionsGroundingSnapshot(input);
  const provider = selectProvider('complex');

  if (!provider) {
    await insertOperationsExceptionsBriefRepo({
      companyId: input.companyId,
      generatedByUserId: input.userId,
      branchId: input.branchId ?? null,
      periodFrom: input.from,
      periodTo: input.to,
      groundingSnapshot: snapshot,
      narrative: null,
      provider: null,
      succeeded: false,
      errorReason: 'no_provider_configured',
    });
    throw ServiceUnavailable(
      'Operations exceptions briefs are not set up yet. The figures above are still accurate — only the narrative is unavailable.',
    );
  }

  try {
    const result = await provider.complete('complex', {
      systemPrompt: SYSTEM_PROMPT,
      userMessage: formatSnapshot(snapshot),
    });

    if (!result.text) throw new Error('Empty response from provider');

    const saved = await insertOperationsExceptionsBriefRepo({
      companyId: input.companyId,
      generatedByUserId: input.userId,
      branchId: input.branchId ?? null,
      periodFrom: input.from,
      periodTo: input.to,
      groundingSnapshot: snapshot,
      narrative: result.text,
      provider: result.provider,
      succeeded: true,
    });

    if (saved) return saved;

    return {
      id: 'unsaved',
      periodFrom: input.from,
      periodTo: input.to,
      branchId: input.branchId ?? null,
      narrative: result.text,
      provider: result.provider,
      succeeded: true,
      grounding: snapshot,
      generatedByUserId: input.userId,
      createdAt: new Date().toISOString(),
    };
  } catch {
    await insertOperationsExceptionsBriefRepo({
      companyId: input.companyId,
      generatedByUserId: input.userId,
      branchId: input.branchId ?? null,
      periodFrom: input.from,
      periodTo: input.to,
      groundingSnapshot: snapshot,
      narrative: null,
      provider: provider.name,
      succeeded: false,
      errorReason: 'provider_error',
    });
    throw ServiceUnavailable(
      'Could not generate the operations exceptions brief right now. The figures above are still accurate.',
    );
  }
}

export async function getLatestOperationsExceptionsBriefSvc(
  input: GetLatestOperationsExceptionsBriefInput,
): Promise<OperationsExceptionsBriefResult | null> {
  return getLatestOperationsExceptionsBriefRepo(input);
}
