import { useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { DataTable } from '@/components/datatable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { Textarea } from '@/components/ui/textarea';
import { ParcelReconciliationActionType, ParcelReconciliationCaseType } from '@/db/schemas/enums';
import { formatDateTime } from '@/lib/date';
import ThrowErrorMessage from '@/lib/throw-error';
import type { PaginationMeta } from '@/server/types/pagination.types';
import type { ServerListQuery } from '@/services/rtk-query';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useAuthStore } from '@/stores/auth-store';
import {
  type ParcelSearchRow,
  type ParcelReconciliationCaseRow,
  useApproveParcelReconciliationCaseMutation,
  useExecuteParcelReconciliationCaseMutation,
  useLazySearchParcelsQuery,
  useListParcelReconciliationCasesQuery,
  useRequestParcelReconciliationCaseMutation,
} from '../api/parcel.api';
import { useUploadImageMutation } from '@/features/uploads/api/uploads.api';
import { FileUploadField } from '@/features/uploads/components/file-upload-field';

const EMPTY_META: PaginationMeta = {
  totalRecords: 0,
  totalPages: 1,
  page: 1,
  pageSize: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

const CASE_TYPE_OPTIONS = [
  { value: ParcelReconciliationCaseType.SHORTAGE, label: 'Shortage' },
  { value: ParcelReconciliationCaseType.OVERAGE, label: 'Overage' },
  { value: ParcelReconciliationCaseType.WRONG_AMOUNT, label: 'Wrong Amount' },
  { value: ParcelReconciliationCaseType.WRONG_PARCEL_TYPE, label: 'Wrong Parcel Type' },
  { value: ParcelReconciliationCaseType.DUPLICATE_ENTRY, label: 'Double Entry' },
  {
    value: ParcelReconciliationCaseType.CUSTOMER_CANCELLATION_BEFORE_DELIVERY,
    label: 'Customer Cancellation Before Delivery',
  },
  { value: ParcelReconciliationCaseType.DATA_ENTRY_ERROR, label: 'Data Entry Error' },
] as const;

const ACTION_OPTIONS = [
  { value: ParcelReconciliationActionType.VOID_AND_REFUND, label: 'Void and Refund' },
  { value: ParcelReconciliationActionType.VOID_AND_REBOOK, label: 'Void and Rebook' },
  { value: ParcelReconciliationActionType.VOID_TO_SUSPENSE, label: 'Void to Suspense' },
  {
    value: ParcelReconciliationActionType.KEEP_ORIGINAL_VOID_DUPLICATE,
    label: 'Keep Original, Void Duplicate',
  },
  { value: ParcelReconciliationActionType.MERGE_TO_SINGLE, label: 'Merge to Single Record' },
] as const;

const CASE_STATUS_LABEL: Record<number, string> = {
  0: 'Requested',
  1: 'Approved',
  2: 'Executed',
  3: 'Rejected',
};

function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return formatDateTime(date);
}

async function toDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Failed reading file: ${file.name}`));
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.readAsDataURL(file);
  });
}

export function ParcelReconciliationCasesPage() {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.company?.id ?? null;
  const branchId = user?.branch?.id ?? null;

  const canRequest = (user?.permissions ?? []).includes(
    PermissionKeys.CanRequestParcelReconciliation,
  );
  const canApprove = (user?.permissions ?? []).includes(
    PermissionKeys.CanApproveParcelReconciliation,
  );
  const canExecute = (user?.permissions ?? []).includes(
    PermissionKeys.CanExecuteParcelReconciliation,
  );

  const serverFilters = useMemo(
    () => ({ companyId: companyId ?? undefined, branchId: branchId ?? undefined }),
    [branchId, companyId],
  );

  const [query, setQuery] = useState<
    ServerListQuery<{
      companyId?: string | null;
      branchId?: string | null;
      statuses?: number[] | null;
    }>
  >({
    page: 1,
    pageSize: 20,
    filters: serverFilters,
  });

  const { data, isLoading, refetch } = useListParcelReconciliationCasesQuery(query, {
    skip: !companyId,
  });

  const [requestCase, { isLoading: isRequesting }] = useRequestParcelReconciliationCaseMutation();
  const [approveCase, { isLoading: isApproving }] = useApproveParcelReconciliationCaseMutation();
  const [executeCase, { isLoading: isExecuting }] = useExecuteParcelReconciliationCaseMutation();
  const [searchParcels, { isLoading: isSearchingParcels }] = useLazySearchParcelsQuery();
  const [uploadImage, { isLoading: isUploadingEvidence }] = useUploadImageMutation();

  const [createOpen, setCreateOpen] = useState(false);
  const [createBookingSearch, setCreateBookingSearch] = useState('');
  const [createLinkedBookingSearch, setCreateLinkedBookingSearch] = useState('');
  const [createParcelResults, setCreateParcelResults] = useState<ParcelSearchRow[]>([]);
  const [createLinkedParcelResults, setCreateLinkedParcelResults] = useState<ParcelSearchRow[]>([]);
  const [createSelectedParcelId, setCreateSelectedParcelId] = useState('');
  const [createSelectedLinkedParcelId, setCreateSelectedLinkedParcelId] = useState('');
  const [createCaseType, setCreateCaseType] = useState<number>(
    ParcelReconciliationCaseType.SHORTAGE,
  );
  const [createActionType, setCreateActionType] = useState<number>(
    ParcelReconciliationActionType.VOID_AND_REFUND,
  );
  const [createEvidenceUrl, setCreateEvidenceUrl] = useState('');
  const [createEvidenceFiles, setCreateEvidenceFiles] = useState<File[]>([]);
  const [createNotes, setCreateNotes] = useState('');

  const [approvingCase, setApprovingCase] = useState<ParcelReconciliationCaseRow | null>(null);
  const [approveActionType, setApproveActionType] = useState<number>(
    ParcelReconciliationActionType.VOID_AND_REFUND,
  );
  const [approveNote, setApproveNote] = useState('');

  const [executingCase, setExecutingCase] = useState<ParcelReconciliationCaseRow | null>(null);
  const [executeNote, setExecuteNote] = useState('');

  const columns = useMemo<ColumnDef<ParcelReconciliationCaseRow>[]>(
    () => [
      { accessorKey: 'trackingCode', header: 'Tracking' },
      { accessorKey: 'bookingCode', header: 'Booking' },
      {
        accessorKey: 'caseType',
        header: 'Case Type',
        cell: ({ row }) =>
          CASE_TYPE_OPTIONS.find((option) => option.value === row.original.caseType)?.label ??
          `Type ${row.original.caseType}`,
      },
      {
        accessorKey: 'actionType',
        header: 'Action',
        cell: ({ row }) =>
          row.original.actionType == null
            ? '-'
            : (ACTION_OPTIONS.find((option) => option.value === row.original.actionType)?.label ??
              `Action ${row.original.actionType}`),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) =>
          CASE_STATUS_LABEL[row.original.status] ?? `Unknown (${row.original.status})`,
      },
      {
        accessorKey: 'requestedByName',
        header: 'Requested By',
        cell: ({ row }) => row.original.requestedByName ?? row.original.requestedBy,
      },
      {
        accessorKey: 'requestedAt',
        header: 'Requested At',
        cell: ({ row }) => formatDate(row.original.requestedAt),
      },
      {
        id: 'actions',
        header: 'Action',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-wrap justify-end gap-2">
            {canApprove && row.original.status === 0 ? (
              <Button
                size="sm"
                onClick={() => {
                  setApprovingCase(row.original);
                  setApproveActionType(
                    row.original.caseType === ParcelReconciliationCaseType.DUPLICATE_ENTRY
                      ? ParcelReconciliationActionType.KEEP_ORIGINAL_VOID_DUPLICATE
                      : ParcelReconciliationActionType.VOID_AND_REFUND,
                  );
                  setApproveNote('');
                }}
              >
                Approve
              </Button>
            ) : null}
            {canExecute && row.original.status === 1 ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setExecutingCase(row.original);
                  setExecuteNote('');
                }}
              >
                Execute
              </Button>
            ) : null}
          </div>
        ),
      },
    ],
    [canApprove, canExecute],
  );

  const resetCreateForm = () => {
    setCreateBookingSearch('');
    setCreateLinkedBookingSearch('');
    setCreateParcelResults([]);
    setCreateLinkedParcelResults([]);
    setCreateSelectedParcelId('');
    setCreateSelectedLinkedParcelId('');
    setCreateCaseType(ParcelReconciliationCaseType.SHORTAGE);
    setCreateActionType(ParcelReconciliationActionType.VOID_AND_REFUND);
    setCreateEvidenceUrl('');
    setCreateEvidenceFiles([]);
    setCreateNotes('');
  };

  const selectedCreateParcel = useMemo(
    () => createParcelResults.find((parcel) => parcel.id === createSelectedParcelId) ?? null,
    [createParcelResults, createSelectedParcelId],
  );

  const selectedCreateLinkedParcel = useMemo(
    () =>
      createLinkedParcelResults.find((parcel) => parcel.id === createSelectedLinkedParcelId) ??
      null,
    [createLinkedParcelResults, createSelectedLinkedParcelId],
  );

  useEffect(() => {
    if (!createSelectedParcelId) return;
    setCreateLinkedParcelResults((prev) =>
      prev.filter((parcel) => parcel.id !== createSelectedParcelId),
    );
    setCreateSelectedLinkedParcelId((prev) => (prev === createSelectedParcelId ? '' : prev));
  }, [createSelectedParcelId]);

  function parcelSelectLabel(parcel: ParcelSearchRow) {
    const senderDisplay = [parcel.senderName, parcel.senderPhone ? `(${parcel.senderPhone})` : null]
      .filter(Boolean)
      .join(' ');
    return `${parcel.bookingCode}${senderDisplay ? ` • ${senderDisplay}` : ''}`;
  }

  const searchParcelsByBooking = async (bookingCode: string) => {
    const booking = bookingCode.trim();
    if (!booking) {
      toast.error('Enter a booking code to search');
      return [];
    }

    try {
      const response = await searchParcels({
        page: 1,
        pageSize: 50,
        search: booking,
        filters: {
          companyId,
          sourceId: branchId,
          includeDeleted: false,
        },
      }).unwrap();
      const matched = response.data.filter((parcel) =>
        parcel.bookingCode.toLowerCase().includes(booking.toLowerCase()),
      );
      if (!matched.length) {
        toast.error('No parcel found for that booking code');
      }
      return matched;
    } catch (error) {
      ThrowErrorMessage(error);
      return [];
    }
  };

  const handleSearchParcelByBooking = async () => {
    const matched = await searchParcelsByBooking(createBookingSearch);
    setCreateParcelResults(matched);
    const [onlyMatch] = matched;
    if (matched.length === 1 && onlyMatch) {
      setCreateSelectedParcelId(onlyMatch.id);
    } else if (!matched.some((parcel) => parcel.id === createSelectedParcelId)) {
      setCreateSelectedParcelId('');
    }
  };

  const handleSearchLinkedParcelByBooking = async () => {
    const matched = await searchParcelsByBooking(createLinkedBookingSearch);
    const filtered = matched.filter((parcel) => parcel.id !== createSelectedParcelId);
    setCreateLinkedParcelResults(filtered);
    const [onlyMatch] = filtered;
    if (filtered.length === 1 && onlyMatch) {
      setCreateSelectedLinkedParcelId(onlyMatch.id);
    } else if (!filtered.some((parcel) => parcel.id === createSelectedLinkedParcelId)) {
      setCreateSelectedLinkedParcelId('');
    }
  };

  const handleCreate = async () => {
    const parcelId = createSelectedParcelId.trim();
    const linkedParcelId = createSelectedLinkedParcelId.trim();
    const notes = createNotes.trim();

    if (!parcelId) {
      toast.error('Select a parcel from booking search results');
      return;
    }
    if (createCaseType === ParcelReconciliationCaseType.DUPLICATE_ENTRY && !linkedParcelId) {
      toast.error('Select the linked duplicate parcel from booking search results');
      return;
    }
    if (!notes) {
      toast.error('Case note is required');
      return;
    }

    try {
      let uploadedEvidenceUrl = createEvidenceUrl.trim() || null;
      if (createEvidenceFiles[0]) {
        if (!selectedCreateParcel) {
          toast.error('Select the parcel before uploading evidence');
          return;
        }
        const upload = await uploadImage({
          modelType: 'parcel-reconciliation-evidence',
          modelId: selectedCreateParcel.id,
          fileName: createEvidenceFiles[0].name,
          dataUrl: await toDataUrl(createEvidenceFiles[0]),
        }).unwrap();
        uploadedEvidenceUrl = upload.url;
      }

      await requestCase({
        parcelId,
        linkedParcelId:
          createCaseType === ParcelReconciliationCaseType.DUPLICATE_ENTRY ? linkedParcelId : null,
        caseType: createCaseType,
        actionType: createActionType,
        notes,
        evidenceUrl: uploadedEvidenceUrl,
      }).unwrap();
      toast.success('Reconciliation case created');
      setCreateOpen(false);
      resetCreateForm();
      await refetch();
    } catch (error) {
      ThrowErrorMessage(error);
    }
  };

  const handleApprove = async () => {
    if (!approvingCase) return;
    try {
      await approveCase({
        id: approvingCase.id,
        actionType: approveActionType,
        resolutionNote: approveNote.trim() || null,
      }).unwrap();
      toast.success('Reconciliation case approved');
      setApprovingCase(null);
      await refetch();
    } catch (error) {
      ThrowErrorMessage(error);
    }
  };

  const handleExecute = async () => {
    if (!executingCase) return;
    try {
      await executeCase({
        id: executingCase.id,
        executionNote: executeNote.trim() || null,
      }).unwrap();
      toast.success('Reconciliation case executed');
      setExecutingCase(null);
      await refetch();
    } catch (error) {
      ThrowErrorMessage(error);
    }
  };

  return (
    <div className="w-full space-y-4 p-4">
      <ScrollableWrapper>
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Parcel Reconciliation Cases</CardTitle>
                <CardDescription>
                  Controlled workflow for shortages, overs, wrong entries, and duplicate parcel
                  records.
                </CardDescription>
              </div>
              {canRequest ? (
                <Button
                  onClick={() => {
                    setCreateOpen(true);
                    resetCreateForm();
                  }}
                >
                  New Case
                </Button>
              ) : null}
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              mode="server"
              data={data?.data ?? []}
              columns={columns}
              meta={data?.meta ?? EMPTY_META}
              loading={isLoading}
              serverFilters={serverFilters}
              onRequestChange={setQuery}
              searchPlaceholder="Search by tracking, booking, case type"
              enableVirtualization={false}
            />
          </CardContent>
        </Card>
      </ScrollableWrapper>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Reconciliation Case</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="create-case-booking-search">Booking Code Search</Label>
              <div className="flex gap-2">
                <Input
                  id="create-case-booking-search"
                  value={createBookingSearch}
                  onChange={(event) => setCreateBookingSearch(event.target.value)}
                  placeholder="Enter booking code"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSearchParcelByBooking}
                  disabled={isSearchingParcels}
                >
                  {isSearchingParcels ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-case-parcel-select">Select Parcel</Label>
              <Select value={createSelectedParcelId} onValueChange={setCreateSelectedParcelId}>
                <SelectTrigger id="create-case-parcel-select">
                  <SelectValue placeholder="Choose booking/sender from search results" />
                </SelectTrigger>
                <SelectContent>
                  {createParcelResults.map((parcel) => (
                    <SelectItem key={parcel.id} value={parcel.id}>
                      {parcelSelectLabel(parcel)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCreateParcel ? (
                <p className="text-xs text-muted-foreground">
                  Selected: {parcelSelectLabel(selectedCreateParcel)}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-case-type">Case Type</Label>
              <Select
                value={String(createCaseType)}
                onValueChange={(value) => {
                  const nextCaseType = Number(value);
                  setCreateCaseType(nextCaseType);
                  if (nextCaseType === ParcelReconciliationCaseType.DUPLICATE_ENTRY) {
                    setCreateActionType(
                      ParcelReconciliationActionType.KEEP_ORIGINAL_VOID_DUPLICATE,
                    );
                  } else if (
                    createActionType ===
                      ParcelReconciliationActionType.KEEP_ORIGINAL_VOID_DUPLICATE ||
                    createActionType === ParcelReconciliationActionType.MERGE_TO_SINGLE
                  ) {
                    setCreateActionType(ParcelReconciliationActionType.VOID_AND_REFUND);
                  }
                  if (nextCaseType !== ParcelReconciliationCaseType.DUPLICATE_ENTRY) {
                    setCreateLinkedBookingSearch('');
                    setCreateLinkedParcelResults([]);
                    setCreateSelectedLinkedParcelId('');
                  }
                }}
              >
                <SelectTrigger id="create-case-type">
                  <SelectValue placeholder="Select case type" />
                </SelectTrigger>
                <SelectContent>
                  {CASE_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-case-action">Proposed Action</Label>
              <Select
                value={String(createActionType)}
                onValueChange={(value) => setCreateActionType(Number(value))}
              >
                <SelectTrigger id="create-case-action">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_OPTIONS.filter((option) =>
                    createCaseType === ParcelReconciliationCaseType.DUPLICATE_ENTRY
                      ? option.value ===
                          ParcelReconciliationActionType.KEEP_ORIGINAL_VOID_DUPLICATE ||
                        option.value === ParcelReconciliationActionType.MERGE_TO_SINGLE
                      : option.value !==
                          ParcelReconciliationActionType.KEEP_ORIGINAL_VOID_DUPLICATE &&
                        option.value !== ParcelReconciliationActionType.MERGE_TO_SINGLE,
                  ).map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {createCaseType === ParcelReconciliationCaseType.DUPLICATE_ENTRY ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="create-case-linked-booking-search">
                    Linked Duplicate Booking Code Search
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="create-case-linked-booking-search"
                      value={createLinkedBookingSearch}
                      onChange={(event) => setCreateLinkedBookingSearch(event.target.value)}
                      placeholder="Enter duplicate booking code"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSearchLinkedParcelByBooking}
                      disabled={isSearchingParcels}
                    >
                      {isSearchingParcels ? 'Searching...' : 'Search'}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-case-linked-parcel-select">Select Linked Parcel</Label>
                  <Select
                    value={createSelectedLinkedParcelId}
                    onValueChange={setCreateSelectedLinkedParcelId}
                  >
                    <SelectTrigger id="create-case-linked-parcel-select">
                      <SelectValue placeholder="Choose duplicate booking/sender from results" />
                    </SelectTrigger>
                    <SelectContent>
                      {createLinkedParcelResults.map((parcel) => (
                        <SelectItem key={parcel.id} value={parcel.id}>
                          {parcelSelectLabel(parcel)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCreateLinkedParcel ? (
                    <p className="text-xs text-muted-foreground">
                      Linked: {parcelSelectLabel(selectedCreateLinkedParcel)}
                    </p>
                  ) : null}
                </div>
              </>
            ) : null}
            <div className="space-y-2">
              <FileUploadField
                id="create-case-evidence-file"
                label="Evidence (optional)"
                files={createEvidenceFiles}
                onFilesChange={(files) => setCreateEvidenceFiles(files.slice(0, 1))}
                accept="image/*,.pdf,.doc,.docx"
                maxFiles={1}
                disabled={isUploadingEvidence}
                title="Drag and drop evidence file, or click to choose"
                helperText="Uploads one file and stores the resulting evidence URL."
              />
              <Input
                id="create-case-evidence"
                value={createEvidenceUrl}
                onChange={(event) => setCreateEvidenceUrl(event.target.value)}
                placeholder="Or paste existing evidence URL"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-case-note">Reason</Label>
              <Textarea
                id="create-case-note"
                rows={4}
                value={createNotes}
                onChange={(event) => setCreateNotes(event.target.value)}
                placeholder="Explain the case"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isRequesting || isUploadingEvidence}>
              {isRequesting || isUploadingEvidence ? 'Submitting...' : 'Submit Case'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(approvingCase)}
        onOpenChange={(open) => {
          if (!open) setApprovingCase(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Reconciliation Case</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Tracking: <strong>{approvingCase?.trackingCode ?? '-'}</strong>
            </p>
            <div className="space-y-2">
              <Label htmlFor="approve-action-type">Action</Label>
              <Select
                value={String(approveActionType)}
                onValueChange={(value) => setApproveActionType(Number(value))}
              >
                <SelectTrigger id="approve-action-type">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_OPTIONS.filter((option) =>
                    approvingCase?.caseType === ParcelReconciliationCaseType.DUPLICATE_ENTRY
                      ? option.value ===
                          ParcelReconciliationActionType.KEEP_ORIGINAL_VOID_DUPLICATE ||
                        option.value === ParcelReconciliationActionType.MERGE_TO_SINGLE
                      : option.value !==
                          ParcelReconciliationActionType.KEEP_ORIGINAL_VOID_DUPLICATE &&
                        option.value !== ParcelReconciliationActionType.MERGE_TO_SINGLE,
                  ).map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="approve-note">Approval Note (optional)</Label>
              <Textarea
                id="approve-note"
                rows={3}
                value={approveNote}
                onChange={(event) => setApproveNote(event.target.value)}
                placeholder="Optional approval note"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovingCase(null)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isApproving}>
              {isApproving ? 'Approving...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(executingCase)}
        onOpenChange={(open) => {
          if (!open) setExecutingCase(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Execute Reconciliation Case</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              This action will void active payments and cancel/archive affected parcel records.
            </p>
            <p className="text-sm text-muted-foreground">
              Tracking: <strong>{executingCase?.trackingCode ?? '-'}</strong>
            </p>
            <div className="space-y-2">
              <Label htmlFor="execute-note">Execution Note (optional)</Label>
              <Textarea
                id="execute-note"
                rows={3}
                value={executeNote}
                onChange={(event) => setExecuteNote(event.target.value)}
                placeholder="Optional execution note"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setExecutingCase(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleExecute} disabled={isExecuting}>
              {isExecuting ? 'Executing...' : 'Execute'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
