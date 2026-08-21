import { CASHIER_GUIDES } from './guides/cashier-guides';
import { COMMUNICATION_GUIDES } from './guides/communication-guides';
import { FAQ_GUIDES } from './guides/faq-guides';
import { GETTING_STARTED_GUIDES } from './guides/getting-started-guides';
import { PARCEL_GUIDES } from './guides/parcel-guides';
import { PEOPLE_GUIDES } from './guides/people-guides';
import { SUPPORT_GUIDES } from './guides/support-guides';
import { APPLICATION_MODULE_GUIDES } from './module-guides';

export const HELP_GUIDES = [
  ...FAQ_GUIDES,
  ...GETTING_STARTED_GUIDES,
  ...PARCEL_GUIDES,
  ...CASHIER_GUIDES,
  ...PEOPLE_GUIDES,
  ...COMMUNICATION_GUIDES,
  ...SUPPORT_GUIDES,
  ...APPLICATION_MODULE_GUIDES,
];

export { FAQ_GUIDES };
