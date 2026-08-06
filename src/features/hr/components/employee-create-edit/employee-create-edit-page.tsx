import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { EmploymentStatus, EmploymentType } from '@/db/schemas/enums';
import { useListBranchOptionsQuery } from '@/features/branches';
import { useListLocationOptionsQuery } from '@/features/locations';
import { ImageUploadField } from '@/features/uploads/components/image-upload-field';
import { useUploadImageMutation } from '@/features/uploads/api/uploads.api';
import {
  PHONE_DIGITS,
  isTenDigitPhone,
  limitPhoneDigits,
  normalizePhoneDigits,
  phoneLengthMessage,
} from '@/lib/phone';
import {
  useCreateEmployeeMutation,
  useGetEmployeeQuery,
  useListDepartmentOptionsQuery,
  useListEmployeeOptionsQuery,
  useListJobTitleOptionsQuery,
  useUpdateEmployeeMutation,
} from '../../api/hr.api';

const employmentStatusOptions = [
  { value: EmploymentStatus.ACTIVE, label: 'Active' },
  { value: EmploymentStatus.PROBATION, label: 'Probation' },
  { value: EmploymentStatus.SUSPENDED, label: 'Suspended' },
  { value: EmploymentStatus.RESIGNED, label: 'Resigned' },
  { value: EmploymentStatus.TERMINATED, label: 'Terminated' },
  { value: EmploymentStatus.INACTIVE, label: 'Inactive' },
];

const employmentTypeOptions = [
  { value: EmploymentType.FULL_TIME, label: 'Full-time' },
  { value: EmploymentType.PART_TIME, label: 'Part-time' },
  { value: EmploymentType.CONTRACT, label: 'Contract' },
  { value: EmploymentType.INTERN, label: 'Intern' },
  { value: EmploymentType.CASUAL, label: 'Casual' },
];

const paymentMethodOptions = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank' },
  { value: 'mobile_money', label: 'Mobile Money' },
];

type EmployeeFormState = {
  employeeNumber: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  profileImageUrl: string;
  telephone: string;
  paymentMethod: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  mobileMoneyNumber: string;
  branchId: string;
  locationId: string;
  departmentId: string;
  jobTitleId: string;
  supervisorEmployeeId: string;
  employmentStatus: string;
  employmentType: string;
  confirmationDate: string;
  terminationDate: string;
  terminationReason: string;
};

const EMPTY_FORM: EmployeeFormState = {
  employeeNumber: '',
  firstName: '',
  middleName: '',
  lastName: '',
  email: '',
  profileImageUrl: '',
  telephone: '',
  paymentMethod: '',
  bankName: '',
  bankAccountName: '',
  bankAccountNumber: '',
  mobileMoneyNumber: '',
  branchId: '',
  locationId: '',
  departmentId: '',
  jobTitleId: '',
  supervisorEmployeeId: '',
  employmentStatus: String(EmploymentStatus.ACTIVE),
  employmentType: String(EmploymentType.FULL_TIME),
  confirmationDate: '',
  terminationDate: '',
  terminationReason: '',
};

function dateInputValue(value?: string | null) {
  return value ? value.slice(0, 10) : '';
}

function parseDateInputValue(value?: string | null) {
  if (!value) return undefined;
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function toDateInputValue(date?: Date) {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function EmployeeCreateEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [form, setForm] = useState<EmployeeFormState>(EMPTY_FORM);

  const { data: employee, isLoading: isLoadingEmployee } = useGetEmployeeQuery(id ?? '', {
    skip: !id,
  });

  const { data: departmentOptions = [] } = useListDepartmentOptionsQuery();
  const { data: jobTitleOptions = [] } = useListJobTitleOptionsQuery();
  const { data: employeeOptions = [] } = useListEmployeeOptionsQuery();
  const supervisorOptions = isEditing
    ? employeeOptions.filter((option) => option.id !== id)
    : employeeOptions;
  const { data: branchOptions = [] } = useListBranchOptionsQuery();
  const { data: locationOptions = [] } = useListLocationOptionsQuery(
    { branchId: form.branchId || undefined },
    { skip: !form.branchId },
  );

  const [createEmployee, { isLoading: isCreating }] = useCreateEmployeeMutation();
  const [updateEmployee, { isLoading: isUpdating }] = useUpdateEmployeeMutation();
  const [uploadImage, { isLoading: isUploadingImage }] = useUploadImageMutation();

  useEffect(() => {
    if (!employee) return;
    setForm({
      employeeNumber: employee.employeeNumber ?? '',
      firstName: employee.firstName ?? '',
      middleName: employee.middleName ?? '',
      lastName: employee.lastName ?? '',
      email: employee.email ?? '',
      profileImageUrl: employee.profileImageUrl ?? '',
      telephone: employee.telephone ?? '',
      paymentMethod: employee.paymentMethod ?? '',
      bankName: employee.bankName ?? '',
      bankAccountName: employee.bankAccountName ?? '',
      bankAccountNumber: employee.bankAccountNumber ?? '',
      mobileMoneyNumber: employee.mobileMoneyNumber ?? '',
      branchId: employee.branchId ?? '',
      locationId: employee.locationId ?? '',
      departmentId: employee.departmentId ?? '',
      jobTitleId: employee.jobTitleId ?? '',
      supervisorEmployeeId: employee.supervisorEmployeeId ?? '',
      employmentStatus: String(employee.employmentStatus ?? EmploymentStatus.ACTIVE),
      employmentType: String(employee.employmentType ?? EmploymentType.FULL_TIME),
      confirmationDate: dateInputValue(employee.confirmationDate),
      terminationDate: dateInputValue(employee.terminationDate),
      terminationReason: employee.terminationReason ?? '',
    });
  }, [employee]);

  async function resolveEmployeeProfileImage(nextEmployeeId: string, value?: string | null) {
    if (!value) return null;
    if (!value.startsWith('data:')) return value;

    const upload = await uploadImage({
      modelType: 'employee-profile-image',
      modelId: nextEmployeeId,
      dataUrl: value,
      fileName: `${nextEmployeeId}-profile-image.png`,
    }).unwrap();

    return upload.url;
  }

  const isBusy = isCreating || isUpdating || isUploadingImage || (isEditing && isLoadingEmployee);

  const hasBankValidationError =
    form.paymentMethod === 'bank' &&
    (!form.bankName.trim() || !form.bankAccountName.trim() || !form.bankAccountNumber.trim());

  const hasMobileMoneyValidationError =
    form.paymentMethod === 'mobile_money' && !form.mobileMoneyNumber.trim();

  const cannotSubmit =
    (!isEditing && !form.employeeNumber.trim()) ||
    !form.firstName.trim() ||
    !form.lastName.trim() ||
    !isTenDigitPhone(form.telephone) ||
    hasBankValidationError ||
    hasMobileMoneyValidationError ||
    isBusy;

  return (
    <div className="w-full space-y-4 p-4">
      <ScrollableWrapper>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>{isEditing ? 'Edit employee' : 'Add employee'}</CardTitle>
              <Button variant="outline" asChild>
                <Link to="/hr/employees">Back to list</Link>
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {isEditing && !employee && isLoadingEmployee ? (
              <p className="text-sm text-muted-foreground">Loading employee...</p>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FieldGroup>
                    <ImageUploadField
                      id="employee-profile-image"
                      label="Profile image"
                      value={form.profileImageUrl || null}
                      onChange={(value) =>
                        setForm((current) => ({ ...current, profileImageUrl: value ?? '' }))
                      }
                      helperText="Optional employee profile photo."
                      disabled={isBusy}
                    />

                    <Field>
                      <FieldLabel>Employee number</FieldLabel>
                      <Input
                        value={form.employeeNumber}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, employeeNumber: event.target.value }))
                        }
                        disabled={isEditing}
                      />
                    </Field>

                    <Field>
                      <FieldLabel>First name</FieldLabel>
                      <Input
                        value={form.firstName}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, firstName: event.target.value }))
                        }
                      />
                    </Field>

                    <Field>
                      <FieldLabel>Middle name</FieldLabel>
                      <Input
                        value={form.middleName}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, middleName: event.target.value }))
                        }
                      />
                    </Field>

                    <Field>
                      <FieldLabel>Last name</FieldLabel>
                      <Input
                        value={form.lastName}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, lastName: event.target.value }))
                        }
                      />
                    </Field>

                    <Field>
                      <FieldLabel>Email</FieldLabel>
                      <Input
                        value={form.email}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, email: event.target.value }))
                        }
                      />
                    </Field>

                    <Field>
                      <FieldLabel>Telephone</FieldLabel>
                      <Input
                        value={form.telephone}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            telephone: limitPhoneDigits(event.target.value),
                          }))
                        }
                        inputMode="numeric"
                        autoComplete="tel"
                        maxLength={PHONE_DIGITS}
                        placeholder="0240000000"
                      />
                    </Field>
                  </FieldGroup>

                  <FieldGroup>
                    <Field>
                      <FieldLabel>Payment method</FieldLabel>
                      <Select
                        value={form.paymentMethod}
                        onValueChange={(value) =>
                          setForm((current) => ({ ...current, paymentMethod: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethodOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field>
                      <FieldLabel>Bank name</FieldLabel>
                      <Input
                        value={form.bankName}
                        disabled={form.paymentMethod !== 'bank'}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, bankName: event.target.value }))
                        }
                      />
                    </Field>

                    <Field>
                      <FieldLabel>Account name</FieldLabel>
                      <Input
                        value={form.bankAccountName}
                        disabled={form.paymentMethod !== 'bank'}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            bankAccountName: event.target.value,
                          }))
                        }
                      />
                    </Field>

                    <Field>
                      <FieldLabel>Account number</FieldLabel>
                      <Input
                        value={form.bankAccountNumber}
                        disabled={form.paymentMethod !== 'bank'}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            bankAccountNumber: event.target.value,
                          }))
                        }
                      />
                    </Field>

                    <Field>
                      <FieldLabel>Mobile money number</FieldLabel>
                      <Input
                        value={form.mobileMoneyNumber}
                        disabled={form.paymentMethod !== 'mobile_money'}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            mobileMoneyNumber: event.target.value,
                          }))
                        }
                      />
                    </Field>

                    <Field>
                      <FieldLabel>Branch</FieldLabel>
                      <Select
                        value={form.branchId}
                        onValueChange={(value) =>
                          setForm((current) => ({ ...current, branchId: value, locationId: '' }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Branch" />
                        </SelectTrigger>
                        <SelectContent>
                          {branchOptions.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field>
                      <FieldLabel>Location</FieldLabel>
                      <Select
                        value={form.locationId}
                        onValueChange={(value) =>
                          setForm((current) => ({ ...current, locationId: value }))
                        }
                      >
                        <SelectTrigger disabled={!form.branchId}>
                          <SelectValue placeholder="Location" />
                        </SelectTrigger>
                        <SelectContent>
                          {locationOptions.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field>
                      <FieldLabel>Department</FieldLabel>
                      <Select
                        value={form.departmentId}
                        onValueChange={(value) =>
                          setForm((current) => ({ ...current, departmentId: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departmentOptions.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field>
                      <FieldLabel>Job title</FieldLabel>
                      <Select
                        value={form.jobTitleId}
                        onValueChange={(value) =>
                          setForm((current) => ({ ...current, jobTitleId: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Job title" />
                        </SelectTrigger>
                        <SelectContent>
                          {jobTitleOptions.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field>
                      <FieldLabel>Reporting manager</FieldLabel>
                      <Select
                        value={form.supervisorEmployeeId || '__none__'}
                        onValueChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            supervisorEmployeeId: value === '__none__' ? '' : value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select reporting manager" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">No reporting manager</SelectItem>
                          {supervisorOptions.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.displayName} ({option.employeeNumber})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field>
                      <FieldLabel>Status</FieldLabel>
                      <Select
                        value={form.employmentStatus}
                        onValueChange={(value) =>
                          setForm((current) => ({ ...current, employmentStatus: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          {employmentStatusOptions.map((option) => (
                            <SelectItem key={option.value} value={String(option.value)}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field>
                      <FieldLabel>Employment type</FieldLabel>
                      <Select
                        value={form.employmentType}
                        onValueChange={(value) =>
                          setForm((current) => ({ ...current, employmentType: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Employment type" />
                        </SelectTrigger>
                        <SelectContent>
                          {employmentTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={String(option.value)}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field>
                      <FieldLabel>Confirmation date</FieldLabel>
                      <DatePicker
                        date={parseDateInputValue(form.confirmationDate)}
                        onDateChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            confirmationDate: toDateInputValue(value),
                          }))
                        }
                        placeholder="Select confirmation date"
                      />
                    </Field>

                    <Field>
                      <FieldLabel>Termination date</FieldLabel>
                      <DatePicker
                        date={parseDateInputValue(form.terminationDate)}
                        onDateChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            terminationDate: toDateInputValue(value),
                          }))
                        }
                        placeholder="Select termination date"
                      />
                    </Field>

                    <Field>
                      <FieldLabel>Termination reason</FieldLabel>
                      <Input
                        value={form.terminationReason}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            terminationReason: event.target.value,
                          }))
                        }
                      />
                    </Field>
                  </FieldGroup>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => navigate('/hr/employees')}>
                    Cancel
                  </Button>
                  <Button
                    disabled={cannotSubmit}
                    onClick={async () => {
                      try {
                        const telephone = normalizePhoneDigits(form.telephone);
                        if (!isTenDigitPhone(telephone)) {
                          toast.error(phoneLengthMessage());
                          return;
                        }

                        if (isEditing && id) {
                          const uploadedProfileImageUrl = await resolveEmployeeProfileImage(
                            id,
                            form.profileImageUrl || null,
                          );

                          await updateEmployee({
                            id,
                            body: {
                              firstName: form.firstName.trim(),
                              middleName: form.middleName.trim() || null,
                              lastName: form.lastName.trim(),
                              email: form.email.trim() || null,
                              profileImageUrl: uploadedProfileImageUrl,
                              telephone,
                              paymentMethod: form.paymentMethod.trim() || null,
                              bankName: form.bankName.trim() || null,
                              bankAccountName: form.bankAccountName.trim() || null,
                              bankAccountNumber: form.bankAccountNumber.trim() || null,
                              mobileMoneyNumber: form.mobileMoneyNumber.trim() || null,
                              branchId: form.branchId || null,
                              locationId: form.locationId || null,
                              departmentId: form.departmentId || null,
                              jobTitleId: form.jobTitleId || null,
                              supervisorEmployeeId: form.supervisorEmployeeId || null,
                              employmentStatus: Number(form.employmentStatus),
                              employmentType: Number(form.employmentType),
                              confirmationDate: form.confirmationDate || null,
                              terminationDate: form.terminationDate || null,
                              terminationReason: form.terminationReason.trim() || null,
                            },
                          }).unwrap();

                          toast.success('Employee updated');
                          navigate('/hr/employees');
                          return;
                        }

                        const created = await createEmployee({
                          employeeNumber: form.employeeNumber.trim(),
                          firstName: form.firstName.trim(),
                          middleName: form.middleName.trim() || null,
                          lastName: form.lastName.trim(),
                          email: form.email.trim() || null,
                          telephone,
                          paymentMethod: form.paymentMethod.trim() || null,
                          bankName: form.bankName.trim() || null,
                          bankAccountName: form.bankAccountName.trim() || null,
                          bankAccountNumber: form.bankAccountNumber.trim() || null,
                          mobileMoneyNumber: form.mobileMoneyNumber.trim() || null,
                          branchId: form.branchId || null,
                          locationId: form.locationId || null,
                          departmentId: form.departmentId || null,
                          jobTitleId: form.jobTitleId || null,
                          supervisorEmployeeId: form.supervisorEmployeeId || null,
                          employmentStatus: Number(form.employmentStatus),
                          employmentType: Number(form.employmentType),
                          hireDate: new Date().toISOString().slice(0, 10),
                        }).unwrap();

                        if (created.id && form.profileImageUrl) {
                          const uploadedProfileImageUrl = await resolveEmployeeProfileImage(
                            created.id,
                            form.profileImageUrl,
                          );

                          await updateEmployee({
                            id: created.id,
                            body: { profileImageUrl: uploadedProfileImageUrl },
                          }).unwrap();
                        }

                        toast.success('Employee created');
                        navigate('/hr/employees');
                      } catch (error) {
                        toast.error(
                          error instanceof Error
                            ? error.message
                            : isEditing
                              ? 'Failed to update employee'
                              : 'Failed to create employee',
                        );
                      }
                    }}
                  >
                    {isEditing ? 'Save changes' : 'Create employee'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </ScrollableWrapper>
    </div>
  );
}
