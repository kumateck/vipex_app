const PARCEL_TRACKING_ORIGIN = 'https://vipexparcel.com';

export function buildParcelTrackingUrl(trackingCode: string) {
  return `${PARCEL_TRACKING_ORIGIN}/tracking/${encodeURIComponent(trackingCode)}`;
}
