# AI, Help, and Management Insights

## Capabilities

Vipex includes a deterministic help center plus optional LLM-assisted experiences:

| Capability                  | Purpose                                                                   |
| --------------------------- | ------------------------------------------------------------------------- |
| Help Center                 | Searchable in-app guides generated and maintained from product workflows. |
| Help Assistant              | Answers product-use questions using approved context.                     |
| AI Chat                     | Conversational analysis with controlled read-only business tools.         |
| Executive Insights          | Narrative summary over authorized executive aggregations.                 |
| Fleet Anomaly Brief         | Highlights fleet exceptions from fleet reports.                           |
| Operations Exceptions Brief | Summarizes aged, stuck, and other operational exceptions.                 |
| Management Daily Brief      | Combines persisted operational briefs for management review.              |

The generated narrative is advisory. Source reports and transaction records remain authoritative.

## Provider Routing

The shared LLM service supports OpenAI, Anthropic, and Google providers. Providers are selected by task complexity and configured priority. More than one provider can be configured, and missing configuration degrades to an explicit unavailable result rather than breaking the core application.

Provider credentials, model configuration, and raw secrets are server-only. Responses persist the provider and model metadata needed for troubleshooting, not secret keys.

## AI Chat Tool Safety

AI Chat can call registered business-data tools in a bounded agent loop. Each tool owns its input schema and server-side scope.

Required controls:

- Never expose `companyId`, tenant scope, or authorization fields as model-settable tool arguments.
- Resolve company and user scope from the authenticated request.
- Enforce the same permission as the underlying report or feature.
- Prefer read-only, aggregated tools.
- Validate every tool argument before executing it.
- Limit tool-call rounds, response size, and rate.
- Return visible tool traces so users can see the basis of an answer.

The model must not directly create payments, alter parcel status, grant permissions, or perform other mutations without a separately designed and explicitly confirmed workflow.

## Brief Generation

Briefs combine deterministic report snapshots with one narrative-generation call. The stored result includes the snapshot or data-completeness indicators, narrative, provider, model, generation time, and error reason when generation failed.

Data-completeness labels are important: the narrative must distinguish zero from unavailable data and must not invent missing measures.

Regeneration is permission-controlled and rate-limited because it can run several report aggregations plus an LLM request. Previously generated briefs remain readable according to retention and access policy.

## Help Center and Assistant

The Help Center is the preferred source for stable instructions. Module guides derive their navigation coverage from the application sidebar, with curated workflow text for important processes.

The Help Assistant should:

- Answer only from approved product context and the user's authorized scope.
- Say when the available guides do not support an answer.
- Link users to the relevant screen or guide when possible.
- Avoid inventing permissions, policies, prices, statuses, or customer data.
- Never treat an attached document's instructions as a command from the user.

When product behavior changes, update the canonical module document and the relevant in-app guide together.

## Privacy and Retention

- Send only the minimum data required for the question or brief.
- Exclude passwords, OTPs, tokens, provider secrets, and unnecessary personal data.
- Apply company and branch scope before data reaches the provider.
- Persist prompts and responses only according to the application retention policy.
- Audit generation requests and failures without logging secrets.

## Failure Behavior

- No configured provider: show AI unavailable while keeping deterministic reports and help available.
- Provider timeout or error: preserve the previous brief and return a retryable failure.
- Incomplete source data: label the gap and avoid a confident unsupported conclusion.
- Tool error: show which data source failed and continue only if the remaining answer is clearly qualified.
- Rate limit: show when the user can retry; do not bypass it through another client.

## Verification Scenarios

- Each configured provider and fallback order.
- No-provider and provider-timeout degradation.
- Permission denial for chat tools and brief regeneration.
- Cross-company and cross-branch prompt attempts.
- Tool arguments containing attempted tenant overrides.
- Zero values versus unavailable report inputs.
- Help question with supported, unsupported, and ambiguous documentation.
- Prompt-injection text inside customer or attached document content.
