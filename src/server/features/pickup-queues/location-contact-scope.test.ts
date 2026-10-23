import { afterEach, describe, expect, spyOn, test } from 'bun:test';
import { ParcelStatus } from '@/db/schemas/enums';
import * as branchService from '../branches/service';
import * as locationService from '../locations/service';
import * as parcelService from '../shipments/parcels.service';
import * as repository from './repository';
import * as notifications from '../notification-hub/service';
import { createPickupQueueSvc } from './service';

const restorations: Array<() => void> = [];
afterEach(() => {
  for (const restore of restorations.splice(0).reverse()) restore();
});
describe('queue SMS location contact scope', () => {
  test.each([
    { companyId: 'foreign', branchId: 'branch', isDeleted: false },
    { companyId: 'company', branchId: 'other', isDeleted: false },
    { companyId: 'company', branchId: 'branch', isDeleted: true },
  ])(
    'rejects an invalid assigned location before creating a queue or sending SMS',
    async (scope) => {
      const parcel = spyOn(parcelService, 'getParcelSvc').mockResolvedValue({
        id: 'parcel',
        companyId: 'company',
        destinationId: 'branch',
        pickupLocationId: 'location',
        status: ParcelStatus.AWAITING_PICKUP,
      } as Awaited<ReturnType<typeof parcelService.getParcelSvc>>);
      const branch = spyOn(branchService, 'getBranchSvc').mockResolvedValue({
        id: 'branch',
        name: 'Branch',
        usePickupQueue: true,
      } as Awaited<ReturnType<typeof branchService.getBranchSvc>>);
      const location = spyOn(locationService, 'getLocationSvc').mockResolvedValue({
        id: 'location',
        name: 'Desk',
        telephone: '0300000001',
        ...scope,
      } as Awaited<ReturnType<typeof locationService.getLocationSvc>>);
      const existing = spyOn(repository, 'getPickupQueueByParcelAndDateRepo').mockResolvedValue(
        null,
      );
      const create = spyOn(repository, 'createPickupQueueRepo');
      const send = spyOn(notifications, 'sendPickupQueueNotificationSvc');
      restorations.push(
        () => parcel.mockRestore(),
        () => branch.mockRestore(),
        () => location.mockRestore(),
        () => existing.mockRestore(),
        () => create.mockRestore(),
        () => send.mockRestore(),
      );
      await expect(
        createPickupQueueSvc({ parcelId: 'parcel', queuedBy: 'actor', sendSms: true }),
      ).rejects.toThrow('assigned queue location');
      expect(create).not.toHaveBeenCalled();
      expect(send).not.toHaveBeenCalled();
    },
  );
});
