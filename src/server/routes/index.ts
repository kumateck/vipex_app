import { Elysia } from 'elysia';
import { authRoutes } from '../features/auth/routes';

export const api = new Elysia({ name: 'api' }).use(authRoutes);
