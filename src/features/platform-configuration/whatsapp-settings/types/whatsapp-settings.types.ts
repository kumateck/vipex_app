export type WhatsAppAvailability = {
  moduleEnabled: boolean;
  configured: boolean;
  available: boolean;
};

export type WhatsAppProviderSettings = {
  exists: boolean;
  isActive: boolean;
  phoneNumberId: string;
  wabaId: string;
  apiVersion: string;
  hasAccessToken: boolean;
  hasAppSecret: boolean;
  hasWebhookVerifyToken: boolean;
  accessTokenSource: 'provider' | 'environment' | null;
  updatedAt: string | null;
};

export type WhatsAppEventTemplate = {
  code: string;
  name: string;
  description: string;
  category: 'authentication' | 'utility';
  defaultTemplateName: string;
  defaultLanguage: string;
  templateName: string;
  language: string;
  isCustomized: boolean;
  bodyParams: string[];
  buttonParam?: string;
  suggestedTemplateBody: string;
  suggestedButton?: string;
};

export type WhatsAppSettings = {
  availability: WhatsAppAvailability;
  provider: WhatsAppProviderSettings;
  webhookUrl: string;
  events: WhatsAppEventTemplate[];
};

export type WhatsAppProviderFormValues = {
  phoneNumberId: string;
  wabaId: string;
  apiVersion: string;
  accessToken: string;
  appSecret: string;
  webhookVerifyToken: string;
  isActive: boolean;
};
