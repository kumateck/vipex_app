import { ROUTES } from '@/components/sidebar/navigation';
import type { HelpCategoryId, HelpGuide, HelpModulePage } from '../types';

type NavigationItem = {
  title: string;
  url?: string;
  hiddenInSidebar?: boolean;
  items?: NavigationItem[];
  children?: NavigationItem[];
};

const CATEGORY_BY_GROUP: Record<string, HelpCategoryId> = {
  Workspace: 'workspace',
  Operations: 'operations',
  Commercial: 'commercial',
  Finance: 'finance',
  'Human Capital': 'human-capital',
  'Supply Chain': 'supply-chain',
  Governance: 'governance',
  Insights: 'insights',
  Technology: 'technology',
};

const MODULE_SUMMARIES: Record<string, string> = {
  Dashboard: 'See the information and shortcuts most relevant to your work.',
  'Super Search': 'Find parcels quickly using a tracking number or other known details.',
  'Internal Communication': 'Chat, call, and coordinate events with colleagues inside Vipex.',
  Appearance: 'Choose how Vipex looks on your device.',
  'Help Center': 'Find plain-language instructions for every part of the application.',
  'Booking & Shipping':
    'Create parcel bookings, collect sender payments, and prepare consignments.',
  'Parcel Receiving': 'Review incoming consignments, receive parcels, and record discrepancies.',
  'Call Center': 'Record call outcomes and collect delivery addresses from customers.',
  'Internal Transfers': 'Move parcels between internal holders and confirm handovers.',
  'Pickup & Collection': 'Manage pickup queues, collections, receiver payments, and aged parcels.',
  'Last Mile Delivery': 'Dispatch parcels to riders and complete doorstep delivery payments.',
  'Rider Workforce': 'Monitor a rider’s current work and completed delivery history.',
  'Fleet Transport':
    'Manage vehicles, trips, fuel, maintenance, compliance, and dispatch activity.',
  'Dispatch Optimization': 'Review and improve how work is assigned for delivery.',
  'Customer Master': 'View and maintain customer records and account information.',
  'Notification Orchestration':
    'Configure providers, templates, campaigns, approvals, and delivery logs.',
  'Partner Portal': 'Manage operational work involving partner agents.',
  'GL & Controls':
    'Record daily cash and expenses, manage journals, and review accounting controls.',
  'Tax Computation & Filing': 'Prepare and review the organisation’s tax filing information.',
  'Cashier Session Mgt': 'Open, monitor, close, and review cashier sessions.',
  'Customer Wallet & Credit Control': 'Manage customer credit accounts, payments, and approvals.',
  'Operational Reconciliation': 'Match operational records with sessions and bank settlements.',
  'Payroll Operations': 'Set up compensation, payroll groups, cycles, and payroll inputs.',
  'Employee Administration': 'Create, update, search, and link employee records.',
  'Department Administration': 'Maintain the departments used to organise employees.',
  'Job Title Administration': 'Maintain job titles and their department assignments.',
  'Attendance Management': 'Review employee attendance and working-time records.',
  'Leave Management': 'Manage leave requests, leave types, and leave history.',
  'Sourcing & Purchasing':
    'Manage suppliers, demands, requests, quotes, orders, and goods receipts.',
  'Inventory Control':
    'Manage products, locations, stock, lots, reservations, and inventory tasks.',
  'SLA & Claims Governance': 'Monitor service commitments and manage related claims.',
  'Document Compliance': 'Track whether required operational documents are complete and valid.',
  'Business Analytics': 'Review high-level business performance and operational trends.',
  'Financial Statements & Ledger Reports': 'Run financial statements and detailed ledger reports.',
  'Branch & Performance': 'Compare branch results, profitability, and monthly performance.',
  'Payroll & Payslips': 'Review payroll registers, earnings, deductions, overtime, and postings.',
  'Workforce Administration Reports': 'Review organisation-wide employee information.',
  'Attendance & Leave': 'Run attendance and leave reports for workforce follow-up.',
  'Expenses & Cash': 'Review expense patterns and daily cash confirmations.',
  'Customer Insights': 'Review statements, credit position, ageing, and customer activity.',
  'Parcels & Logistics': 'Review parcel registers, delivery results, and logistics performance.',
  'Consignments & Transfers': 'Monitor pending and acknowledged parcel transfers.',
  'Cashier & Shift': 'Review cashier sessions, revenue, and shift performance.',
  Inventory: 'Review inventory reports and stock-related performance.',
  'Audit & Compliance Reports':
    'Review user activity, changed records, deletions, and permissions.',
  'User Administration': 'Create users and manage active, inactive, and invited accounts.',
  'Role & Permission Governance': 'Control roles and what each role is allowed to do.',
  'IT Support Desk': 'Report a problem and follow support tickets to resolution.',
  'Platform Configuration': 'Manage company-wide operational settings and master locations.',
};

function normalizeTitle(value: string) {
  return value.trim().replaceAll(/\s+/g, ' ');
}

function slugify(value: string) {
  return value
    .toLocaleLowerCase()
    .replaceAll('&', 'and')
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/(^-|-$)/g, '');
}

function describePage(pageName: string, moduleName: string) {
  const name = pageName.toLocaleLowerCase();
  if (/create|add|record|new/.test(name))
    return `Add a new ${pageName.toLocaleLowerCase()} record.`;
  if (/approval/.test(name)) return `Review and decide items waiting for approval.`;
  if (/history|logs|trail|register|report|analytics|kpi|statement|summary/.test(name)) {
    return `Review ${pageName.toLocaleLowerCase()} information and past activity.`;
  }
  if (/setup|configuration|management|policy|routing/.test(name)) {
    return `Configure ${pageName.toLocaleLowerCase()} for ${moduleName}.`;
  }
  return `View and work with ${pageName.toLocaleLowerCase()} records.`;
}

function collectPages(items: NavigationItem[], moduleName: string): HelpModulePage[] {
  const pages: HelpModulePage[] = [];
  for (const item of items) {
    if (item.hiddenInSidebar) continue;
    const nested = [...(item.items ?? []), ...(item.children ?? [])];
    if (nested.length) {
      pages.push(...collectPages(nested, moduleName));
      continue;
    }
    if (!item.url || item.url === '/help') continue;
    const name = normalizeTitle(item.title);
    pages.push({ name, url: item.url, description: describePage(name, moduleName) });
  }
  return pages;
}

function createModuleGuide(groupName: string, item: NavigationItem): HelpGuide | null {
  const categoryId = CATEGORY_BY_GROUP[groupName];
  if (!categoryId) return null;
  const moduleName = normalizeTitle(item.title);
  const pages = collectPages([item], moduleName);
  const firstPage = pages[0];
  const summary = MODULE_SUMMARIES[moduleName] ?? `Learn how to use ${moduleName} in Vipex.`;

  return {
    id: `module-${slugify(groupName)}-${slugify(moduleName)}`,
    categoryId,
    title: `${moduleName} overview`,
    summary,
    keywords: [groupName, moduleName, ...pages.map((page) => page.name)],
    estimatedMinutes: Math.max(3, Math.ceil(pages.length / 5) + 2),
    pageName: firstPage ? moduleName : undefined,
    pageUrl: firstPage?.url,
    modulePages: pages,
    beforeYouStart: [
      'Sign in to Vipex with your normal work account.',
      'Your role determines which pages and actions you can see.',
      'Have the correct record details or approval information ready before making changes.',
    ],
    steps: [
      {
        title: `Open ${moduleName}`,
        description: `Use the main application sidebar to open ${groupName}, then select ${moduleName}. You can also use the page links listed in this guide.`,
      },
      {
        title: 'Choose the page for your task',
        description: pages.length
          ? `Read “Pages in this module” below and open the page that matches what you need to do.`
          : `Open the module from the application sidebar and choose the available operation for your role.`,
      },
      {
        title: 'Find or enter the correct information',
        description:
          'Use search and filters before editing. For a new record, complete every required field and check names, dates, amounts, branches, and reference numbers carefully.',
      },
      {
        title: 'Review before confirming',
        description:
          'Read the summary and status shown on screen, then use the named action button to save, submit, approve, or complete the operation.',
      },
    ],
    expectedResult: `Vipex confirms the action and shows the updated record or status in ${moduleName}.`,
    commonIssues: [
      {
        problem: 'I cannot see this module or page',
        solution:
          'Your account may not have the required role or permission. Ask your supervisor or system administrator to confirm your access.',
      },
      {
        problem: 'The action button is unavailable',
        solution:
          'Check that a record is selected, all required fields are complete, and the record is in the correct status for that action.',
      },
      {
        problem: 'My change did not appear',
        solution:
          'Wait a moment and refresh the list. If it is still missing, check for an error message and contact support with the record reference.',
      },
    ],
  };
}

export const APPLICATION_MODULE_GUIDES = ROUTES.flatMap((group) =>
  group.menu
    .map((item) => createModuleGuide(group.title, item))
    .filter((guide): guide is HelpGuide => Boolean(guide)),
);
