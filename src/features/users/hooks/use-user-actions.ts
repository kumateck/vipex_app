import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCreateUserMutation, useUpdateUserMutation } from '../api/users.api';
import type { UserFormValues } from '../schemas/user-form.schema';
import { getUserErrorMessage } from '../utils/user-error';

export function useCreateUserAction() {
  const navigate = useNavigate();
  const [createUser, { isLoading: isSubmitting }] = useCreateUserMutation();

  const onSubmit = async (values: UserFormValues) => {
    try {
      await createUser(values).unwrap();
      toast.success('User created successfully');
      navigate('/users', { replace: true });
    } catch (error) {
      toast.error(getUserErrorMessage(error));
    }
  };

  return { onSubmit, isSubmitting };
}

export function useUpdateUserAction(id: string) {
  const navigate = useNavigate();
  const [updateUser, { isLoading: isSubmitting }] = useUpdateUserMutation();

  const onSubmit = async (values: UserFormValues) => {
    try {
      await updateUser({ id, body: values }).unwrap();
      toast.success('User updated successfully');
      navigate('/users', { replace: true });
    } catch (error) {
      toast.error(getUserErrorMessage(error));
    }
  };

  return { onSubmit, isSubmitting };
}
