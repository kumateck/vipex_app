import { afterEach, describe, expect, spyOn, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { PermissionKeys } from '@/shared/permissions/constants';
import * as authStore from '@/stores/auth-store';
import type { AuthState, AuthUser } from '@/stores/auth-store';
import * as moduleHook from '../../hooks/use-digital-receipts-module';
import { SendReceiptAction } from './send-receipt-action';

const originalState = authStore.useAuthStore.getState();
let moduleSpy: ReturnType<typeof spyOn> | undefined;
let authSpy: ReturnType<typeof spyOn> | undefined;

afterEach(() => {
  moduleSpy?.mockRestore();
  authSpy?.mockRestore();
});

function renderAction({
  enabled = true,
  permissions = [PermissionKeys.CanReadParcels] as string[],
  isDeleted = false,
} = {}) {
  moduleSpy = spyOn(moduleHook, 'useDigitalReceiptsModule').mockReturnValue({
    isDigitalReceiptsEnabled: enabled,
    isLoadingDigitalReceiptsModule: false,
  });
  authSpy = spyOn(authStore, 'useAuthStore').mockImplementation(((
    selector: (state: AuthState) => unknown,
  ) =>
    selector({
      ...originalState,
      user: { permissions } as AuthUser,
    })) as typeof authStore.useAuthStore);
  return renderToStaticMarkup(
    <SendReceiptAction parcelId="parcel" bookingCode="BK-1" isDeleted={isDeleted} />,
  );
}

describe('Super Search receipt action', () => {
  test('offers sending to staff authorized by the receipt API', () => {
    expect(renderAction()).toContain('Send receipt');
  });

  test('hides sending when the company module is disabled', () => {
    expect(renderAction({ enabled: false })).toBe('');
  });

  test('hides sending for users without a receipt permission', () => {
    expect(renderAction({ permissions: [] })).toBe('');
  });

  test('hides sending for deleted parcels', () => {
    expect(renderAction({ isDeleted: true })).toBe('');
  });
});
