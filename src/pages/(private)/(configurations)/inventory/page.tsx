import { Navigate } from 'react-router-dom';

export default function InventoryRedirectPage() {
  return <Navigate to="/inventory/products" replace />;
}
