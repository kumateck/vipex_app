/** Delivery states reported by Meta, ordered so a late webhook never downgrades a row. */
const STATUS_RANK: Record<string, number> = {
  pending: 0,
  sent: 1,
  delivered: 2,
  read: 3,
};

/** Meta's per-message pricing, sent with `sent`/`delivered` statuses. */
export type WhatsAppMessagePricing = {
  billable: boolean;
  category: string | null;
  type: string | null;
};

export type WhatsAppStatusUpdate = {
  phoneNumberId: string | null;
  providerMessageId: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  errorMessage: string | null;
  pricing: WhatsAppMessagePricing | null;
};

const lowerOrNull = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim().toLowerCase() : null;

export function parseWhatsAppPricing(value: unknown): WhatsAppMessagePricing | null {
  if (!value || typeof value !== 'object') return null;
  const pricing = value as { billable?: unknown; category?: unknown; type?: unknown };
  if (typeof pricing.billable !== 'boolean') return null;
  return {
    billable: pricing.billable,
    category: lowerOrNull(pricing.category),
    type: lowerOrNull(pricing.type),
  };
}

/** Pulls `statuses[]` out of a WhatsApp Business Account webhook payload. */
export function extractWhatsAppStatusUpdates(payload: unknown): WhatsAppStatusUpdate[] {
  const updates: WhatsAppStatusUpdate[] = [];
  const entries = (payload as { entry?: unknown[] } | null)?.entry;
  if (!Array.isArray(entries)) return updates;

  for (const entry of entries) {
    const changes = (entry as { changes?: unknown[] })?.changes;
    if (!Array.isArray(changes)) continue;
    for (const change of changes) {
      const value = (change as { value?: Record<string, unknown> })?.value;
      const phoneNumberId =
        typeof (value?.metadata as { phone_number_id?: unknown })?.phone_number_id === 'string'
          ? (value?.metadata as { phone_number_id: string }).phone_number_id
          : null;
      const statuses = value?.statuses;
      if (!Array.isArray(statuses)) continue;
      for (const item of statuses as Array<Record<string, unknown>>) {
        const status = item.status;
        if (
          typeof item.id !== 'string' ||
          (status !== 'sent' && status !== 'delivered' && status !== 'read' && status !== 'failed')
        ) {
          continue;
        }
        const error = Array.isArray(item.errors)
          ? (item.errors[0] as { code?: unknown; title?: unknown; message?: unknown } | undefined)
          : undefined;
        updates.push({
          phoneNumberId,
          providerMessageId: item.id,
          status,
          errorMessage: error
            ? `WhatsApp delivery failed (code ${String(error.code ?? 'n/a')}): ${String(error.message ?? error.title ?? 'Unknown error')}`.slice(
                0,
                500,
              )
            : null,
          pricing: parseWhatsAppPricing(item.pricing),
        });
      }
    }
  }
  return updates;
}

/** The status to store, or null when the update would move the row backwards. */
export function nextDispatchStatus(current: string, incoming: WhatsAppStatusUpdate['status']) {
  if (incoming === 'failed') return current === 'read' || current === 'failed' ? null : 'failed';
  if (current === 'failed') return null;
  const currentRank = STATUS_RANK[current] ?? 0;
  return STATUS_RANK[incoming]! > currentRank ? incoming : null;
}
