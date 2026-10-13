import { ParcelInTransit } from './parcel-in-transit';
import type { InTransitView } from './use-parcel-transit-workflow';

export function ParcelInTransitPage({ view }: { view: InTransitView }) {
  return <ParcelInTransit view={view} />;
}
