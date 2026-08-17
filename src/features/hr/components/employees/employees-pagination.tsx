import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';

const PAGE_SIZE_OPTIONS = ['10', '20', '50', '100'] as const;

interface EmployeesPaginationProps {
  meta?: {
    page: number;
    totalPages: number;
    totalRecords: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
  pageSize: number;
  onPageSizeChange: (value: number) => void;
  onPrevious: () => void;
  onNext: () => void;
}

export function EmployeesPagination({
  meta,
  pageSize,
  onPageSizeChange,
  onPrevious,
  onNext,
}: EmployeesPaginationProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-muted-foreground">
        {meta
          ? `Showing page ${meta.page} of ${meta.totalPages} (${meta.totalRecords} total)`
          : 'No records'}
      </div>
      <div className="flex items-center gap-2">
        <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
          <SelectTrigger className="w-28" aria-label="Rows per page">
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
        <Button variant="outline" size="sm" onClick={onPrevious} disabled={!meta?.hasPreviousPage}>
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={onNext} disabled={!meta?.hasNextPage}>
          Next
        </Button>
      </div>
    </div>
  );
}
