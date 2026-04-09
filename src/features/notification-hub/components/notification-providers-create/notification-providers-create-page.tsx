import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  useCreateNotificationProviderMutation,
  useGetNotificationProviderQuery,
  useUpdateNotificationProviderMutation,
} from '../../api/notification-hub.api';
import { NotificationProvidersListPage } from '../notification-providers-list/notification-providers-list-page';
import {
  NotificationProviderForm,
  type NotificationProviderFormValues,
} from '../../components/notification-provider-form';

export function NotificationProvidersUpsertPage() {
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const providerId = params.id;
  const isEditMode = Boolean(providerId);
  const [createProvider, { isLoading: isCreating }] = useCreateNotificationProviderMutation();
  const [updateProvider, { isLoading: isUpdating }] = useUpdateNotificationProviderMutation();
  const {
    data: provider,
    isLoading,
    isFetching,
  } = useGetNotificationProviderQuery({ id: providerId ?? '' }, { skip: !providerId });
  const onClose = () => navigate('/notification-hub/providers');

  const onSubmit = async (values: NotificationProviderFormValues) => {
    try {
      if (isEditMode && providerId) {
        await updateProvider({
          id: providerId,
          body: {
            name: values.name,
            configJson: values.configJson,
            isActive: values.isActive,
            isDefault: values.isDefault,
          },
        }).unwrap();
        toast.success('Notification provider updated');
      } else {
        await createProvider({
          channel: values.channel,
          providerKey: values.providerKey,
          name: values.name,
          configJson: values.configJson,
          isActive: values.isActive,
          isDefault: values.isDefault,
        }).unwrap();
        toast.success('Notification provider created');
      }
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : isEditMode
            ? 'Failed to update provider'
            : 'Failed to create provider',
      );
    }
  };

  return (
    <>
      <NotificationProvidersListPage />
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Edit Notification Provider' : 'Add Notification Provider'}
            </DialogTitle>
          </DialogHeader>
          {isEditMode && (isLoading || isFetching) ? (
            <p className="text-sm text-muted-foreground">Loading provider...</p>
          ) : isEditMode && !provider ? (
            <p className="text-sm text-destructive">Provider not found.</p>
          ) : (
            <NotificationProviderForm
              mode={isEditMode ? 'edit' : 'create'}
              isSubmitting={isCreating || isUpdating}
              initialValues={
                provider
                  ? {
                      channel: provider.channel,
                      providerKey: provider.providerKey,
                      name: provider.name,
                      configJson: provider.configJson,
                      isActive: provider.isActive,
                      isDefault: provider.isDefault,
                    }
                  : undefined
              }
              onSubmit={onSubmit}
              onCancel={onClose}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export const NotificationProvidersCreatePage = NotificationProvidersUpsertPage;
