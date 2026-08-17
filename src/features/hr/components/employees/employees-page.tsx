import { Link } from 'react-router-dom';
import { PermissionGuard } from '@/components/permissions/permission-guard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { PermissionKeys } from '@/shared/permissions/constants';
import { EmployeesFilters } from './employees-filters';
import { EmployeesLinkUserDialog } from './employees-link-user-dialog';
import { EmployeesPagination } from './employees-pagination';
import { EmployeesTable } from './employees-table';
import { useEmployeeAccountLink } from './hooks/use-employee-account-link';
import { useEmployeesPage } from './hooks/use-employees-page';

export function EmployeesPage() {
  const employeeList = useEmployeesPage();
  const accountLink = useEmployeeAccountLink();

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
            <EmployeesFilters
              {...employeeList.filters}
              {...employeeList.options}
              onSearchChange={employeeList.actions.setSearchInput}
              onBranchChange={employeeList.actions.setBranchId}
              onDepartmentChange={employeeList.actions.setDepartmentId}
              onJobTitleChange={employeeList.actions.setJobTitleId}
              onReportingOfficerChange={employeeList.actions.setReportingOfficerId}
              onReset={employeeList.actions.resetFilters}
            />

            <EmployeesTable
              rows={employeeList.rows}
              isLoading={employeeList.isLoading}
              reportingTitleById={employeeList.reportingTitleById}
              onCreateUser={accountLink.open}
            />

            <EmployeesPagination
              meta={employeeList.meta}
              pageSize={employeeList.pageSize}
              onPageSizeChange={employeeList.actions.changePageSize}
              onPrevious={() => employeeList.actions.setPage((current) => Math.max(1, current - 1))}
              onNext={() => employeeList.actions.setPage((current) => current + 1)}
            />
          </CardContent>
        </Card>
      </ScrollableWrapper>

      <EmployeesLinkUserDialog
        open={Boolean(accountLink.employee)}
        employee={accountLink.employee}
        roleOptions={accountLink.roleOptions}
        branchOptions={employeeList.options.branchOptions}
        locationOptions={accountLink.locationOptions}
        userRoleId={accountLink.roleId}
        userBranchId={accountLink.branchId}
        userLocationId={accountLink.locationId}
        onUserRoleIdChange={accountLink.setRoleId}
        onUserBranchIdChange={accountLink.changeBranch}
        onUserLocationIdChange={accountLink.setLocationId}
        isSubmitting={accountLink.isSubmitting}
        onOpenChange={(open) => !open && accountLink.close()}
        onClose={accountLink.close}
        onSubmit={accountLink.submit}
      />
    </div>
  );
}
