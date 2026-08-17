import type { HelpCategory } from '../types/help-guide.types';

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    id: 'workspace',
    name: 'Workspace',
    description: 'Dashboard, search, communication, appearance, and getting started.',
    icon: 'LayoutGrid',
  },
  {
    id: 'operations',
    name: 'Operations',
    description: 'Parcel movement, pickup, delivery, riders, dispatch, and fleet transport.',
    icon: 'Package',
  },
  {
    id: 'commercial',
    name: 'Commercial',
    description: 'Customers, notifications, campaigns, and partner operations.',
    icon: 'BriefcaseBusiness',
  },
  {
    id: 'finance',
    name: 'Finance',
    description: 'Accounting, cashier sessions, tax, credit, and reconciliation.',
    icon: 'Wallet',
  },
  {
    id: 'human-capital',
    name: 'Human Capital',
    description: 'Employees, attendance, leave, departments, and payroll.',
    icon: 'UsersRound',
  },
  {
    id: 'supply-chain',
    name: 'Supply Chain',
    description: 'Purchasing, suppliers, inventory, stock, and goods receipts.',
    icon: 'Boxes',
  },
  {
    id: 'governance',
    name: 'Governance',
    description: 'SLA claims and document compliance.',
    icon: 'Scale',
  },
  {
    id: 'insights',
    name: 'Insights',
    description: 'Dashboards, operational reports, financial reports, and audit reports.',
    icon: 'ChartBar',
  },
  {
    id: 'technology',
    name: 'Technology',
    description: 'Users, roles, support, branches, locations, and platform settings.',
    icon: 'Cpu',
  },
  {
    id: 'support',
    name: 'Help and support',
    description: 'Solve common problems or ask the support team for help.',
    icon: 'LifeBuoy',
  },
];
