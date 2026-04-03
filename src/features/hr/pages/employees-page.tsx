import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
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
import { PermissionGuard } from '@/components/permissions/permission-guard';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useListBranchOptionsQuery } from '@/features/branches';
import { useListLocationOptionsQuery } from '@/features/locations';
import { useListRoleOptionsQuery } from '@/features/rbac';
import {
  useCreateEmployeeUserAccountMutation,
  useListDepartmentOptionsQuery,
  useListEmployeeOptionsQuery,
  useListEmployeesQuery,
  useListJobTitleOptionsQuery,
  type Employee,
} from '../api/hr.api';

const PAGE_SIZE_OPTIONS = ['10', '20', '50', '100'] as const;

export function EmployeesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [branchId, setBranchId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [jobTitleId, setJobTitleId] = useState('');
  const [reportingOfficerId, setReportingOfficerId] = useState('');

  const [linkEmployee, setLinkEmployee] = useState<Employee | null>(null);
  const [userRoleId, setUserRoleId] = useState('');
  const [userBranchId, setUserBranchId] = useState('');
  const [userLocationId, setUserLocationId] = useState('');

  const listQuery = useMemo(
    () => ({
      page,
      pageSize,
      search: search.trim() || undefined,
      filters: {
        branchId: branchId || undefined,
        departmentId: departmentId || undefined,
        jobTitleId: jobTitleId || undefined,
        officerEmployeeId: reportingOfficerId || undefined,
      },
    }),
    [branchId, departmentId, jobTitleId, page, pageSize, reportingOfficerId, search],
  );

  const { data, isLoading } = useListEmployeesQuery(listQuery);
  const { data: reportingOfficerOptions = [] } = useListEmployeeOptionsQuery();
  const { data: departmentOptions = [] } = useListDepartmentOptionsQuery();
  const { data: jobTitleOptions = [] } = useListJobTitleOptionsQuery();
  const { data: branchOptions = [] } = useListBranchOptionsQuery();
  const { data: roleOptions = [] } = useListRoleOptionsQuery();
  const { data: userLocationOptions = [] } = useListLocationOptionsQuery(
    { branchId: userBranchId || undefined },
    { skip: !userBranchId },
  );

  const [createEmployeeUserAccount, { isLoading: isLinking }] =
    useCreateEmployeeUserAccountMutation();

  const rows = data?.data ?? [];
  const meta = data?.meta;
  const jobTitleNameById = useMemo(
    () => new Map(jobTitleOptions.map((jobTitle) => [jobTitle.id, jobTitle.name] as const)),
    [jobTitleOptions],
  );

  useEffect(() => {
    setPage(1);
  }, [search, branchId, departmentId, jobTitleId, reportingOfficerId]);

  useEffect(() => {
    if (!linkEmployee) return;
    setUserRoleId('');
    setUserBranchId(linkEmployee.branchId ?? '');
    setUserLocationId(linkEmployee.locationId ?? '');
  }, [linkEmployee]);

  return (
    <div className="w-full space-y-4 p-4">
      <ScrollableWrapper>
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <CardTitle>Employees</CardTitle>
              <PermissionGuard permissionKey={PermissionKeys.CanCreateEmployee}>
                <Button asChild>
                  <Link to="/hr/employees/new">Add employee</Link>
                </Button>
              </PermissionGuard>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-6">
              <div className="md:col-span-2">
                <Input
                  placeholder="Search by first name, last name, email, staff ID or phone"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              <Select
                value={branchId || '__all__'}
                onValueChange={(value) => setBranchId(value === '__all__' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All branches</SelectItem>
                  {branchOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={departmentId || '__all__'}
                onValueChange={(value) => setDepartmentId(value === '__all__' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All departments</SelectItem>
                  {departmentOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={jobTitleId || '__all__'}
                onValueChange={(value) => setJobTitleId(value === '__all__' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All job titles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All job titles</SelectItem>
                  {jobTitleOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={reportingOfficerId || '__all__'}
                onValueChange={(value) => setReportingOfficerId(value === '__all__' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All reporting officers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All reporting officers</SelectItem>
                  {reportingOfficerOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.displayName} ({option.employeeNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Select
                  value={String(pageSize)}
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    setPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Rows" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value} / page
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch('');
                    setBranchId('');
                    setDepartmentId('');
                    setJobTitleId('');
                    setReportingOfficerId('');
                    setPage(1);
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No.</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Job title</TableHead>
                  <TableHead>Reporting officer title</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9}>Loading employees...</TableCell>
                  </TableRow>
                ) : rows.length ? (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.employeeNumber}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={row.profileImageUrl ?? undefined}
                              alt={row.displayName}
                            />
                            <AvatarFallback>
                              {row.displayName.slice(0, 1).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span>{row.displayName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{row.departmentName ?? '-'}</TableCell>
                      <TableCell>{row.jobTitleName ?? '-'}</TableCell>
                      <TableCell>
                        {(row.reportingOfficerTitleId &&
                          jobTitleNameById.get(row.reportingOfficerTitleId)) ||
                          '-'}
                      </TableCell>
                      <TableCell>{row.branchName ?? '-'}</TableCell>
                      <TableCell>{row.email ?? '-'}</TableCell>
                      <TableCell>{row.hasUserAccount ? 'Linked' : 'Not linked'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button asChild variant="outline" size="sm">
                            <Link to={`/hr/employees/edit/${row.id}`}>Edit</Link>
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
                    <TableCell colSpan={9}>No employees found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between gap-2">
              <div className="text-sm text-muted-foreground">
                {meta
                  ? `Showing page ${meta.page} of ${meta.totalPages} (${meta.totalRecords} total)`
                  : 'No records'}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={!meta?.hasPreviousPage}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((current) => current + 1)}
                  disabled={!meta?.hasNextPage}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </ScrollableWrapper>

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
                try {
                  await createEmployeeUserAccount({
                    employeeId: linkEmployee.id,
                    roleId: userRoleId,
                    branchId: userBranchId,
                    locationId: userLocationId || null,
                  }).unwrap();
                  toast.success('User account created');
                  setLinkEmployee(null);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : 'Failed to create user');
                }
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
