import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  useCreateNotificationTemplateMutation,
  useGetNotificationTemplateQuery,
  useUpdateNotificationTemplateMutation,
} from '../api/notification-hub.api';
import { NotificationTemplatesListPage } from './notification-templates-list-page';
import {
  NotificationTemplateForm,
  type NotificationTemplateFormValues,
} from '../components/notification-template-form';

export function NotificationTemplatesUpsertPage() {
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const templateId = params.id;
  const isEditMode = Boolean(templateId);
  const [createTemplate, { isLoading: isCreating }] = useCreateNotificationTemplateMutation();
  const [updateTemplate, { isLoading: isUpdating }] = useUpdateNotificationTemplateMutation();
  const {
    data: template,
    isLoading,
    isFetching,
  } = useGetNotificationTemplateQuery({ id: templateId ?? '' }, { skip: !templateId });
  const onClose = () => navigate('/notification-hub/templates');

  const onSubmit = async (values: NotificationTemplateFormValues) => {
    try {
      if (isEditMode && templateId) {
        await updateTemplate({
          id: templateId,
          body: {
            name: values.name,
            subject: values.subject.trim() || null,
            body: values.body,
            variablesJson: values.variablesJson,
            isActive: values.isActive,
          },
        }).unwrap();
        toast.success('Notification template updated');
      } else {
        await createTemplate({
          channel: values.channel,
          code: values.code,
          name: values.name,
          subject: values.subject.trim() || null,
          body: values.body,
          variablesJson: values.variablesJson,
          isActive: values.isActive,
        }).unwrap();
        toast.success('Notification template created');
      }
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : isEditMode
            ? 'Failed to update template'
            : 'Failed to create template',
      );
    }
  };

  return (
    <>
      <NotificationTemplatesListPage />
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Edit Notification Template' : 'Add Notification Template'}
            </DialogTitle>
          </DialogHeader>
          {isEditMode && (isLoading || isFetching) ? (
            <p className="text-sm text-muted-foreground">Loading template...</p>
          ) : isEditMode && !template ? (
            <p className="text-sm text-destructive">Template not found.</p>
          ) : (
            <NotificationTemplateForm
              mode={isEditMode ? 'edit' : 'create'}
              isSubmitting={isCreating || isUpdating}
              initialValues={
                template
                  ? {
                      channel: template.channel,
                      code: template.code,
                      name: template.name,
                      subject: template.subject ?? '',
                      body: template.body,
                      variablesJson: template.variablesJson,
                      isActive: template.isActive,
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

export const NotificationTemplatesCreatePage = NotificationTemplatesUpsertPage;
