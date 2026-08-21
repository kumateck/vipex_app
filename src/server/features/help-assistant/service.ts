import { HELP_GUIDES, type HelpGuide } from '@/shared/help-content';
import { ServiceUnavailable } from '@/server/utils/http-error';
import { classifyComplexity } from './complexity';
import { selectProvider } from '@/server/services/llm/router';
import { logHelpAssistantQueryRepo } from './repository';
import type { HelpAssistantAskInput, HelpAssistantAskResult } from './dto';

const MAX_MATCHED_GUIDES = 6;

const SYSTEM_PROMPT = `You are the Vipex staff Help Assistant. You answer internal staff questions about how to use the Vipex application.

Rules:
- Answer ONLY using the guide content provided below. Do not use outside knowledge.
- Every claim you make must be supported by one of the guides. Cite the guide id(s) you used in square brackets, e.g. [faq-cashier-daily-sales].
- If the guides do not contain an answer, say plainly "I don't have this in the Help Center" and suggest the staff member create a support ticket. Never guess.
- Keep answers short and direct, suitable for someone at work who needs the answer quickly.`;

function matchGuides(
  question: string,
  guides: HelpGuide[],
  limit = MAX_MATCHED_GUIDES,
): HelpGuide[] {
  const terms = question
    .toLowerCase()
    .split(/\W+/)
    .filter((term) => term.length > 2);
  if (!terms.length) return [];

  const scored = guides
    .map((guide) => {
      const haystack = `${guide.title} ${guide.summary} ${guide.keywords.join(' ')}`.toLowerCase();
      const score = terms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0);
      return { guide, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((entry) => entry.guide);
}

function formatContext(guides: HelpGuide[]): string {
  return guides
    .map((guide) => {
      const steps = guide.steps.map((step) => `- ${step.title}: ${step.description}`).join('\n');
      const page = guide.pageUrl
        ? `Page: ${guide.pageName ?? guide.pageUrl} (${guide.pageUrl})`
        : '';
      return `[${guide.id}] ${guide.title}\n${guide.summary}\n${page}\n${steps}`.trim();
    })
    .join('\n\n');
}

export async function askHelpAssistantSvc(
  input: HelpAssistantAskInput,
): Promise<HelpAssistantAskResult> {
  const matched = matchGuides(input.question, HELP_GUIDES);
  const contextGuides = matched.length
    ? matched
    : HELP_GUIDES.filter((g) => g.categoryId === 'faq');
  const tier = classifyComplexity(input.question, matched);
  const provider = selectProvider(tier);

  if (!provider) {
    await logHelpAssistantQueryRepo({
      ...input,
      answer: null,
      matchedGuideIds: matched.map((g) => g.id),
      succeeded: false,
      errorReason: 'no_provider_configured',
    });
    throw ServiceUnavailable(
      'The Help Assistant is not set up yet. Browse the guides below instead.',
    );
  }

  try {
    const result = await provider.complete(tier, {
      systemPrompt: SYSTEM_PROMPT,
      userMessage: `Guides:\n\n${formatContext(contextGuides)}\n\nStaff question: ${input.question}`,
    });

    if (!result.text) throw new Error('Empty response from provider');

    await logHelpAssistantQueryRepo({
      ...input,
      answer: result.text,
      provider: result.provider,
      matchedGuideIds: matched.map((g) => g.id),
      succeeded: true,
    });

    return {
      answer: result.text,
      sources: matched.map((g) => ({ guideId: g.id, title: g.title })),
      provider: result.provider,
      grounded: matched.length > 0,
    };
  } catch {
    await logHelpAssistantQueryRepo({
      ...input,
      answer: null,
      provider: provider.name,
      matchedGuideIds: matched.map((g) => g.id),
      succeeded: false,
      errorReason: 'provider_error',
    });
    throw ServiceUnavailable(
      'The Help Assistant could not answer right now. Browse the guides below instead.',
    );
  }
}
