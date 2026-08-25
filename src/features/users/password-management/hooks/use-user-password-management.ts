import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import ThrowErrorMessage from '@/lib/throw-error';
import { useListUserPasswordTargetsQuery, useSetUserPasswordMutation } from '../services';

export function useUserPasswordManagement() {
  const { data: users = [], isLoading: isLoadingUsers } = useListUserPasswordTargetsQuery();
  const [setUserPassword, { isLoading: isSaving }] = useSetUserPasswordMutation();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const selectedUser = users.find((user) => user.id === userId) ?? null;
  const passwordError =
    password.length > 0 && password.length < 8
      ? 'Password must be at least 8 characters.'
      : undefined;
  const confirmationError =
    confirmPassword.length > 0 && confirmPassword !== password
      ? 'Passwords do not match.'
      : undefined;
  const canSubmit = Boolean(
    userId && password.length >= 8 && password === confirmPassword && !isSaving,
  );

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    try {
      await setUserPassword({ userId, password }).unwrap();
      toast.success(`Password updated for ${selectedUser?.fullname ?? 'user'}`);
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      ThrowErrorMessage(error);
    }
  };

  return {
    users,
    selectedUser,
    userId,
    password,
    confirmPassword,
    passwordError,
    confirmationError,
    canSubmit,
    isLoadingUsers,
    isSaving,
    setUserId,
    setPassword,
    setConfirmPassword,
    submit,
  };
}
