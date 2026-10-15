import { useMemo, useState } from 'react';
import { BranchType } from '@mobile/constants/branch';
import { useParcelBranchOptions } from '@mobile/features/parcel-create/hooks';
import { useAuth } from '@mobile/providers/auth-provider';
import type { SelfServiceDraft, UpdateSelfServiceDraftInput } from '../types';
import {
  getSelfServiceContactError,
  getSelfServiceParcelError,
  toSelfServiceContactInput,
  type SelfServiceContactForm,
} from '../utils';

type Role = 'sender' | 'receiver';
const toForm = (fullname: string, phone: string, phone2: string | null) => ({
  fullname,
  phone,
  phone2: phone2 ?? '',
});

export function useSelfServiceDraftEditor(
  draft: SelfServiceDraft,
  onSave: (input: UpdateSelfServiceDraftInput) => Promise<boolean>,
  onDone: () => void,
) {
  const { session } = useAuth();
  const companyId = session.user?.company?.id ?? session.user?.companyId ?? null;
  const [contacts, setContacts] = useState<Record<Role, SelfServiceContactForm>>(() => ({
    sender: toForm(draft.senderFullname, draft.senderPhone, draft.senderPhone2),
    receiver: toForm(draft.receiverFullname, draft.receiverPhone, draft.receiverPhone2),
  }));
  const [destinationBranchId, setDestinationBranchId] = useState(draft.destinationBranchId ?? '');
  const [destinationLocationId, setDestinationLocationId] = useState(
    draft.destinationLocationId ?? '',
  );
  const [parcelContent, setParcelContent] = useState(draft.parcelContent);
  const [parcelValue, setParcelValue] = useState(String(draft.parcelValuePsw / 100));
  const options = useParcelBranchOptions(companyId, destinationBranchId, true, false);
  // Same rule the server enforces: not the source branch and not head office.
  const branchOptions = useMemo(
    () =>
      options.branchOptions
        .filter((branch) => branch.id !== draft.branchId && branch.type !== BranchType.HEADOFFICE)
        .map((branch) => ({ value: branch.id, label: branch.name })),
    [draft.branchId, options.branchOptions],
  );
  const locationOptions = useMemo(
    () => options.locationOptions.map((location) => ({ value: location.id, label: location.name })),
    [options.locationOptions],
  );

  const errors = {
    sender: getSelfServiceContactError(contacts.sender),
    receiver: getSelfServiceContactError(contacts.receiver),
    parcel: getSelfServiceParcelError({ destinationBranchId, parcelContent, parcelValue }),
  };
  const valid = !errors.sender && !errors.receiver && !errors.parcel;

  const onContactChange = (role: Role, field: keyof SelfServiceContactForm, value: string) =>
    setContacts((current) => ({ ...current, [role]: { ...current[role], [field]: value } }));
  const onBranchChange = (value: string) => {
    if (value === destinationBranchId) return;
    setDestinationBranchId(value);
    setDestinationLocationId('');
  };

  const save = async () => {
    if (!valid) return;
    const saved = await onSave({
      id: draft.id,
      expectedUpdatedAt: draft.updatedAt,
      sender: toSelfServiceContactInput(contacts.sender),
      receiver: toSelfServiceContactInput(contacts.receiver),
      destinationBranchId,
      destinationLocationId: destinationLocationId || null,
      parcelContent: parcelContent.trim(),
      parcelValueCedis: parcelValue.replace(/,/g, '').trim(),
    });
    if (saved) onDone();
  };

  return {
    contacts,
    onContactChange,
    destination: {
      branchId: destinationBranchId,
      onBranchChange,
      branchOptions,
      isLoadingBranches: options.isLoadingBranches,
      locationId: destinationLocationId,
      onLocationChange: setDestinationLocationId,
      locationOptions,
      isLoadingLocations: options.isLoadingLocations,
    },
    parcel: {
      content: parcelContent,
      setContent: setParcelContent,
      value: parcelValue,
      setValue: setParcelValue,
    },
    errors,
    valid,
    save,
  };
}
