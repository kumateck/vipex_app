import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserEmployeeExistingForm } from '../components/user-employee-existing-form';
import { UserEmployeeNewForm } from '../components/user-employee-new-form';
import { useUserEmployeeLink } from '../hooks/use-user-employee-link';
import type { User } from '../types/user.types';

interface UserEmployeeLinkDialogProps {
  user: User;
  onClose: () => void;
}

export function UserEmployeeLinkDialog({ user, onClose }: UserEmployeeLinkDialogProps) {
  const manager = useUserEmployeeLink(user, onClose);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Link employee record</DialogTitle>
          <DialogDescription>
            Connect {user.fullname} to an existing employee or create a new employee record.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={manager.mode}
          onValueChange={(value) => manager.setMode(value as 'existing' | 'new')}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing" disabled={!manager.canLinkExisting}>
              Existing employee
            </TabsTrigger>
            <TabsTrigger value="new" disabled={!manager.canCreateEmployee}>
              Create employee
            </TabsTrigger>
          </TabsList>
          <TabsContent value="existing" className="mt-4">
            <UserEmployeeExistingForm
              employeeId={manager.employeeId}
              employees={manager.employeeOptions}
              isLoading={manager.isLoadingEmployees}
              onEmployeeChange={manager.setEmployeeId}
            />
          </TabsContent>
          <TabsContent value="new" className="mt-4">
            <UserEmployeeNewForm
              departments={manager.departmentOptions}
              form={manager.form}
              jobTitles={manager.jobTitleOptions}
              supervisors={manager.supervisorOptions}
              user={user}
              onChange={manager.updateForm}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={manager.isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={manager.mode === 'existing' ? manager.submitExisting : manager.submitNew}
            disabled={manager.isSubmitting || (manager.mode === 'existing' && !manager.employeeId)}
          >
            {manager.isSubmitting
              ? 'Saving...'
              : manager.mode === 'existing'
                ? 'Link employee'
                : 'Create and link'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
