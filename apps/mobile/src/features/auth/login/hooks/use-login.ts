import { useCallback, useState } from 'react';
import { getMobileErrorMessage } from '@mobile/lib/mobile-error-message';
import { router } from '@mobile/navigation/router-compat';
import { useAuth } from '@mobile/providers/auth-provider';

export function useLogin() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEmailChange = useCallback((value: string) => {
    setEmail(value);
    setError(null);
  }, []);

  const handlePasswordChange = useCallback((value: string) => {
    setPassword(value);
    setError(null);
  }, []);

  const handleLogin = useCallback(async () => {
    if (!email.trim() || !password || loading) return;

    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/(app)/(tabs)');
    } catch (err) {
      setError(getMobileErrorMessage(err, 'Login failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [email, loading, login, password]);

  return {
    email,
    error,
    loading,
    password,
    handleEmailChange,
    handleLogin,
    handlePasswordChange,
  };
}
