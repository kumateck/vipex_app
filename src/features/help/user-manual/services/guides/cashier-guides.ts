import type { HelpGuide } from '../../types/help-guide.types';

export const CASHIER_GUIDES: HelpGuide[] = [
  {
    id: 'open-cashier-session',
    categoryId: 'finance',
    title: 'Open your cashier session',
    summary: 'Start a controlled cashier session before receiving or recording payments.',
    keywords: ['cashier', 'open session', 'float', 'shift', 'start work'],
    estimatedMinutes: 3,
    pageName: 'Open Session',
    pageUrl: '/cashier/sessions/open',
    beforeYouStart: [
      'Count your opening cash or float before entering it.',
      'Confirm that you are signed in to your own account and correct branch.',
    ],
    steps: [
      {
        title: 'Open the session page',
        description: 'Under Cashier Session Management, select Open Session.',
      },
      {
        title: 'Check for an existing session',
        description:
          'If the app shows that you already have an active session, do not open another one. Continue with the active session or speak to your supervisor.',
      },
      {
        title: 'Enter the opening amount',
        description:
          'Enter the cash or float you counted. Use the amount actually handed to you, not an expected amount.',
      },
      {
        title: 'Review and open',
        description: 'Confirm the branch and amount, then select Open Session once.',
      },
    ],
    expectedResult:
      'An active cashier session is created under your name and is ready to record payments.',
    commonIssues: [
      {
        problem: 'The opening amount is different from the cash received.',
        solution:
          'Do not open the session. Count again with your supervisor and enter the confirmed amount.',
      },
      {
        problem: 'The app says an active session already exists.',
        solution:
          'Open Active Sessions and verify it. Never create a second session to bypass the warning.',
      },
    ],
    relatedGuideIds: ['record-sender-payment', 'close-cashier-session'],
  },
  {
    id: 'record-sender-payment',
    categoryId: 'finance',
    title: 'Record a sender payment',
    summary:
      'Find an unpaid sender parcel, confirm the amount, record payment, and issue the correct receipt.',
    keywords: ['sender payment', 'cash', 'momo', 'receipt', 'paid parcel'],
    estimatedMinutes: 5,
    pageName: 'Sender Payments',
    pageUrl: '/parcels/sender-payments',
    beforeYouStart: [
      'Your cashier session must be open.',
      'Have the parcel number and confirm the customer making the payment.',
      'Count cash or confirm mobile money before marking a payment as completed.',
    ],
    steps: [
      {
        title: 'Open Sender Payments',
        description: 'Under Booking & Shipping, select Sender Payments.',
      },
      {
        title: 'Find the parcel',
        description:
          'Search with the parcel number and confirm the sender, receiver, destination, and amount.',
      },
      {
        title: 'Choose the payment method',
        description:
          'Select the method actually used by the customer. Do not select mobile money for cash or cash for a transfer.',
      },
      {
        title: 'Confirm that funds were received',
        description:
          'Count cash in front of the customer or verify the successful electronic payment before continuing.',
        note: 'A customer’s screenshot is not the same as a confirmed payment in the approved channel.',
      },
      {
        title: 'Record the payment',
        description:
          'Select the payment action once and wait for a success message. Do not refresh or repeat the payment while it is processing.',
      },
      {
        title: 'Issue the receipt',
        description:
          'Print or provide the generated paid receipt and return any correct change to the customer.',
      },
    ],
    expectedResult:
      'The parcel shows the sender payment as completed and a paid receipt is available.',
    commonIssues: [
      {
        problem: 'The parcel cannot be found on Sender Payments.',
        solution:
          'Use Super Search to confirm the parcel number and whether the sender is responsible for payment.',
      },
      {
        problem: 'The payment was recorded with the wrong method.',
        solution:
          'Do not record another payment. Inform a supervisor immediately so the approved correction process can be followed.',
      },
    ],
    relatedGuideIds: ['open-cashier-session', 'find-a-parcel', 'close-cashier-session'],
  },
  {
    id: 'close-cashier-session',
    categoryId: 'finance',
    title: 'Close your cashier session',
    summary:
      'Count your funds, compare them with the system total, and submit the session for closure.',
    keywords: ['close session', 'cash count', 'variance', 'end shift', 'cashier'],
    estimatedMinutes: 5,
    pageName: 'Close Session',
    pageUrl: '/cashier/sessions/close',
    beforeYouStart: [
      'Finish all customer transactions before beginning the closing count.',
      'Separate cash by denomination and have electronic-payment confirmations available.',
    ],
    steps: [
      {
        title: 'Open Close Session',
        description: 'Under Cashier Session Management, select Close Session.',
      },
      {
        title: 'Review the session summary',
        description:
          'Check opening float, payments, refunds or adjustments, and the expected closing balance.',
      },
      {
        title: 'Count actual cash',
        description:
          'Count the cash physically present. Count again before entering the closing amount.',
      },
      {
        title: 'Enter the actual amount',
        description:
          'Enter what you counted, even when it differs from the system expectation. Never change the number simply to remove a variance.',
      },
      {
        title: 'Explain any difference',
        description:
          'If the app shows an overage or shortage, recheck transactions and provide a clear explanation where required.',
      },
      {
        title: 'Submit the closure',
        description:
          'Review the final figures with your supervisor when required, then select Close Session once.',
      },
    ],
    expectedResult:
      'The cashier session is closed with an accurate count and any variance recorded for review.',
    commonIssues: [
      {
        problem: 'The cash count does not match the expected amount.',
        solution:
          'Count again, check change given, and compare recorded payments. Report the true amount and variance; do not hide it.',
      },
      {
        problem: 'A customer transaction is still pending.',
        solution: 'Resolve or formally cancel the pending transaction before closing the session.',
      },
    ],
    relatedGuideIds: ['open-cashier-session', 'record-sender-payment', 'create-support-ticket'],
  },
];
