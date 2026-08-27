export type MobileCustomer = {
  id: string;
  fullname: string;
  telephone?: string | null;
  telephone2?: string | null;
  address?: string | null;
  email?: string | null;
  customerType: number;
  creditEligible: boolean;
  creditLimitPsw: number;
  createdAt: string;
};

export type MobileCustomerPatch = Pick<
  MobileCustomer,
  'id' | 'fullname' | 'telephone' | 'telephone2' | 'address' | 'email'
>;
