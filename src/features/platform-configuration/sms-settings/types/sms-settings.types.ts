export interface CompanySmsProviderOption {
  providerKey: string;
  name: string;
  isActive: boolean;
  isDefault: boolean;
  isConfigured: boolean;
  configurationSource: 'provider' | 'environment';
}

export interface CompanySmsEventDefinition {
  code: string;
  name: string;
  description: string;
  dispatchAction: string;
  recipient: string;
  defaultBody: string;
  body: string;
  variables: string[];
  isCustomized: boolean;
}

export interface CompanySmsSettings {
  defaultProviderKey: string | null;
  providers: CompanySmsProviderOption[];
  events: CompanySmsEventDefinition[];
}

export interface CompanySmsTemplate {
  id: string;
  channel: string;
  code: string;
  name: string;
  subject: string | null;
  body: string;
  variablesJson: unknown;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SmsTemplateFormValues = {
  code: string;
  name: string;
  body: string;
  variables: string[];
  isActive: boolean;
};

export type BulkSmsAudience =
  | 'customers_all'
  | 'users_all'
  | 'employees_all'
  | 'employees_birthday_today';

export type CreateBulkSmsInput = {
  name: string;
  templateId: string | null;
  body: string | null;
  audienceType: BulkSmsAudience;
  submitForApproval: boolean;
};
