import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { shelfPickupReassignmentLink } from '../parcel-shelf-pickup-reassignment';
import { toast } from 'sonner';
import { getErrorMessage, getResponseError } from '@/lib/TheAduseiErrorResponse';
import { useAuthStore } from '@/stores/auth-store';
import { isOptionalTenDigitPhone, normalizePhoneDigits, phoneLengthMessage } from '@/lib/phone';
import { buildParcelInformationEdit } from '@/shared/shipments/parcel-information-edit';
import { useEditParcelInformationMutation } from '../../services';
import { ParcelStatus } from '@/db/schemas/enums';
import { PermissionKeys } from '@/shared/permissions/constants';
import type { PaginationMeta } from '@/server/types/pagination.types';
import type { ParcelRow } from './shelf-picker-update-types';
import { useListShelfPickerStaffQuery } from './services';

type ParcelListResponse = { data: ParcelRow[]; meta: PaginationMeta };

type TableQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
};

export function useShelfPickerUpdateWorkflow() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const [query, setQuery] = useState<TableQuery>({ page: 1, pageSize: 20 });
  const [searchInput, setSearchInput] = useState('');
  const [selectedParcel, setSelectedParcel] = useState<ParcelRow | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isRequestingDelivery, setIsRequestingDelivery] = useState(false);

  const companyId = user?.company?.id || '';
  const branchId = user?.branch?.id || '';
  const userId = user?.id || '';
  const canRequestDelivery = (user?.permissions ?? []).includes(
    PermissionKeys.CanUpdateParcelShelfPicker,
  );
  const [listData, setListData] = useState<ParcelListResponse>({
    data: [],
    meta: {
      totalRecords: 0,
      totalPages: 0,
      page: 1,
      pageSize: 20,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  });
  const { currentData: staffOptions = [] } = useListShelfPickerStaffQuery(
    { companyId, branchId, userId },
    { skip: !companyId || !branchId || !userId || !accessToken },
  );
  const [isLoading, setIsLoading] = useState(false);
  const [editingParcel, setEditingParcel] = useState<ParcelRow | null>(null);
  const [editParcelDetails, setEditParcelDetails] = useState('');
  const [editReceiverName, setEditReceiverName] = useState('');
  const [editReceiverPhone, setEditReceiverPhone] = useState('');
  const [editInformation, { isLoading: isUpdatingInformation }] =
    useEditParcelInformationMutation();
  const fetchData = useCallback(async () => {
    if (!companyId || !branchId || !accessToken) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(query.page ?? 1),
        pageSize: String(query.pageSize ?? 20),
        ...(query.search && { search: query.search }),
      });
      const parcelsRes = await fetch(`/v1/shipments/parcels/shelf-picker?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!parcelsRes.ok) {
        throw await getResponseError(parcelsRes, 'Failed to fetch shelf picker parcels');
      }
      setListData(await parcelsRes.json());
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to fetch shelf picker data'));
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, branchId, companyId, query.page, query.pageSize, query.search]);
  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const listQuery = { data: listData, isLoading, isFetching: isLoading, refetch: fetchData };

  const handleSearchSubmit = () => {
    const search = searchInput.trim();
    if ((query.page ?? 1) === 1 && (query.search ?? '') === search) {
      void fetchData();
      return;
    }
    setQuery((prev) => ({ ...prev, page: 1, search }));
  };

  const handleRequestDelivery = async (parcel: ParcelRow) => {
    if (parcel.status !== ParcelStatus.AWAITING_PICKUP || isRequestingDelivery) return;
    setIsRequestingDelivery(true);
    try {
      const response = await fetch(
        `/v1/shipments/parcels/${parcel.id}/shelf-picker/request-delivery`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      if (!response.ok) {
        throw await getResponseError(response, 'Failed to request home delivery');
      }
      toast.success('Parcel moved to Home Delivery Requested');
      await fetchData();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to request home delivery'));
    } finally {
      setIsRequestingDelivery(false);
    }
  };

  const handleUpdateShelfPicker = async () => {
    if (!selectedParcel || !selectedStaffId || isSaving) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/v1/shipments/parcels/${selectedParcel.id}/update-shelf-picker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          userId: selectedStaffId,
          expectedPickerStaffId: selectedParcel.pickerStaffId,
        }),
      });

      if (!res.ok) {
        throw await getResponseError(res, 'Failed to update shelf picker');
      }

      setSelectedParcel(null);
      setSelectedStaffId('');
      await fetchData();
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEdit = useCallback(async () => {
    if (!editingParcel) return;

    const nextParcelDetails = editParcelDetails.trim();
    const nextReceiverName = editReceiverName.trim();
    const nextReceiverPhone = normalizePhoneDigits(editReceiverPhone);

    if (nextParcelDetails.length === 0) {
      toast.error('Parcel details is required');
      return;
    }
    if (nextReceiverName.length === 0) {
      toast.error('Receiver name is required');
      return;
    }
    if (!isOptionalTenDigitPhone(nextReceiverPhone)) {
      toast.error(phoneLengthMessage('Receiver telephone'));
      return;
    }

    const patch = buildParcelInformationEdit(editingParcel, {
      parcelDetails: nextParcelDetails,
      receiverName: nextReceiverName,
      receiverPhone: nextReceiverPhone,
    });
    if (!patch) {
      toast.message('No changes to save');
      setEditingParcel(null);
      return;
    }
    await editInformation(patch).unwrap();
    toast.success('Parcel updated');
    setEditingParcel(null);
    await fetchData();
  }, [
    editParcelDetails,
    editReceiverName,
    editReceiverPhone,
    editingParcel,
    fetchData,
    editInformation,
  ]);

  return {
    context: {
      companyId,
      branchId,
      userId,
    },
    table: {
      query,
      setQuery,
      searchInput,
      setSearchInput,
      rows: listData.data,
      listQuery,
      openUpdateDialog: (parcel: ParcelRow) => {
        if (!canRequestDelivery) return;
        if (parcel.pickerStaffId) {
          navigate(shelfPickupReassignmentLink(parcel.bookingCode));
          return;
        }
        setSelectedParcel(parcel);
        setSelectedStaffId(parcel.pickerStaffId || '');
      },
      openEditDialog: (parcel: ParcelRow) => {
        setEditingParcel(parcel);
        setEditParcelDetails(parcel.parcelDetails ?? '');
        setEditReceiverName(parcel.receiverName ?? '');
        setEditReceiverPhone(parcel.receiverPhone ?? '');
      },
      handleSearchSubmit,
      handleRequestDelivery,
      isRequestingDelivery,
      canRequestDelivery,
    },
    dialog: {
      selectedParcel,
      setSelectedParcel,
      selectedStaffId,
      setSelectedStaffId,
      staffOptions,
      isSaving,
      handleUpdateShelfPicker,
    },
    edit: {
      editingParcel,
      setEditingParcel,
      editParcelDetails,
      setEditParcelDetails,
      editReceiverName,
      setEditReceiverName,
      editReceiverPhone,
      setEditReceiverPhone,
      isSaving: isUpdatingInformation,
      handleSaveEdit,
    },
  };
}
