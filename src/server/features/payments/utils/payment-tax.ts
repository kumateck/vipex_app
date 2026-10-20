import {
  computeTaxFromProfilePrincipalPsw,
  sumComponentByKey,
} from '@/server/utils/tax/profile-engine';
import { computeGhanaTaxesFromPesewas } from '@/server/utils/tax/ghana';
import { getActiveTaxProfileWithComponentsRepo } from '../../accounting/repository';
import type { DbExecutor, PaymentAmounts } from '../types/payment.types';

export function toPaymentAmounts(tax: {
  principal: bigint;
  net: bigint;
  vat: bigint;
  getfund: bigint;
  nhil: bigint;
  covid: bigint;
  totalTax: bigint;
  taxComponentKeys: string[];
}): PaymentAmounts {
  return {
    grossPsw: Number(tax.principal),
    netPsw: Number(tax.net),
    vatPsw: Number(tax.vat),
    getfundPsw: Number(tax.getfund),
    nhilPsw: Number(tax.nhil),
    covidPsw: Number(tax.covid),
    taxTotalPsw: Number(tax.totalTax),
    grossCedis: Number(tax.principal) / 100,
    netCedis: Number(tax.net) / 100,
    vatCedis: Number(tax.vat) / 100,
    getfundCedis: Number(tax.getfund) / 100,
    nhilCedis: Number(tax.nhil) / 100,
    covidCedis: Number(tax.covid) / 100,
    taxTotalCedis: Number(tax.totalTax) / 100,
    taxComponentKeys: tax.taxComponentKeys,
  };
}

export function normalizeTaxKey(value: string) {
  return value
    .replace(/[\s_-]+/g, '')
    .trim()
    .toLowerCase();
}

export async function computeProfileTaxBreakdown(input: {
  companyId: string;
  principalPsw: bigint;
  executor: DbExecutor;
  at?: Date;
}) {
  const activeProfile = await getActiveTaxProfileWithComponentsRepo(
    { companyId: input.companyId, at: input.at },
    input.executor,
  );

  if (!activeProfile || activeProfile.components.length === 0) {
    // Parcel principal is taxable even before a company-specific tax profile
    // has been configured. Keep the configured profile path authoritative, but
    // do not silently issue zero-tax receipts for the default Ghana scheme.
    const fallback = computeGhanaTaxesFromPesewas(input.principalPsw);
    return {
      ...fallback,
      profileId: null,
      profileName: null,
      taxComponentKeys: ['VAT', 'GETFUND', 'NHIL', 'COVID'],
    };
  }

  const breakdown = computeTaxFromProfilePrincipalPsw(input.principalPsw, activeProfile.components);
  const normalized = breakdown.components.map((component) => ({
    ...component,
    normalizedKey: normalizeTaxKey(component.key),
  }));
  const normalizedView = normalized.map((component) => ({
    key: component.normalizedKey,
    amountPsw: component.amountPsw,
  }));

  const vat = sumComponentByKey(normalizedView, 'vat');
  const getfund =
    sumComponentByKey(normalizedView, 'getfund') +
    sumComponentByKey(normalizedView, 'getfl') +
    sumComponentByKey(normalizedView, 'getfundlevy');
  const nhil =
    sumComponentByKey(normalizedView, 'nhil') + sumComponentByKey(normalizedView, 'nhillevy');
  const covid =
    sumComponentByKey(normalizedView, 'covid') +
    sumComponentByKey(normalizedView, 'covid19levy') +
    sumComponentByKey(normalizedView, 'covidlevy');

  return {
    principal: breakdown.principal,
    net: breakdown.net,
    vat,
    getfund,
    nhil,
    covid,
    totalTax: breakdown.totalTax,
    profileId: activeProfile.profileId,
    profileName: activeProfile.profileName,
    taxComponentKeys: activeProfile.components.map((component) => component.key),
  };
}
