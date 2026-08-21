import type { HelpGuide } from '../types';

export const FAQ_GUIDES: HelpGuide[] = [
  {
    id: 'faq-cashier-daily-sales',
    categoryId: 'faq',
    title: 'Where do I find my daily sales and the parcels I worked on as a cashier?',
    summary:
      'Go to Insights → Cashier & Shift → Shift Sessions. It shows both your daily sales totals and every parcel payment you processed.',
    keywords: [
      'daily sales',
      'cashier',
      'shift',
      'revenue',
      'parcels worked on',
      'transactions',
      'shift sessions',
    ],
    estimatedMinutes: 1,
    pageName: 'Shift Sessions',
    pageUrl: '/reports/cashier/shifts',
    beforeYouStart: [],
    steps: [
      {
        title: 'Open Shift Sessions',
        description:
          'Under Insights → Cashier & Shift, select Shift Sessions, then filter by date and your cashier account.',
      },
      {
        title: 'Read the summary for daily sales',
        description: 'The summary section shows your total sales figures for the selected date.',
      },
      {
        title: 'Read the transactions table for parcels worked on',
        description:
          'The transactions table lists every payment you processed, each with a booking code, payer, payment method, and amount — this is the full list of parcels you handled that day.',
      },
    ],
    expectedResult:
      'You can see your daily sales totals and the complete list of parcels you processed payments for on the selected date.',
    commonIssues: [
      {
        problem: 'Shift Sessions is missing from the menu.',
        solution:
          'This page requires the report-viewing permission for cashier shifts. Ask a supervisor to confirm your role includes it.',
      },
    ],
    relatedGuideIds: ['open-cashier-session', 'close-cashier-session', 'record-sender-payment'],
  },
  {
    id: 'faq-missing-menu-item',
    categoryId: 'faq',
    title: 'Why can’t I see a page or menu item I need?',
    summary:
      'Menu items depend on your assigned role and permissions. If something is missing, your role likely does not include it yet.',
    keywords: ['permission', 'access', 'missing menu', 'cannot see', 'role'],
    estimatedMinutes: 1,
    beforeYouStart: [],
    steps: [
      {
        title: 'Confirm what you expected to see',
        description:
          'Note the exact menu group and page name a colleague mentioned, so you can ask about the same thing.',
      },
      {
        title: 'Ask your supervisor to check your role',
        description:
          'Only a supervisor or system administrator can grant the permission needed to see that page.',
      },
    ],
    expectedResult:
      'You know whether the page is genuinely part of your duties, and if so, your access is updated.',
    commonIssues: [],
    relatedGuideIds: ['find-an-operation', 'create-support-ticket'],
  },
  {
    id: 'faq-receipt-not-printing',
    categoryId: 'faq',
    title: 'A payment or booking succeeded but nothing printed. What do I do?',
    summary:
      'Confirm the record was actually saved first, then check the printer — do not repeat the payment or booking.',
    keywords: ['print', 'receipt', 'printer', 'not printing', 'waybill'],
    estimatedMinutes: 1,
    beforeYouStart: [],
    steps: [
      {
        title: 'Confirm the record was saved',
        description:
          'Search for the parcel or payment before trying anything else. Printing is a separate step from saving.',
      },
      {
        title: 'Check the printer, not the record',
        description:
          'Confirm the correct printer is selected and connected. If it still fails, create a support ticket instead of repeating the transaction.',
      },
    ],
    expectedResult: 'You avoid duplicate transactions and get the receipt or document printed.',
    commonIssues: [],
    relatedGuideIds: ['basic-troubleshooting', 'create-support-ticket'],
  },
];
