import { Elysia } from 'elysia';
import { usersRoutes } from '../features/users/routes';
import { authRoutes } from '../features/auth/routes';

export const api = new Elysia({ name: 'api' })
  .use(authRoutes) // /auth/*
  .group('/users', (app) => app.use(usersRoutes)); // /users/*
