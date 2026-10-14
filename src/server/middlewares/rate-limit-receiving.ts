import { ParcelStatus } from '@/db/schemas/enums';

export async function isReceivingRequest(request: Request, signedAccessToken: boolean) {
  if (!signedAccessToken) return false;
  const url = new URL(request.url);
  const parcelBase = '/v1/shipments/parcels';
  if (request.method === 'GET') {
    if (
      url.pathname === parcelBase &&
      Number(url.searchParams.get('status')) === ParcelStatus.IN_TRANSIT
    )
      return true;
    if (/^\/v1\/shipments\/parcels\/[^/]+\/details$/.test(url.pathname)) return true;
    if (/^\/v1\/shipments\/consignments\/(incoming|[^/]+(?:\/items)?)$/.test(url.pathname))
      return true;
  }
  if (
    request.method === 'POST' &&
    /^\/v1\/shipments\/consignments\/[^/]+\/(receive|close)$/.test(url.pathname)
  )
    return true;
  if (
    request.method === 'POST' &&
    /^\/v1\/shipments\/parcels\/(bulk-mark-received|[^/]+\/mark-received)$/.test(url.pathname)
  )
    return true;
  if (request.method !== 'PATCH' || !/^\/v1\/shipments\/parcels\/[^/]+$/.test(url.pathname))
    return false;
  try {
    const body = (await request.clone().json()) as { status?: unknown };
    return body.status === ParcelStatus.ARRIVED_AT_DESTINATION;
  } catch {
    return false;
  }
}
