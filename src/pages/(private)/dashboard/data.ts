// Generate 10,000 fake users

import type { User } from './column';

export const largeData: User[] = Array.from({ length: 100 }, (_, i) => ({
  id: `${i}`,
  name: `User ${i}`,
  email: `user${i}@example.com`,
  role: 'User',
  status: 'active',
}));
