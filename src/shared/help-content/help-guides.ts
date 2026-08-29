import { AI_GUIDES } from './guides/ai-guides';
import { CASHIER_GUIDES } from './guides/cashier-guides';
import { COMMUNICATION_GUIDES } from './guides/communication-guides';
import { FAQ_GUIDES } from './guides/faq-guides';
import { GETTING_STARTED_GUIDES } from './guides/getting-started-guides';
import { OTP_GUIDES } from './guides/otp-guides';
import { PARCEL_GUIDES } from './guides/parcel-guides';
import { PEOPLE_GUIDES } from './guides/people-guides';
import { RECONCILIATION_GUIDES } from './guides/reconciliation-guides';
import { RIDER_OPERATIONS_GUIDES } from './guides/rider-operations-guides';
import { SELF_SERVICE_GUIDES } from './guides/self-service-guides';
import { SUPPORT_GUIDES } from './guides/support-guides';
import { TECHNOLOGY_GUIDES } from './guides/technology-guides';
import { APPLICATION_MODULE_GUIDES } from './module-guides';

export const HELP_GUIDES = [
  ...FAQ_GUIDES,
  ...GETTING_STARTED_GUIDES,
  ...PARCEL_GUIDES,
  ...CASHIER_GUIDES,
  ...PEOPLE_GUIDES,
  ...COMMUNICATION_GUIDES,
  ...SUPPORT_GUIDES,
  ...SELF_SERVICE_GUIDES,
  ...RECONCILIATION_GUIDES,
  ...OTP_GUIDES,
  ...RIDER_OPERATIONS_GUIDES,
  ...TECHNOLOGY_GUIDES,
  ...AI_GUIDES,
  ...APPLICATION_MODULE_GUIDES,
];

export { FAQ_GUIDES };
