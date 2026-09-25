import type { CustomerLookupResult } from '@mobile/types/booking';
import { isTenDigitPhone } from './phone-utils';

type Person = {
  telephone: string;
  telephone2: string;
  fullname: string;
  customerId: string;
};

type Dependencies = {
  find: (telephone: string) => Promise<CustomerLookupResult[]>;
  create: (input: {
    fullname: string;
    telephone: string;
    telephone2: string | null;
  }) => Promise<{ id: string }>;
};

export async function resolveBookingCustomer(person: Person, label: string, deps: Dependencies) {
  const phones = [person.telephone, person.telephone2].filter(isTenDigitPhone);
  const findMatches = async () => {
    const byPhone = await Promise.all(phones.map(deps.find));
    if (
      byPhone.length > 1 &&
      byPhone[0]?.length &&
      byPhone[1]?.length &&
      !byPhone[0].some((match) => byPhone[1]?.some((other) => other.id === match.id))
    ) {
      throw new Error(`${label} telephone numbers belong to different customers`);
    }
    return [...new Map(byPhone.flat().map((match) => [match.id, match])).values()];
  };

  const matches = await findMatches();
  if (matches.length > 1 && !matches.some((match) => match.id === person.customerId)) {
    throw new Error(`Select the matching ${label.toLowerCase()} customer before continuing`);
  }
  const existing = matches.find((match) => match.id === person.customerId) ?? matches[0];
  if (existing) return existing.id;

  const fullname = person.fullname.trim();
  if (!fullname) throw new Error(`${label} fullname is required`);
  try {
    return (
      await deps.create({
        fullname,
        telephone: person.telephone,
        telephone2: person.telephone2 || null,
      })
    ).id;
  } catch (error) {
    // A concurrent booking may have created the same customer after lookup.
    const retry = await findMatches();
    if (retry.length === 1 && retry[0]) return retry[0].id;
    throw error;
  }
}
