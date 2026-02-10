import { shiftManagementRoutes } from './features/shifts/management.routes';

// Add shift management routes to main app
const shiftRoutes = {
  '/shifts': shiftManagementRoutes,
  '/shift-management': shiftManagementRoutes,
};
