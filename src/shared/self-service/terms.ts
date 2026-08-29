export const SELF_SERVICE_TERMS_VERSION = '2026-08-29';

export const SELF_SERVICE_TERMS_SECTIONS = [
  {
    title: '1. Mandatory Inspection',
    items: [
      'All parcels are subject to inspection by VIPex Parcel Attendants before acceptance.',
      'Parcels presented without inspection at the sender’s request are accepted at the sender’s sole risk. VIPex shall not be liable for claims relating to the condition or contents of such parcels.',
      'The sender is responsible for ensuring that parcels are properly packaged to prevent damage during handling and transportation.',
    ],
  },
  {
    title: '2. Prohibited Items',
    items: [
      'VIPex does not accept cash, firearms, explosives, illegal substances, hazardous or flammable materials, or any item prohibited by law.',
      'Any such item discovered shall be confiscated and reported.',
    ],
  },
  {
    title: '3. Declared Value & Liability',
    items: [
      'For undeclared parcels, liability is limited to 40 times the courier charge.',
      'For declared parcels, liability shall not exceed 50% of the declared value.',
      'Declared value does not constitute insurance unless expressly agreed in writing.',
    ],
  },
  {
    title: '4. Non-Collection & Storage Charges',
    items: [
      'Parcels not collected within two (2) weeks attract storage charges of GHS 5 per day, accruing until collection.',
      'VIPex reserves the right to dispose of uncollected parcels after reasonable notice in order to recover outstanding charges.',
    ],
  },
  {
    title: '5. Courier Charges',
    items: [
      'Charges are determined based on the parcel’s value, weight, size, fragility, and any special handling requirements as assessed by the Parcel Attendant.',
      'Fragile items, including glassware, electronics, ceramics, mirrors, CDs and DVDs, attract higher courier charges and must be declared.',
    ],
  },
  {
    title: '6. Claims',
    items: [
      'VIPex shall only deal with claims from the sender.',
      'Recipients must inspect parcels at the collection point before leaving. VIPex shall not be liable for claims raised after the parcel has left the collection point.',
    ],
  },
  {
    title: '7. Force Majeure',
    items: [
      'VIPex shall not be liable for loss, damage, or delay caused by events beyond its reasonable control, including accidents, road conditions, fire, flood, strikes, or acts of God.',
    ],
  },
] as const;

export function hasAcceptedCurrentSelfServiceTerms(input: {
  termsAccepted: unknown;
  termsVersion: unknown;
}): boolean {
  return input.termsAccepted === true && input.termsVersion === SELF_SERVICE_TERMS_VERSION;
}
