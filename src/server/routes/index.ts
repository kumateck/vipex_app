import { Elysia } from 'elysia';
import { authRoutes } from '../features/auth/routes';
import { authPasswordRoutes } from '../features/auth/routes.reset-password';

export const api = new Elysia({ name: 'api' }).use(authRoutes).use(authPasswordRoutes);
