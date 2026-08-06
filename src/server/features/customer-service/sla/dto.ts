export type CustomerServiceSlaListInput = {
  companyId: string;
};

export type CustomerServiceSlaCreateInput = {
  companyId: string;
  userId: string;
  name: string;
  firstResponseMinutes?: number;
  resolutionMinutes?: number;
  escalationMinutes?: number;
  isActive?: boolean;
};

export type CustomerServiceSlaItem = {
  id: string;
  companyId: string;
  name: string;
  firstResponseMinutes: number;
  resolutionMinutes: number;
  escalationMinutes: number;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};
