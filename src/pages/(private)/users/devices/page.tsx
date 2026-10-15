import { Navigate } from 'react-router-dom';

export default function RegisteredDevicesLegacyRedirectPage() {
  return <Navigate to="/settings/devices" replace />;
}
