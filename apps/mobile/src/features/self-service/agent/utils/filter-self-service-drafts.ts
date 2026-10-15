import type { SelfServiceDraft } from '../types';

const digitsOnly = (value: string) => value.replace(/\D/g, '');

// Matches sender/receiver names (case-insensitive) and phones (ignoring spaces,
// dashes and other punctuation, so "024 811" finds 0248111128).
export function filterSelfServiceDrafts(drafts: SelfServiceDraft[], search: string) {
  const text = search.trim().toLowerCase();
  if (!text) return drafts;
  const digits = digitsOnly(text);
  return drafts.filter((draft) => {
    const names = [draft.senderFullname, draft.receiverFullname];
    if (names.some((name) => name.toLowerCase().includes(text))) return true;
    if (!digits) return false;
    const phones = [
      draft.senderPhone,
      draft.senderPhone2,
      draft.receiverPhone,
      draft.receiverPhone2,
    ];
    return phones.some((phone) => (phone ? digitsOnly(phone).includes(digits) : false));
  });
}
