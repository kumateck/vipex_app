import type { HelpGuide } from '../types';

export const RIDER_OPERATIONS_GUIDES: HelpGuide[] = [
  {
    id: 'review-rider-delivery-change-requests',
    categoryId: 'operations',
    title: 'Review a rider’s delivery change request',
    summary:
      'Approve or decline a rider’s request to change an active delivery before they confirm handover, and manage parcels a rider returns to the office.',
    keywords: [
      'delivery change request',
      'rider handover',
      'return to office',
      'rider workforce',
      'change of address',
    ],
    estimatedMinutes: 4,
    pageName: 'Current Deliveries',
    pageUrl: '/parcels/rider/current',
    beforeYouStart: [
      'A change request only appears when the assigned rider has raised one from the mobile app, for example because the delivery address is wrong or unreachable.',
      'Do not approve a change without confirming it with the customer where the change affects the receiver or destination.',
    ],
    steps: [
      {
        title: 'Open the delivery with a pending request',
        description:
          'Under Rider Workforce, open Current Deliveries and find the parcel flagged with a pending change request, or open it directly from Super Search.',
      },
      {
        title: 'Read the rider’s reason',
        description: 'Check the reason the rider gave for the requested change before deciding.',
      },
      {
        title: 'Approve or decline the request',
        description:
          'Approve it if the change is legitimate and confirmed where needed, or decline it and tell the rider to proceed with the original delivery details.',
      },
      {
        title: 'Handle a parcel the rider returns',
        description:
          'If a rider cannot complete a delivery, they can return the parcel to the office from Current Deliveries. Use Return to Office to record it and take the parcel out of that rider’s active list.',
      },
    ],
    expectedResult:
      'The delivery change request is resolved (approved or declined) and the rider’s app reflects the decision, or a returned parcel is removed from the rider’s current deliveries and available for reassignment.',
    commonIssues: [
      {
        problem:
          'No pending change request is visible even though the rider says they submitted one.',
        solution:
          'Ask the rider to confirm the parcel number and that the request was actually sent, then refresh the list. If it still does not appear, escalate to support.',
      },
      {
        problem: 'I approved a change but the rider’s app still shows the old details.',
        solution:
          'The rider may need to refresh their app or regain network connection. Confirm with them directly before assuming the update failed.',
      },
    ],
    relatedGuideIds: ['find-a-parcel'],
  },
];
