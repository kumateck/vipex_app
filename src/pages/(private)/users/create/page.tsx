import { Navigate } from 'react-router-dom';

export default function UsersCreateLegacyRedirectPage() {
  return <Navigate to="/users/new" replace />;
}
