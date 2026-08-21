import type { HelpGuide } from '../types';

export const PEOPLE_GUIDES: HelpGuide[] = [
  {
    id: 'request-leave',
    categoryId: 'human-capital',
    title: 'Request leave and follow its progress',
    summary:
      'Submit the correct leave type and dates, then check whether it is pending, approved, or rejected.',
    keywords: ['leave', 'annual leave', 'request', 'approval', 'absence'],
    estimatedMinutes: 4,
    pageName: 'Leave Requests',
    pageUrl: '/hr/leave/requests',
    beforeYouStart: [
      'Know the first and last day you will be away.',
      'Choose the correct leave type and prepare any required supporting document.',
    ],
    steps: [
      {
        title: 'Open Leave Requests',
        description: 'Under Human Capital and Leave Management, select Leave Requests.',
      },
      {
        title: 'Select the add or new-request button',
        description:
          'Open the leave request form. If you manage other employees, confirm the correct employee before continuing.',
      },
      {
        title: 'Choose the leave type',
        description:
          'Select the reason that accurately describes the absence, such as annual, sick, or bereavement leave.',
      },
      {
        title: 'Select the dates',
        description:
          'Choose the start and end dates carefully. Review the number of leave days calculated by the app.',
      },
      {
        title: 'Add a clear reason',
        description:
          'Provide a short, respectful explanation and attach supporting information when required by company policy.',
      },
      {
        title: 'Submit and wait for approval',
        description:
          'Select Submit once. Return to Leave Requests or Leave History to check the status; submission does not automatically mean approval.',
      },
    ],
    expectedResult:
      'The request appears in the list with a status such as Pending, Approved, or Rejected.',
    commonIssues: [
      {
        problem: 'The requested dates are not accepted.',
        solution:
          'Check that the end date is not before the start date and that the leave type allows the required notice period.',
      },
      {
        problem: 'The request is still pending.',
        solution:
          'Pending means it has not yet been decided. Contact your reporting officer rather than submitting a duplicate request.',
      },
    ],
    relatedGuideIds: ['find-an-operation', 'create-support-ticket'],
  },
];
