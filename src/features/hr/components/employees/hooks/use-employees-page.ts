import { useCallback, useEffect, useMemo, useState } from 'react';
import { useListBranchOptionsQuery } from '@/features/branches/api/branches.api';
import {
  useListDepartmentOptionsQuery,
  useListEmployeeOptionsQuery,
  useListEmployeesQuery,
  useListJobTitleOptionsQuery,
} from '../../../api/hr.api';

export function useEmployeesPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [branchId, setBranchId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [jobTitleId, setJobTitleId] = useState('');
  const [reportingOfficerId, setReportingOfficerId] = useState('');

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setSearch(searchInput), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [searchInput, branchId, departmentId, jobTitleId, reportingOfficerId]);

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
  const { data: reportingEmployees = [] } = useListEmployeeOptionsQuery();
  const { data: departmentOptions = [] } = useListDepartmentOptionsQuery();
  const { data: jobTitleOptions = [] } = useListJobTitleOptionsQuery();
  const { data: branchOptions = [] } = useListBranchOptionsQuery();

  const reportingOfficerOptions = useMemo(
    () =>
      reportingEmployees.map((employee) => ({
        id: employee.id,
        name: `${employee.displayName} (${employee.employeeNumber})`,
      })),
    [reportingEmployees],
  );
  const reportingTitleById = useMemo(
    () => new Map(jobTitleOptions.map((jobTitle) => [jobTitle.id, jobTitle.name] as const)),
    [jobTitleOptions],
  );
  const hasActiveFilters = Boolean(
    searchInput.trim() || branchId || departmentId || jobTitleId || reportingOfficerId,
  );

  const resetFilters = useCallback(() => {
    setSearchInput('');
    setSearch('');
    setBranchId('');
    setDepartmentId('');
    setJobTitleId('');
    setReportingOfficerId('');
    setPage(1);
  }, []);

  const changePageSize = useCallback((value: number) => {
    setPageSize(value);
    setPage(1);
  }, []);

  return {
    rows: data?.data ?? [],
    meta: data?.meta,
    isLoading,
    filters: {
      searchInput,
      branchId,
      departmentId,
      jobTitleId,
      reportingOfficerId,
      hasActiveFilters,
    },
    options: { branchOptions, departmentOptions, jobTitleOptions, reportingOfficerOptions },
    actions: {
      setSearchInput,
      setBranchId,
      setDepartmentId,
      setJobTitleId,
      setReportingOfficerId,
      resetFilters,
      setPage,
      changePageSize,
    },
    pageSize,
    reportingTitleById,
  };
}
