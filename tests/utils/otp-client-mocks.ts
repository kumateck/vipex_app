import { afterAll, mock, spyOn } from 'bun:test';
import * as parcelApi from '@/features/operations/parcel/api/parcel.api';
import { loadSession, sendOtp, verifyOtp } from './otp-client-transport';

const status = ({ parcelId }: { parcelId: string }) => ({ unwrap: () => loadSession(parcelId) });
const request = (input: Parameters<typeof sendOtp>[0]) => ({ unwrap: () => sendOtp(input) });
const verify = (input: Parameters<typeof verifyOtp>[0]) => ({ unwrap: () => verifyOtp(input) });
const spies = [
  spyOn(parcelApi, 'useLazyGetReceiverOtpSessionQuery').mockImplementation(
    () => [status, {}] as never,
  ),
  spyOn(parcelApi, 'useRequestReceiverOtpMutation').mockImplementation(
    () => [request, { isLoading: false }] as never,
  ),
  spyOn(parcelApi, 'useVerifyReceiverOtpMutation').mockImplementation(
    () => [verify, { isLoading: false }] as never,
  ),
];
afterAll(() => {
  for (const spy of spies) spy.mockRestore();
});

const withAuth = <T>(operation: (token: string) => Promise<T>) => operation('local-test');
mock.module('@mobile/providers/auth-provider', () => ({ useAuth: () => ({ withAuth }) }));
mock.module('@mobile/lib/notify', () => ({ notifyError: () => {}, notifySuccess: () => {} }));
mock.module('@mobile/features/operations/office-pickup/services', () => ({
  getPickupOtpSession: (_token: string, parcelId: string) => loadSession(parcelId),
  getPickupOtpApproval: async () => ({ approval: null }),
  requestPickupOtp: (_token: string, input: Parameters<typeof sendOtp>[0]) => sendOtp(input),
  verifyPickupOtp: (_token: string, input: Parameters<typeof verifyOtp>[0]) => verifyOtp(input),
  loadPickupResources: async () => ({
    details: { parcel: { shelfPickerStaffId: 'picker' }, pickupQueue: null },
    staffOptions: [],
    cardOptions: [],
    mainReceiverCards: [],
    secondReceiverCards: [],
  }),
  addPickupCustomerCard: async () => ({}),
  markParcelDeliveredByOffice: async () => ({}),
  requestParcelHomeDelivery: async () => ({}),
  resolvePickupSecondReceiver: async () => ({}),
  submitPickupHandover: async () => ({}),
}));
