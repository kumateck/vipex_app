import { PaymentComponent, Payer, CashierType, PaymentMethod } from '@/db/schemas';
import { db } from '@/db/config';

export type DbExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

export type PaymentCreateInput = {
  companyId: string;
  branchId: string;
  parcelId: string;
  component: PaymentComponent;
  payer: Payer;
  cashierType: CashierType;
  method: PaymentMethod;
  cashierUserId: string;
  amountCedis: number | string;
  receivedAt?: string;
  notes?: string | null;
  receiptNo?: string | null;
  momoTransactionId?: string | null;
};

export type PaymentAmounts = {
  grossPsw: number;
  netPsw: number;
  vatPsw: number;
  getfundPsw: number;
  nhilPsw: number;
  covidPsw: number;
  taxTotalPsw: number;
  grossCedis: number;
  netCedis: number;
  vatCedis: number;
  getfundCedis: number;
  nhilCedis: number;
  covidCedis: number;
  taxTotalCedis: number;
  taxComponentKeys: string[];
};

export type PaymentCreateResponse = {
  id: string;
  amounts: PaymentAmounts;
  message?: string;
};
