import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  useCreateInventoryCategoryMutation,
  useUpdateInventoryCategoryMutation,
} from '../api/inventory-categories.api';
import type { InventoryCategoryFormValues } from '../schemas/inventory-category-form.schema';
import { getInventoryCategoryErrorMessage } from '../utils/inventory-category-error';

export function useCreateInventoryCategoryAction() {
  const navigate = useNavigate();
  const [createInventoryCategory, { isLoading: isSubmitting }] = useCreateInventoryCategoryMutation();

  const onSubmit = async (values: InventoryCategoryFormValues) => {
    try {
      await createInventoryCategory(values).unwrap();
      toast.success('Product category created successfully');
      navigate('/inventory/categories', { replace: true });
    } catch (error) {
      toast.error(getInventoryCategoryErrorMessage(error));
    }
  };

  return { onSubmit, isSubmitting };
}

export function useUpdateInventoryCategoryAction(id: string) {
  const navigate = useNavigate();
  const [updateInventoryCategory, { isLoading: isSubmitting }] = useUpdateInventoryCategoryMutation();

  const onSubmit = async (values: InventoryCategoryFormValues) => {
    try {
      await updateInventoryCategory({ id, body: values }).unwrap();
      toast.success('Product category updated successfully');
      navigate('/inventory/categories', { replace: true });
    } catch (error) {
      toast.error(getInventoryCategoryErrorMessage(error));
    }
  };

  return { onSubmit, isSubmitting };
}
