import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useListBranchOptionsQuery } from '@/features/branches';
import { useListLocationOptionsQuery } from '@/features/locations';
import { useListRoleOptionsQuery } from '@/features/rbac';
import { EmploymentStatus, EmploymentType } from '@/db/schemas/enums';
import {
  useCreateEmployeeMutation,
  useCreateEmployeeUserAccountMutation,
  useListDepartmentOptionsQuery,
  useListEmployeesQuery,
  useListJobTitleOptionsQuery,
  useUpdateEmployeeMutation,
  type Employee,
} from '../api/hr.api';

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

function dateInputValue(value?: string | null) {
  return value ? value.slice(0, 10) : '';
}

export function EmployeesPage() {
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [branchId, setBranchId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [jobTitleId, setJobTitleId] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [linkEmployee, setLinkEmployee] = useState<Employee | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
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
    employmentStatus: String(EmploymentStatus.ACTIVE),
    employmentType: String(EmploymentType.FULL_TIME),
    confirmationDate: '',
    terminationDate: '',
    terminationReason: '',
  });
  const [userRoleId, setUserRoleId] = useState('');
  const [userBranchId, setUserBranchId] = useState('');
  const [userLocationId, setUserLocationId] = useState('');

  const { data, isLoading } = useListEmployeesQuery({ pageSize: 100 });
  const { data: departmentOptions = [] } = useListDepartmentOptionsQuery();
  const { data: jobTitleOptions = [] } = useListJobTitleOptionsQuery();
  const { data: branchOptions = [] } = useListBranchOptionsQuery();
  const { data: locationOptions = [] } = useListLocationOptionsQuery(
    { branchId: branchId || undefined },
    { skip: !branchId },
  );
  const { data: userLocationOptions = [] } = useListLocationOptionsQuery(
    { branchId: userBranchId || undefined },
    { skip: !userBranchId },
  );
  const { data: roleOptions = [] } = useListRoleOptionsQuery();

  const [createEmployee, { isLoading: isCreating }] = useCreateEmployeeMutation();
  const [updateEmployee, { isLoading: isUpdating }] = useUpdateEmployeeMutation();
  const [createEmployeeUserAccount, { isLoading: isLinking }] =
    useCreateEmployeeUserAccountMutation();

  const rows = data?.data ?? [];

  useEffect(() => {
    if (!selectedEmployee) return;
    setEditForm({
      firstName: selectedEmployee.firstName ?? '',
      middleName: selectedEmployee.middleName ?? '',
      lastName: selectedEmployee.lastName ?? '',
      email: selectedEmployee.email ?? '',
      telephone: selectedEmployee.telephone ?? '',
      paymentMethod: selectedEmployee.paymentMethod ?? '',
      bankName: selectedEmployee.bankName ?? '',
      bankAccountName: selectedEmployee.bankAccountName ?? '',
      bankAccountNumber: selectedEmployee.bankAccountNumber ?? '',
      mobileMoneyNumber: selectedEmployee.mobileMoneyNumber ?? '',
      branchId: selectedEmployee.branchId ?? '',
      locationId: selectedEmployee.locationId ?? '',
      departmentId: selectedEmployee.departmentId ?? '',
      jobTitleId: selectedEmployee.jobTitleId ?? '',
      employmentStatus: String(selectedEmployee.employmentStatus ?? EmploymentStatus.ACTIVE),
      employmentType: String(selectedEmployee.employmentType ?? EmploymentType.FULL_TIME),
      confirmationDate: dateInputValue(selectedEmployee.confirmationDate),
      terminationDate: dateInputValue(selectedEmployee.terminationDate),
      terminationReason: selectedEmployee.terminationReason ?? '',
    });
  }, [selectedEmployee]);

  useEffect(() => {
    if (!linkEmployee) return;
    setUserRoleId('');
    setUserBranchId(linkEmployee.branchId ?? '');
    setUserLocationId(linkEmployee.locationId ?? '');
  }, [linkEmployee]);

  return (
    <div className="w-full space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Employees</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Input
              placeholder="Employee number"
              value={employeeNumber}
              onChange={(e) => setEmployeeNumber(e.target.value)}
            />
            <Input
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <Input
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
            <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input
              placeholder="Telephone"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
            />
            <Select
              value={branchId}
              onValueChange={(value) => {
                setBranchId(value);
                setLocationId('');
              }}
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
            <Select value={locationId} onValueChange={setLocationId}>
              <SelectTrigger disabled={!branchId}>
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
            <Select value={departmentId} onValueChange={setDepartmentId}>
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
            <Select value={jobTitleId} onValueChange={setJobTitleId}>
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
            <Button
              disabled={
                !employeeNumber.trim() ||
                !firstName.trim() ||
                !lastName.trim() ||
                !telephone.trim() ||
                isCreating
              }
              onClick={async () => {
                await createEmployee({
                  employeeNumber: employeeNumber.trim(),
                  firstName: firstName.trim(),
                  lastName: lastName.trim(),
                  email: email.trim() || null,
                  telephone: telephone.trim(),
                  branchId: branchId || null,
                  locationId: locationId || null,
                  departmentId: departmentId || null,
                  jobTitleId: jobTitleId || null,
                  hireDate: new Date().toISOString().slice(0, 10),
                }).unwrap();
                setEmployeeNumber('');
                setFirstName('');
                setLastName('');
                setEmail('');
                setTelephone('');
                setBranchId('');
                setLocationId('');
                setDepartmentId('');
                setJobTitleId('');
              }}
            >
              Add employee
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No.</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Job title</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>User</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8}>Loading employees...</TableCell>
                </TableRow>
              ) : rows.length ? (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.employeeNumber}</TableCell>
                    <TableCell>{row.displayName}</TableCell>
                    <TableCell>{row.departmentName ?? '-'}</TableCell>
                    <TableCell>{row.jobTitleName ?? '-'}</TableCell>
                    <TableCell>{row.branchName ?? '-'}</TableCell>
                    <TableCell>{row.email ?? '-'}</TableCell>
                    <TableCell>{row.hasUserAccount ? 'Linked' : 'Not linked'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedEmployee(row)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          disabled={row.hasUserAccount || !row.email}
                          onClick={() => setLinkEmployee(row)}
                        >
                          {row.hasUserAccount ? 'Linked' : 'Create user'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8}>No employees found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selectedEmployee)}
        onOpenChange={(open) => !open && setSelectedEmployee(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit employee</DialogTitle>
            <DialogDescription>Update employment and contact information.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <FieldGroup>
              <Field>
                <FieldLabel>First name</FieldLabel>
                <Input
                  value={editForm.firstName}
                  onChange={(e) =>
                    setEditForm((current) => ({ ...current, firstName: e.target.value }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Middle name</FieldLabel>
                <Input
                  value={editForm.middleName}
                  onChange={(e) =>
                    setEditForm((current) => ({ ...current, middleName: e.target.value }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Last name</FieldLabel>
                <Input
                  value={editForm.lastName}
                  onChange={(e) =>
                    setEditForm((current) => ({ ...current, lastName: e.target.value }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm((current) => ({ ...current, email: e.target.value }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Telephone</FieldLabel>
                <Input
                  value={editForm.telephone}
                  onChange={(e) =>
                    setEditForm((current) => ({ ...current, telephone: e.target.value }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Payment method</FieldLabel>
                <Input
                  value={editForm.paymentMethod}
                  onChange={(e) =>
                    setEditForm((current) => ({ ...current, paymentMethod: e.target.value }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Bank name</FieldLabel>
                <Input
                  value={editForm.bankName}
                  onChange={(e) =>
                    setEditForm((current) => ({ ...current, bankName: e.target.value }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Account name</FieldLabel>
                <Input
                  value={editForm.bankAccountName}
                  onChange={(e) =>
                    setEditForm((current) => ({ ...current, bankAccountName: e.target.value }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Account number</FieldLabel>
                <Input
                  value={editForm.bankAccountNumber}
                  onChange={(e) =>
                    setEditForm((current) => ({ ...current, bankAccountNumber: e.target.value }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Mobile money number</FieldLabel>
                <Input
                  value={editForm.mobileMoneyNumber}
                  onChange={(e) =>
                    setEditForm((current) => ({ ...current, mobileMoneyNumber: e.target.value }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Status</FieldLabel>
                <Select
                  value={editForm.employmentStatus}
                  onValueChange={(value) =>
                    setEditForm((current) => ({ ...current, employmentStatus: value }))
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
                  value={editForm.employmentType}
                  onValueChange={(value) =>
                    setEditForm((current) => ({ ...current, employmentType: value }))
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
            </FieldGroup>

            <FieldGroup>
              <Field>
                <FieldLabel>Branch</FieldLabel>
                <Select
                  value={editForm.branchId}
                  onValueChange={(value) =>
                    setEditForm((current) => ({ ...current, branchId: value, locationId: '' }))
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
                  value={editForm.locationId}
                  onValueChange={(value) =>
                    setEditForm((current) => ({ ...current, locationId: value }))
                  }
                >
                  <SelectTrigger disabled={!editForm.branchId}>
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locationOptions
                      .filter((option) => option.branchId === editForm.branchId)
                      .map((option) => (
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
                  value={editForm.departmentId}
                  onValueChange={(value) =>
                    setEditForm((current) => ({ ...current, departmentId: value }))
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
                  value={editForm.jobTitleId}
                  onValueChange={(value) =>
                    setEditForm((current) => ({ ...current, jobTitleId: value }))
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
                <FieldLabel>Confirmation date</FieldLabel>
                <Input
                  type="date"
                  value={editForm.confirmationDate}
                  onChange={(e) =>
                    setEditForm((current) => ({ ...current, confirmationDate: e.target.value }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Termination date</FieldLabel>
                <Input
                  type="date"
                  value={editForm.terminationDate}
                  onChange={(e) =>
                    setEditForm((current) => ({ ...current, terminationDate: e.target.value }))
                  }
                />
              </Field>
              <Field className="md:col-span-2">
                <FieldLabel>Termination reason</FieldLabel>
                <Input
                  value={editForm.terminationReason}
                  onChange={(e) =>
                    setEditForm((current) => ({ ...current, terminationReason: e.target.value }))
                  }
                />
              </Field>
            </FieldGroup>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedEmployee(null)}>
              Cancel
            </Button>
            <Button
              disabled={!selectedEmployee || isUpdating}
              onClick={async () => {
                if (!selectedEmployee) return;
                await updateEmployee({
                  id: selectedEmployee.id,
                  body: {
                    firstName: editForm.firstName.trim(),
                    middleName: editForm.middleName.trim() || null,
                    lastName: editForm.lastName.trim(),
                    email: editForm.email.trim() || null,
                    telephone: editForm.telephone.trim(),
                    paymentMethod: editForm.paymentMethod.trim() || null,
                    bankName: editForm.bankName.trim() || null,
                    bankAccountName: editForm.bankAccountName.trim() || null,
                    bankAccountNumber: editForm.bankAccountNumber.trim() || null,
                    mobileMoneyNumber: editForm.mobileMoneyNumber.trim() || null,
                    branchId: editForm.branchId || null,
                    locationId: editForm.locationId || null,
                    departmentId: editForm.departmentId || null,
                    jobTitleId: editForm.jobTitleId || null,
                    employmentStatus: Number(editForm.employmentStatus),
                    employmentType: Number(editForm.employmentType),
                    confirmationDate: editForm.confirmationDate || null,
                    terminationDate: editForm.terminationDate || null,
                    terminationReason: editForm.terminationReason.trim() || null,
                  },
                }).unwrap();
                setSelectedEmployee(null);
              }}
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(linkEmployee)} onOpenChange={(open) => !open && setLinkEmployee(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create user from employee</DialogTitle>
            <DialogDescription>
              Provision login access for {linkEmployee?.displayName ?? 'this employee'}.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel>Role</FieldLabel>
              <Select value={userRoleId} onValueChange={setUserRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Branch</FieldLabel>
              <Select
                value={userBranchId}
                onValueChange={(value) => {
                  setUserBranchId(value);
                  setUserLocationId('');
                }}
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
              <Select value={userLocationId} onValueChange={setUserLocationId}>
                <SelectTrigger disabled={!userBranchId}>
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  {userLocationOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkEmployee(null)}>
              Cancel
            </Button>
            <Button
              disabled={!linkEmployee || !userRoleId || !userBranchId || isLinking}
              onClick={async () => {
                if (!linkEmployee) return;
                await createEmployeeUserAccount({
                  employeeId: linkEmployee.id,
                  roleId: userRoleId,
                  branchId: userBranchId,
                  locationId: userLocationId || null,
                }).unwrap();
                setLinkEmployee(null);
              }}
            >
              Create user
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
