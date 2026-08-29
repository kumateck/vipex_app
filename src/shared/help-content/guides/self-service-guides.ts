import type { HelpGuide } from '../types';

export const SELF_SERVICE_GUIDES: HelpGuide[] = [
  {
    id: 'manage-self-service-booking-drafts',
    categoryId: 'operations',
    title: 'Claim and complete a self-service booking draft',
    summary:
      'Customers can start a booking themselves from a QR link. Claim their draft, fill in the remaining details, and complete it into a real parcel.',
    keywords: [
      'self-service',
      'self service booking',
      'booking draft',
      'QR',
      'customer booking',
      'claim draft',
    ],
    estimatedMinutes: 5,
    pageName: 'Self-Service Bookings',
    pageUrl: '/parcels/self-service',
    beforeYouStart: [
      'A draft only appears here after a customer submits it through the branch’s self-service QR link.',
      'Drafts expire after a short time if nobody claims and completes them, so work through the queue promptly.',
    ],
    steps: [
      {
        title: 'Open Self-Service Bookings',
        description:
          'Under Booking & Shipping, select Self-Service Bookings to see the queue of drafts customers have submitted at your branch.',
      },
      {
        title: 'Claim a draft',
        description:
          'Drafts waiting for an agent are marked New. Select Open on one to claim it — it becomes Claimed and locked to you so a colleague does not work on it at the same time.',
      },
      {
        title: 'Review what the customer entered',
        description:
          'Check the sender, receiver, and parcel details the customer typed themselves. Correct anything that looks wrong before continuing — customers can make entry mistakes.',
      },
      {
        title: 'Complete the remaining booking details',
        description:
          'Add what the customer could not set themselves: the destination branch and location, and the parcel charge or payment responsibility.',
      },
      {
        title: 'Complete the booking',
        description:
          'Review the full booking once more, then select Complete. This turns the draft into a normal parcel booking with a booking code and prints the usual receipt.',
      },
    ],
    expectedResult:
      'The draft becomes a confirmed parcel booking, appears in normal parcel search, and is removed from the self-service queue.',
    commonIssues: [
      {
        problem: 'A draft is missing from the queue.',
        solution:
          'Unclaimed drafts expire automatically after their time limit. Ask the customer to resubmit through the QR link, or create the booking manually with Create Parcel.',
      },
      {
        problem: 'A draft is claimed but nobody is completing it.',
        solution:
          'Open it yourself — claiming does not permanently block other agents from taking over a stalled draft. If unsure, check with the colleague shown as having claimed it.',
      },
      {
        problem: 'The customer entered a receiver number that looks wrong.',
        solution:
          'Do not complete the booking as-is. Contact the customer to confirm the correct number before completing it.',
      },
    ],
    relatedGuideIds: ['create-a-parcel', 'find-a-parcel'],
  },
];
