import { PaymentComponent } from '@/db/schemas';
import {
  listPaymentsForParcelRepo,
  sumPaymentsForParcelComponentRepo,
  type PaymentRow,
} from '../repository';

export async function listPaymentsForParcelSvc(parcelId: string): Promise<PaymentRow[]> {
  return listPaymentsForParcelRepo(parcelId);
}

export async function sumPrincipalPaidForParcelSvc(parcelId: string): Promise<number> {
  return sumPaymentsForParcelComponentRepo(parcelId, PaymentComponent.PRINCIPAL);
}
