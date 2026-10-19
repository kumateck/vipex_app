import { useCallback, useState } from 'react';
import { getMobileErrorMessage } from '@mobile/lib/mobile-error-message';
import { router } from '@mobile/navigation/router-compat';
import { useAuth } from '@mobile/providers/auth-provider';
import { getMobileDeviceStatus, registerMobileDevice } from '@mobile/lib/api';
import type { DeviceStatus } from '@mobile/lib/device-registration';

export function useLogin() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus | null>(null);

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

  const handleRegisterDevice = useCallback(async () => {
    if (!email.trim() || !password || loading) return;
    setError(null);
    setLoading(true);
    try {
      setDeviceStatus(await registerMobileDevice(email.trim(), password));
    } catch (err) {
      setError(getMobileErrorMessage(err, 'Could not register this device.'));
    } finally {
      setLoading(false);
    }
  }, [email, loading, password]);

  const handleCheckDevice = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      setDeviceStatus(await getMobileDeviceStatus());
    } catch (err) {
      setError(getMobileErrorMessage(err, 'Could not check device approval.'));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    email,
    error,
    loading,
    deviceStatus,
    password,
    handleEmailChange,
    handleLogin,
    handleRegisterDevice,
    handleCheckDevice,
    handlePasswordChange,
  };
}
