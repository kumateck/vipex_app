import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCreateInventoryProductMutation, useUpdateInventoryProductMutation } from '../api/inventory-products.api';
import type {
  CreateInventoryProductFormValues,
  EditInventoryProductFormValues,
} from '../schemas/inventory-product-form.schema';
import { getInventoryProductErrorMessage } from '../utils/inventory-product-error';

export function useCreateInventoryProductAction() {
  const navigate = useNavigate();
  const [createInventoryProduct, { isLoading: isSubmitting }] = useCreateInventoryProductMutation();

  const onSubmit = async (values: CreateInventoryProductFormValues) => {
    try {
      await createInventoryProduct(values).unwrap();
      toast.success('Inventory product created successfully');
      navigate('/inventory/products', { replace: true });
    } catch (error) {
      toast.error(getInventoryProductErrorMessage(error));
    }
  };

  return { onSubmit, isSubmitting };
}

export function useUpdateInventoryProductAction(id: string) {
  const navigate = useNavigate();
  const [updateInventoryProduct, { isLoading: isSubmitting }] = useUpdateInventoryProductMutation();

  const onSubmit = async (values: EditInventoryProductFormValues) => {
    try {
      await updateInventoryProduct({ id, body: values }).unwrap();
      toast.success('Inventory product updated successfully');
      navigate('/inventory/products', { replace: true });
    } catch (error) {
      toast.error(getInventoryProductErrorMessage(error));
    }
  };

  return { onSubmit, isSubmitting };
}
