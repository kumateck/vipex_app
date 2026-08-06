import {
  getCompanySmsSettingsSvc,
  setCompanyDefaultSmsProviderSvc,
  updateCompanySmsEventSvc,
} from './sms-settings.service';

export function getCompanySmsSettingsCtrl(companyId: string) {
  return getCompanySmsSettingsSvc(companyId);
}

export function setCompanyDefaultSmsProviderCtrl(input: {
  companyId: string;
  actorUserId: string;
  providerKey: string;
}) {
  return setCompanyDefaultSmsProviderSvc(input);
}

export function updateCompanySmsEventCtrl(input: {
  companyId: string;
  actorUserId: string;
  eventCode: string;
  body: string;
}) {
  return updateCompanySmsEventSvc(input);
}
