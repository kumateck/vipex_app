import { anthropicProvider } from './anthropic-provider';
import { openaiProvider } from './openai-provider';
import { googleProvider } from './google-provider';
import type { LlmComplexityTier, LlmProvider } from './types';

/**
 * Priority order per complexity tier. First configured (API key present)
 * provider in the list wins. Different tiers favor different providers so
 * cheap/simple questions and careful/complex ones can use different
 * providers at the same time, without one being hardcoded.
 */
const PROVIDER_PRIORITY: Record<LlmComplexityTier, LlmProvider[]> = {
  simple: [googleProvider, openaiProvider, anthropicProvider],
  complex: [anthropicProvider, openaiProvider, googleProvider],
};

export function selectProvider(tier: LlmComplexityTier): LlmProvider | null {
  return PROVIDER_PRIORITY[tier].find((provider) => provider.isConfigured()) ?? null;
}
