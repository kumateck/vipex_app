import { env } from '@/server/utils/env';
import { getDefaultProviderByChannelRepo } from '../notification-hub/repository';
import { ServiceUnavailable } from '@/server/utils/http-error';

export type MomoConfig = {
  baseUrl: string;
  subscriptionKey: string;
  apiUser: string;
  apiKey: string;
  targetEnvironment: string;
  callbackHost: string;
};

export async function resolveMomoConfig(companyId: string): Promise<MomoConfig> {
  const provider = await getDefaultProviderByChannelRepo(companyId, 'momo');
  const cfg = (provider?.configJson ?? {}) as Record<string, unknown>;

  const baseUrl = (typeof cfg.baseUrl === 'string' && cfg.baseUrl) || env.MTN_MOMO_API_BASE_URL;
  const subscriptionKey =
    (typeof cfg.subscriptionKey === 'string' && cfg.subscriptionKey) ||
    env.MTN_MOMO_SUBSCRIPTION_KEY ||
    '';
  const apiUser = typeof cfg.apiUser === 'string' ? cfg.apiUser : '';
  const apiKey = typeof cfg.apiKey === 'string' ? cfg.apiKey : '';
  const targetEnvironment =
    (typeof cfg.targetEnvironment === 'string' && cfg.targetEnvironment) ||
    env.MTN_MOMO_TARGET_ENVIRONMENT;

  if (!subscriptionKey || !apiUser || !apiKey) {
    throw ServiceUnavailable(
      'MTN MoMo is not configured for this company (missing subscriptionKey/apiUser/apiKey)',
    );
  }

  return {
    baseUrl,
    subscriptionKey,
    apiUser,
    apiKey,
    targetEnvironment,
    callbackHost: env.MTN_MOMO_CALLBACK_HOST,
  };
}

async function getMomoAccessToken(config: MomoConfig): Promise<string> {
  const basicAuth = Buffer.from(`${config.apiUser}:${config.apiKey}`).toString('base64');
  const response = await fetch(`${config.baseUrl}/collection/token/`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Ocp-Apim-Subscription-Key': config.subscriptionKey,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw ServiceUnavailable(`MTN MoMo auth failed (${response.status}): ${text.slice(0, 300)}`);
  }

  const payload = (await response.json()) as { access_token?: string };
  if (!payload.access_token) {
    throw ServiceUnavailable('MTN MoMo auth response missing access_token');
  }
  return payload.access_token;
}

export async function requestToPayClient(
  config: MomoConfig,
  input: {
    externalReferenceId: string;
    amountCedis: number;
    payerMomoNumber: string;
    payerMessage: string;
    payeeNote: string;
  },
): Promise<{ ok: boolean; errorMessage?: string }> {
  const accessToken = await getMomoAccessToken(config);

  const response = await fetch(`${config.baseUrl}/collection/v1_0/requesttopay`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Reference-Id': input.externalReferenceId,
      'X-Target-Environment': config.targetEnvironment,
      'Ocp-Apim-Subscription-Key': config.subscriptionKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: input.amountCedis.toFixed(2),
      currency: 'GHS',
      externalId: input.externalReferenceId,
      payer: {
        partyIdType: 'MSISDN',
        partyId: input.payerMomoNumber,
      },
      payerMessage: input.payerMessage,
      payeeNote: input.payeeNote,
    }),
  });

  if (response.status === 202) {
    return { ok: true };
  }

  const text = await response.text().catch(() => '');
  return {
    ok: false,
    errorMessage: `MTN MoMo requesttopay returned ${response.status}: ${text.slice(0, 300)}`,
  };
}

export type MomoRequestToPayStatus = 'PENDING' | 'SUCCESSFUL' | 'FAILED';

export async function getRequestToPayStatusClient(
  config: MomoConfig,
  externalReferenceId: string,
): Promise<{ status: MomoRequestToPayStatus; financialTransactionId?: string; reason?: string }> {
  const accessToken = await getMomoAccessToken(config);

  const response = await fetch(
    `${config.baseUrl}/collection/v1_0/requesttopay/${externalReferenceId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Target-Environment': config.targetEnvironment,
        'Ocp-Apim-Subscription-Key': config.subscriptionKey,
      },
    },
  );

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw ServiceUnavailable(
      `MTN MoMo status check failed (${response.status}): ${text.slice(0, 300)}`,
    );
  }

  const payload = (await response.json()) as {
    status?: string;
    financialTransactionId?: string;
    reason?: string;
  };

  const status: MomoRequestToPayStatus =
    payload.status === 'SUCCESSFUL' || payload.status === 'FAILED' ? payload.status : 'PENDING';

  return {
    status,
    financialTransactionId: payload.financialTransactionId,
    reason: payload.reason,
  };
}
