import type { HelpGuide } from '@/shared/help-content';
import type { LlmComplexityTier } from '@/server/services/llm/types';

const LONG_QUESTION_LENGTH = 140;
const MULTI_PART_PATTERN = /\band\b|\bthen\b|;|\?.*\?/i;
const AMBIGUOUS_MATCH_COUNT = 3;

/**
 * Cheap, no-LLM-call heuristic: a question is "complex" when it's long,
 * multi-part, matches no guide directly (needs broader reasoning), or
 * matches many guides at once (ambiguous, spans several topics).
 */
export function classifyComplexity(
  question: string,
  matchedGuides: HelpGuide[],
): LlmComplexityTier {
  if (question.length > LONG_QUESTION_LENGTH) return 'complex';
  if (MULTI_PART_PATTERN.test(question)) return 'complex';
  if (matchedGuides.length === 0) return 'complex';
  if (matchedGuides.length > AMBIGUOUS_MATCH_COUNT) return 'complex';
  return 'simple';
}
