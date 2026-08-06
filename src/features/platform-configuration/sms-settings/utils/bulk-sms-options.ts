import type { BulkSmsAudience } from '../types';

export const BULK_SMS_AUDIENCES: Array<{ value: BulkSmsAudience; label: string }> = [
  { value: 'customers_all', label: 'All customers with phone numbers' },
  { value: 'users_all', label: 'All application users with phone numbers' },
  { value: 'employees_all', label: 'All employees with phone numbers' },
  { value: 'employees_birthday_today', label: 'Employees with birthdays today' },
];
