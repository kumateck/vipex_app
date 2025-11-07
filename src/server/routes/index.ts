import { Elysia } from 'elysia';
import { authRoutes } from '../features/auth/routes';
import { authPasswordRoutes } from '../features/auth/routes.reset-password';
// import { usersRoutes } from '../features/users/routes';
// import { statusesRoutes } from '../features/statuses/routes';
// import { branchesRoutes } from '../features/branches/routes';
// import { locationsRoutes } from '../features/locations/routes';

export const api = new Elysia({ name: 'api' }).use(authRoutes).use(authPasswordRoutes); // /auth/*
// .group('/core', (app) =>
//   app.use(branchesRoutes).use(locationsRoutes).use(usersRoutes).use(statusesRoutes),
// );
