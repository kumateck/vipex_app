import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  useListCompanyModulesQuery,
  useSetCompanyModuleStateMutation,
} from '../../api/company-modules.api';

export function CompanyModulesPage() {
  const { data, isLoading, isFetching } = useListCompanyModulesQuery();
  const [setModuleState, { isLoading: isSaving }] = useSetCompanyModuleStateMutation();

  const modules = useMemo(() => (Array.isArray(data) ? data : (data?.data ?? [])), [data]);

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Company Modules</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading || isFetching ? (
                  <TableRow>
                    <TableCell colSpan={4}>Loading modules...</TableCell>
                  </TableRow>
                ) : modules.length ? (
                  modules.map((module) => (
                    <TableRow key={module.code}>
                      <TableCell className="font-medium">{module.name}</TableCell>
                      <TableCell>{module.description ?? '-'}</TableCell>
                      <TableCell>{module.isEnabled ? 'Enabled' : 'Disabled'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant={module.isEnabled ? 'outline' : 'default'}
                          disabled={isSaving}
                          onClick={() =>
                            setModuleState({
                              moduleCode: module.code,
                              isEnabled: !module.isEnabled,
                            })
                          }
                        >
                          {module.isEnabled ? 'Disable' : 'Enable'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4}>No modules found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
