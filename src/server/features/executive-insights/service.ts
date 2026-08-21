import { selectProvider } from '@/server/services/llm/router';
import { ServiceUnavailable } from '@/server/utils/http-error';
import { buildGroundingSnapshot } from './aggregation';
import type {
  ExecutiveInsightsResult,
  GenerateExecutiveInsightsInput,
  GetLatestExecutiveInsightsInput,
  GroundingSnapshot,
} from './dto';
import { getLatestExecutiveInsightRepo, insertExecutiveInsightRepo } from './repository';

const SYSTEM_PROMPT = `You are an executive analyst narrating pre-computed financial and operational figures for the CEO of Vipex, a logistics/courier company. You are NOT a financial calculator.

Rules:
- Use ONLY the figures provided below. Every number you state must be copied exactly from the data block — never recompute, estimate, round differently, or infer a number that isn't present.
- If a section is marked unavailable in dataCompleteness, say plainly that this data is not currently available rather than guessing or omitting the caveat.
- The "suspicious activity" audit signal is a simple keyword-based match on the audit log, not a verified fraud finding — describe it as "flagged for review," never as "confirmed fraud" or "detected fraud."
- Do not offer investment, legal, or tax advice. Describe what the numbers show and what needs attention; do not prescribe specific financial strategy.
- Structure the answer as: 1) one-paragraph headline (profitable or not, and why), 2) key risks (cash, credit, audit), 3) what needs attention this period.
- Keep it under ~250 words, plain business language, no jargon.`;

function formatSnapshot(snapshot: GroundingSnapshot): string {
  const lines: string[] = [
    `Period: ${snapshot.periodFrom} to ${snapshot.periodTo}${snapshot.branchId ? ` (branch ${snapshot.branchId})` : ' (all branches)'}`,
    `Total income: GHS ${snapshot.totalIncomeCedis.toLocaleString()} [income: ${snapshot.dataCompleteness.income}]`,
    `Total expense: GHS ${snapshot.totalExpenseCedis.toLocaleString()}`,
    `Net profit: GHS ${snapshot.netProfitCedis.toLocaleString()}`,
    `Net cash change: GHS ${snapshot.netCashChangeCedis.toLocaleString()} [cashFlow: ${snapshot.dataCompleteness.cashFlow}]`,
    `Operating cash net: GHS ${snapshot.operatingCashNetCedis.toLocaleString()}`,
    `Credit outstanding: GHS ${snapshot.creditOutstandingCedis.toLocaleString()} [creditExposure: ${snapshot.dataCompleteness.creditExposure}]`,
    `Credit aging — 1-30d: GHS ${snapshot.creditBucket1To30Cedis.toLocaleString()}, 31-60d: GHS ${snapshot.creditBucket31To60Cedis.toLocaleString()}, 61-90d: GHS ${snapshot.creditBucket61To90Cedis.toLocaleString()}, 91+d: GHS ${snapshot.creditBucket91PlusCedis.toLocaleString()}`,
    `Audit events (period): total ${snapshot.auditTotalEvents}, flagged-for-review ${snapshot.auditSuspiciousActions}, deleted-record actions ${snapshot.auditDeletedActions}, security signals ${snapshot.auditSecuritySignals} [auditAnalytics: ${snapshot.dataCompleteness.auditAnalytics}]`,
  ];

  if (snapshot.branches.length) {
    lines.push('Branch net profit:');
    for (const branch of snapshot.branches) {
      lines.push(
        `- ${branch.branchName}: income GHS ${branch.incomeCedis.toLocaleString()}, expense GHS ${branch.expenseCedis.toLocaleString()}, net profit GHS ${branch.netProfitCedis.toLocaleString()}`,
      );
    }
  } else {
    lines.push(
      `Branch net profit: unavailable [branchProfitability: ${snapshot.dataCompleteness.branchProfitability}]`,
    );
  }

  return lines.join('\n');
}

export async function generateExecutiveInsightsSvc(
  input: GenerateExecutiveInsightsInput,
): Promise<ExecutiveInsightsResult> {
  const snapshot = await buildGroundingSnapshot(input);
  const provider = selectProvider('complex');

  if (!provider) {
    await insertExecutiveInsightRepo({
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
      'Executive insights are not set up yet. The figures above are still accurate — only the narrative is unavailable.',
    );
  }

  try {
    const result = await provider.complete('complex', {
      systemPrompt: SYSTEM_PROMPT,
      userMessage: formatSnapshot(snapshot),
    });

    if (!result.text) throw new Error('Empty response from provider');

    const saved = await insertExecutiveInsightRepo({
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
    await insertExecutiveInsightRepo({
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
      'Could not generate the executive summary right now. The figures above are still accurate.',
    );
  }
}

export async function getLatestExecutiveInsightsSvc(
  input: GetLatestExecutiveInsightsInput,
): Promise<ExecutiveInsightsResult | null> {
  return getLatestExecutiveInsightRepo(input);
}
