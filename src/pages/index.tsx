import { createHashRouter, RouterProvider } from 'react-router-dom';
import { routes } from '@/routes/generated';

const router = createHashRouter(routes);

export function MainRoutes() {
  return <RouterProvider router={router} />;
}

export default MainRoutes;
