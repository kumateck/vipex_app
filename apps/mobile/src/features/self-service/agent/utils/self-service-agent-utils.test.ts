import { describe, expect, it } from 'bun:test';
import type { SelfServiceDraft } from '../types';
import { filterSelfServiceDrafts } from './filter-self-service-drafts';
import {
  getSelfServiceContactError,
  getSelfServiceParcelError,
  toSelfServiceContactInput,
} from './self-service-contact';

const draft = (overrides: Partial<SelfServiceDraft>): SelfServiceDraft => ({
  id: 'draft-1',
  branchId: 'source-branch',
  status: 0,
  senderFullname: 'Ama Mensah',
  senderPhone: '0248111128',
  senderPhone2: null,
  receiverFullname: 'Kofi Boateng',
  receiverPhone: '0201234567',
  receiverPhone2: '0551112222',
  destinationBranchId: null,
  destinationLocationId: null,
  parcelContent: 'Books',
  parcelValuePsw: 0,
  callSender: false,
  expiresAt: '',
  claimedBy: null,
  claimedAt: null,
  createdAt: '',
  updatedAt: '',
  ...overrides,
});

describe('filterSelfServiceDrafts', () => {
  const drafts = [
    draft({}),
    draft({
      id: 'draft-2',
      senderFullname: 'Yaw',
      receiverFullname: 'Esi',
      senderPhone: '0270000000',
      receiverPhone: '0260000000',
      receiverPhone2: null,
    }),
  ];

  it('returns every draft for a blank search', () => {
    expect(filterSelfServiceDrafts(drafts, '  ')).toHaveLength(2);
  });

  it('matches sender or receiver names case-insensitively', () => {
    expect(filterSelfServiceDrafts(drafts, 'ama').map((d) => d.id)).toEqual(['draft-1']);
    expect(filterSelfServiceDrafts(drafts, 'KOFI').map((d) => d.id)).toEqual(['draft-1']);
  });

  it('matches primary and backup phones ignoring spacing', () => {
    expect(filterSelfServiceDrafts(drafts, '024 811').map((d) => d.id)).toEqual(['draft-1']);
    expect(filterSelfServiceDrafts(drafts, '0551112222').map((d) => d.id)).toEqual(['draft-1']);
  });

  it('returns nothing when no field matches', () => {
    expect(filterSelfServiceDrafts(drafts, 'zzz')).toHaveLength(0);
  });
});

describe('self-service contact validation', () => {
  it('requires a name and 10-digit phones', () => {
    expect(getSelfServiceContactError({ fullname: ' ', phone: '0248111128', phone2: '' })).toBe(
      'Enter a name',
    );
    expect(getSelfServiceContactError({ fullname: 'Ama', phone: '024811', phone2: '' })).toBe(
      'Phone must be 10 digits',
    );
    expect(
      getSelfServiceContactError({ fullname: 'Ama', phone: '024 811 1128', phone2: '12' }),
    ).toBe('Backup phone must be 10 digits');
    expect(
      getSelfServiceContactError({ fullname: 'Ama', phone: '024-811-1128', phone2: '' }),
    ).toBeNull();
  });

  it('normalizes the payload sent to the server', () => {
    expect(
      toSelfServiceContactInput({ fullname: ' Ama ', phone: '024 811 1128', phone2: ' ' }),
    ).toEqual({
      fullname: 'Ama',
      phone: '0248111128',
      phone2: null,
    });
  });
});

describe('self-service parcel validation', () => {
  const valid = {
    destinationBranchId: 'branch-1',
    parcelContent: 'Books',
    parcelValue: '1,200.50',
  };

  it('accepts a destination, contents and a non-negative value', () => {
    expect(getSelfServiceParcelError(valid)).toBeNull();
    expect(getSelfServiceParcelError({ ...valid, parcelValue: '0' })).toBeNull();
  });

  it('flags a missing destination, blank contents or invalid value', () => {
    expect(getSelfServiceParcelError({ ...valid, destinationBranchId: '' })).toBe(
      'Select a destination branch',
    );
    expect(getSelfServiceParcelError({ ...valid, parcelContent: ' ' })).toBe(
      'Enter what is inside the parcel',
    );
    for (const parcelValue of ['', 'abc', '-5'])
      expect(getSelfServiceParcelError({ ...valid, parcelValue })).toBe(
        'Enter a valid declared value',
      );
  });
});
