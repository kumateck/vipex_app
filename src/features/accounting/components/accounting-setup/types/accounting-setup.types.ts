export type SetupAccess = {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

export type PolicyCodeOption = {
  value: string;
  label: string;
  defaultName: string;
  description: string;
  defaultFundingScope: string;
};
