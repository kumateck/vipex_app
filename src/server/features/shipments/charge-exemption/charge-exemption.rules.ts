import { BadRequest } from '@/server/utils/http-error';
import { isChargeExemptCustomerType } from '@/shared/customers/customer-types';

export function assertParcelCanAccrueCharge(
  parcel: { chargeExemptCustomerType?: number | null },
  amount: number,
) {
  if (isChargeExemptCustomerType(parcel.chargeExemptCustomerType) && amount !== 0) {
    throw BadRequest(
      'This parcel is exempt from every charge, including storage and delivery fees',
    );
  }
}
