import { Elysia } from 'elysia';
import { authRoutes } from '../features/auth/routes';
import { deviceRoutes } from '../features/auth/device.routes';

export const api = new Elysia({ name: 'api' }).use(authRoutes).use(deviceRoutes);
