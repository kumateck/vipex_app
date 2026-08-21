import type { HelpGuide } from '../types';

export const SUPPORT_GUIDES: HelpGuide[] = [
  {
    id: 'basic-troubleshooting',
    categoryId: 'support',
    title: 'Try these safe checks when something is not working',
    summary: 'Use simple checks that do not risk changing or duplicating business records.',
    keywords: ['problem', 'error', 'not working', 'refresh', 'internet', 'printer'],
    estimatedMinutes: 3,
    beforeYouStart: [
      'Write down the exact action you were taking and any message shown on screen.',
    ],
    steps: [
      {
        title: 'Stop repeated clicking',
        description:
          'If a save, payment, or create action is processing, wait. Repeated clicking can create confusion or duplicate attempts.',
      },
      {
        title: 'Check whether the action succeeded',
        description:
          'Search for the record or return to its list before trying again. A delayed message does not always mean the action failed.',
      },
      {
        title: 'Read the full message',
        description:
          'Look for a red message, highlighted field, or instruction. Copy the wording or take a screenshot without exposing passwords.',
      },
      {
        title: 'Check the connection',
        description:
          'Confirm that the computer is connected to the internet and that other app pages can open.',
      },
      {
        title: 'Refresh only when safe',
        description:
          'Refresh a list or search page when needed. Avoid refreshing a payment or create form while it is submitting.',
      },
      {
        title: 'Ask support with useful details',
        description:
          'If the problem remains, create a ticket with the page name, time, record number, exact message, and a safe screenshot.',
      },
    ],
    expectedResult:
      'You either complete the operation safely or collect enough information for support to help quickly.',
    commonIssues: [
      {
        problem: 'The same error returns after refreshing.',
        solution:
          'Stop retrying and create a support ticket. Include the exact error and what you already tried.',
      },
      {
        problem: 'You are unsure whether a payment or parcel was created.',
        solution:
          'Search for the record or check the relevant list. Do not repeat the transaction until its status is confirmed.',
      },
    ],
    relatedGuideIds: ['create-support-ticket', 'find-a-parcel'],
  },
  {
    id: 'create-support-ticket',
    categoryId: 'support',
    title: 'Create a useful IT support ticket',
    summary: 'Report a problem with the details support needs to understand and resolve it.',
    keywords: ['support', 'ticket', 'report issue', 'error', 'help desk'],
    estimatedMinutes: 4,
    pageName: 'Create Ticket',
    pageUrl: '/it-support/tickets/new',
    beforeYouStart: [
      'Note the page name, time, record number, and exact error message.',
      'Take a screenshot when useful, but never include a password or secret code.',
    ],
    steps: [
      {
        title: 'Open Create Ticket',
        description: 'Under IT Support Desk, select Create Ticket.',
      },
      {
        title: 'Use a clear subject',
        description:
          'Summarize the problem and operation, for example “Cannot print receipt after parcel creation”. Avoid subjects such as “Urgent” or “Not working” without context.',
      },
      {
        title: 'Describe what you were doing',
        description:
          'State the page, the action, the record or parcel number, and what you expected to happen.',
      },
      {
        title: 'Include what actually happened',
        description:
          'Copy the exact message and state whether the record was created, payment was taken, or printing failed.',
      },
      {
        title: 'Attach safe evidence',
        description:
          'Add a screenshot or document when it helps. Hide passwords, personal financial information, and any secret codes.',
      },
      {
        title: 'Select the correct priority and submit',
        description:
          'Use urgent priority only when work is seriously blocked or there is a security or financial risk. Submit once and keep the ticket number.',
      },
    ],
    expectedResult:
      'The ticket is created with a reference number and can be followed under Tickets.',
    commonIssues: [
      {
        problem: 'Support asks for more information.',
        solution:
          'Reply on the same ticket with the requested details. Do not create another ticket for the same problem.',
      },
      {
        problem: 'The problem affects several users.',
        solution:
          'Mention the affected users or branches in one clear ticket instead of asking everyone to submit duplicates.',
      },
    ],
    relatedGuideIds: ['basic-troubleshooting', 'send-a-team-message'],
  },
];
