import type { HelpGuide } from '../../types/help-guide.types';

export const COMMUNICATION_GUIDES: HelpGuide[] = [
  {
    id: 'send-a-team-message',
    categoryId: 'workspace',
    title: 'Send a message in Team Chat',
    summary:
      'Find the right conversation, send a clear work message, and attach a file when necessary.',
    keywords: ['chat', 'message', 'conversation', 'attachment', 'team'],
    estimatedMinutes: 3,
    pageName: 'Team Chat',
    pageUrl: '/communication/chat',
    beforeYouStart: [
      'Know the person or team that should receive the message.',
      'Do not send passwords, customer payment details, or other sensitive information in chat.',
    ],
    steps: [
      {
        title: 'Open Team Chat',
        description: 'Under Internal Communication, select Team Chat.',
      },
      {
        title: 'Open the correct conversation',
        description:
          'Search for the person or choose the correct team conversation. Read the conversation title before sending anything.',
      },
      {
        title: 'Write a clear message',
        description:
          'State what happened, the record or parcel number when relevant, and the action you need. Keep the message respectful and work-related.',
      },
      {
        title: 'Attach only necessary files',
        description:
          'Use the attachment control when a photo or document is needed. Check that you selected the correct file.',
      },
      {
        title: 'Send once',
        description:
          'Review the message and select Send. Wait for it to appear in the conversation before trying again.',
      },
    ],
    expectedResult:
      'The message appears in the correct conversation for the intended recipient or team.',
    commonIssues: [
      {
        problem: 'The message was sent to the wrong conversation.',
        solution:
          'Notify the recipient immediately and avoid repeating sensitive information. Follow company policy for correcting the mistake.',
      },
      {
        problem: 'An attachment will not upload.',
        solution:
          'Check the file size and type, then try once more. If it still fails, create a support ticket with the error message.',
      },
    ],
    relatedGuideIds: ['create-support-ticket', 'basic-troubleshooting'],
  },
];
