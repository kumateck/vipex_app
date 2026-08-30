# API: Platform, Communication, and Intelligence

All paths are relative to `/v1`.

## Company Platform

- `/company-modules`: read and update a company's enabled modules.
- `/module-workspace`: module overview data.
- `/audit`: audit search and entity history.
- `/desktop-updates`: desktop release metadata and artifacts required by installed clients.
- `/mobile-updates`: authenticated mobile release metadata plus a 15-minute signed HTTPS app-proxy
  URL for Android APK delivery. The signed download route exposes only the fixed latest APK,
  rejects invalid or expired signatures with 401, and keeps the MinIO origin private.
- `/geolocation`: distance and nearby-branch queries.
- `/uploads`: shared model-linked object handling.

Update download surfaces expose only required release data. Administrative release mutations remain protected.

## Notification Hub

`/notification-hub` manages providers, templates, campaigns, dispatch logs, and company SMS
configuration. Bulk SMS template and campaign bodies accept `{{senderName}}`, `{{senderPhone}}`,
`{{recipientName}}`, `{{recipientPhone}}`, `{{branch}}`, `{{location}}`, and `{{date}}`; any other
token, including `{{companyId}}`, is rejected with a bad-request response. Sender, branch, and
location values are resolved from the dispatching user, while recipient values are resolved from
each audience record. Missing values resolve to empty strings.

## Communication

`/communication` includes threads, messages, channels, groups, engagement requests, approvals/declines, presence, and calls. Internal communication and LiveKit call capabilities have separate module gates.

`/customer-service` includes conversations, tickets, feedback, and SLA records. It is gated by the customer-service communication module and relevant permissions.

`/it-support` includes ticket list/create/detail, events, notes, attachments through uploads, and status updates. Read, create, and update permissions are separate.

## Help and AI

- `/help-assistant`: permission- and rate-limited help questions grounded in approved guides.
- `/ai-chat`: latest conversation and message operations using controlled read-only tools.
- `/executive-insights`: executive snapshot and narrative generation.
- `/fleet-anomaly-brief`: persisted fleet exception brief and regeneration.
- `/operations-exceptions-brief`: persisted operational exception brief and regeneration.
- `/management-daily-brief`: combined management brief and regeneration.

All business data is scoped before it is sent to an LLM provider. Tenant identifiers are not model-settable tool arguments. Provider failure degrades the AI feature without disabling the underlying deterministic report.

## Governance

`/rbac` is the role and permission administration surface. Permission managers cannot grant permissions beyond their own authorized set, and System-Admin-only capabilities remain reserved.

`/audit` is the read surface for security and business audit events. Secrets, tokens, passwords, and OTPs must be redacted.

See [Platform and Access Control](../PLATFORM_AND_ACCESS.md), [AI, Help, and Management Insights](../AI_HELP_AND_INSIGHTS.md), and [Communication Suite](../COMMUNICATION_SUITE_SPEC.md).
