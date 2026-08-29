import type { HelpGuide } from '../types';

export const RECONCILIATION_GUIDES: HelpGuide[] = [
  {
    id: 'open-a-parcel-reconciliation-case',
    categoryId: 'operations',
    title: 'Open and resolve a parcel reconciliation case',
    summary:
      'Raise a case for a parcel that was booked, paid, or entered incorrectly, and follow it through approval and execution.',
    keywords: [
      'reconciliation',
      'reconciliation case',
      'shortage',
      'overage',
      'wrong amount',
      'duplicate entry',
      'void and refund',
      'correct amount in original shift',
      'amount correction',
    ],
    estimatedMinutes: 6,
    pageName: 'Reconciliation Cases',
    pageUrl: '/parcels/reconciliation-cases',
    beforeYouStart: [
      'Only raise a case for a genuine booking or payment problem — never to bypass the normal Create Parcel or payment flow.',
      'Have the parcel number and a clear description of what went wrong.',
    ],
    steps: [
      {
        title: 'Open Reconciliation Cases',
        description: 'Under Booking & Shipping, select Reconciliation Cases.',
      },
      {
        title: 'Create a new case',
        description:
          'Find the affected parcel and choose the case type that matches the problem: Shortage, Overage, Wrong Amount, Wrong Parcel Type, Double Entry, Customer Cancellation Before Delivery, or Data Entry Error.',
      },
      {
        title: 'Choose the correcting action',
        description:
          'Select the action that fixes it: Void and Refund, Void and Rebook, Void to Suspense, Correct Amount in Original Shift, Keep Original and Void Duplicate, or Merge to Single Record.',
        note: 'Correct Amount in Original Shift adjusts the figures inside the cashier session where the mistake happened, instead of creating a new transaction — pick the correct original session before submitting.',
      },
      {
        title: 'Submit for approval',
        description:
          'Submit the case with a clear explanation. A case starts as Requested and cannot affect any records until it is approved.',
      },
      {
        title: 'Track approval and execution',
        description:
          'A supervisor with case-approval permission reviews and approves or rejects it. Once approved, an authorised user executes it, moving the case to Executed.',
      },
    ],
    expectedResult:
      'The case moves from Requested to Approved to Executed, and the affected parcel or cashier session reflects the correction.',
    commonIssues: [
      {
        problem: 'I cannot see the option to approve or execute a case.',
        solution:
          'Approving and executing reconciliation cases each need their own permission. Ask a supervisor if you believe you should have this access.',
      },
      {
        problem: 'Correct Amount in Original Shift has no session to pick.',
        solution:
          'This action needs an open or recent cashier session tied to the original transaction. If none is available, use a different action or contact support.',
      },
      {
        problem: 'A case was rejected.',
        solution:
          'Read the rejection reason, correct the case details, and resubmit — do not try to fix the parcel outside the reconciliation process.',
      },
    ],
    relatedGuideIds: ['find-a-parcel', 'record-sender-payment', 'close-cashier-session'],
  },
];
