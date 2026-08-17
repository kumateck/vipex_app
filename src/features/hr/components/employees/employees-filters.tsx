import { Button } from '@/components/ui/button';
import { FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';

interface FilterOption {
  id: string;
  name: string;
}

interface EmployeesFiltersProps {
  searchInput: string;
  branchId: string;
  departmentId: string;
  jobTitleId: string;
  reportingOfficerId: string;
  branchOptions: FilterOption[];
  departmentOptions: FilterOption[];
  jobTitleOptions: FilterOption[];
  reportingOfficerOptions: FilterOption[];
  hasActiveFilters: boolean;
  onSearchChange: (value: string) => void;
  onBranchChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
  onJobTitleChange: (value: string) => void;
  onReportingOfficerChange: (value: string) => void;
  onReset: () => void;
}

const ALL_OPTIONS_VALUE = '__all__';

function EmployeeFilterSelect({
  id,
  value,
  placeholder,
  allLabel,
  options,
  onChange,
}: {
  id: string;
  value: string;
  placeholder: string;
  allLabel: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="min-w-0">
      <FieldLabel htmlFor={id} className="sr-only">
        {placeholder}
      </FieldLabel>
      <Select
        value={value || ALL_OPTIONS_VALUE}
        onValueChange={(nextValue) => onChange(nextValue === ALL_OPTIONS_VALUE ? '' : nextValue)}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_OPTIONS_VALUE}>{allLabel}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function EmployeesFilters(props: EmployeesFiltersProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <FieldLabel htmlFor="employee-search" className="sr-only">
          Search employees
        </FieldLabel>
        <Input
          id="employee-search"
          className="w-full md:max-w-2xl"
          placeholder="Search by name, email, staff ID or phone"
          value={props.searchInput}
          onChange={(event) => props.onSearchChange(event.target.value)}
        />
        {props.hasActiveFilters ? (
          <Button variant="outline" onClick={props.onReset}>
            Reset
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <EmployeeFilterSelect
          id="employee-branch-filter"
          value={props.branchId}
          placeholder="Filter by branch"
          allLabel="All branches"
          options={props.branchOptions}
          onChange={props.onBranchChange}
        />
        <EmployeeFilterSelect
          id="employee-department-filter"
          value={props.departmentId}
          placeholder="Filter by department"
          allLabel="All departments"
          options={props.departmentOptions}
          onChange={props.onDepartmentChange}
        />
        <EmployeeFilterSelect
          id="employee-job-title-filter"
          value={props.jobTitleId}
          placeholder="Filter by job title"
          allLabel="All job titles"
          options={props.jobTitleOptions}
          onChange={props.onJobTitleChange}
        />
        <EmployeeFilterSelect
          id="employee-reporting-officer-filter"
          value={props.reportingOfficerId}
          placeholder="Filter by reporting officer"
          allLabel="All reporting officers"
          options={props.reportingOfficerOptions}
          onChange={props.onReportingOfficerChange}
        />
      </div>
    </div>
  );
}
