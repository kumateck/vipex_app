import type { HelpGuide } from '../types';

export const OTP_GUIDES: HelpGuide[] = [
  {
    id: 'verify-pickup-and-receiver-otp',
    categoryId: 'operations',
    title: 'Verify a handover with pickup or receiver OTP',
    summary:
      'Send and verify a one-time code before handing a sender-paid parcel to its receiver, or before completing a receiver-pay delivery.',
    keywords: [
      'OTP',
      'one-time code',
      'pickup otp',
      'receiver otp',
      'phone 1',
      'phone 2',
      'verification code',
    ],
    estimatedMinutes: 3,
    pageName: 'Waiting Pickup',
    pageUrl: '/parcels/waiting-pickup',
    beforeYouStart: [
      'OTP verification only appears when the destination branch has it turned on for that handover type.',
      'Have the receiver present, or reachable on the phone number the code will be sent to.',
    ],
    steps: [
      {
        title: 'Start the handover',
        description:
          'On Waiting Pickup (sender-paid parcels) or the receiver payment screen for a delivery, select the parcel and begin the handover or payment action.',
      },
      {
        title: 'Choose which number gets the code',
        description:
          'If the receiver has two numbers on file, choose Phone 1 or Phone 2 before sending the code — send it to whichever number the receiver can actually access right now.',
      },
      {
        title: 'Send and collect the code',
        description:
          'Send the OTP and ask the receiver to read it back to you. Do not accept a code relayed through a third person you cannot verify.',
      },
      {
        title: 'Enter the code to confirm',
        description:
          'Type the code exactly as given and confirm. The parcel only completes handover or payment once the code is verified.',
      },
    ],
    expectedResult:
      'The code is verified and the handover or receiver payment completes normally, with the OTP check recorded against the parcel.',
    commonIssues: [
      {
        problem: 'No OTP step appears for this destination branch.',
        solution:
          'That branch has pickup or receiver OTP turned off. This is expected for branches configured that way — do not try to force a code entry.',
      },
      {
        problem: 'A warning says OTP is disabled for this branch.',
        solution:
          'This confirms the destination branch has switched the requirement off. Continue the handover normally, but mention it to a supervisor if you did not expect it.',
      },
      {
        problem: 'The receiver did not get the code.',
        solution:
          'Confirm the correct number was selected (Phone 1 or Phone 2) and resend. If delivery still fails, use the other number if one is available.',
      },
    ],
    relatedGuideIds: ['configure-branch-otp-requirements', 'find-a-parcel'],
  },
  {
    id: 'configure-branch-otp-requirements',
    categoryId: 'technology',
    title: 'Configure a branch’s handover OTP requirements',
    summary:
      'Turn pickup OTP and receiver OTP on or off for a specific branch, alongside its pickup queue setting.',
    keywords: [
      'branch settings',
      'require pickup otp',
      'require receiver otp',
      'use pickup queue',
      'branch management',
      'otp toggle',
    ],
    estimatedMinutes: 3,
    pageName: 'Branch Management',
    pageUrl: '/branches',
    beforeYouStart: [
      'Both OTP requirements default to on for every branch — only change them for a considered operational reason.',
      'Turning a requirement off affects every future handover at that branch, not a single parcel.',
    ],
    steps: [
      {
        title: 'Open Branch Management',
        description: 'Under Platform Configuration, select Branch Management and find the branch.',
      },
      {
        title: 'Open the branch’s operations settings',
        description:
          'Edit the branch and locate its operations section, which lists Use pickup queue, Require pickup OTP, and Require receiver OTP.',
      },
      {
        title: 'Set pickup and receiver OTP',
        description:
          'Require pickup OTP verifies a code before handing over sender-paid parcels at this branch. Require receiver OTP verifies a code before receiver payment and handover. Check or uncheck each independently.',
      },
      {
        title: 'Save the branch',
        description:
          'Save the change. Staff at this branch will immediately stop or start seeing the corresponding OTP step during handover.',
      },
    ],
    expectedResult:
      'The branch’s handover screens match the saved settings — an OTP step appears only for the toggles left checked.',
    commonIssues: [
      {
        problem: 'Staff report an OTP step disappeared after a change here.',
        solution:
          'This is expected once a requirement is switched off. Confirm the change was intentional before re-enabling it.',
      },
      {
        problem: 'I cannot find the operations settings on the branch form.',
        solution:
          'Confirm you are editing the branch itself, not a location under it, and that your role includes branch management access.',
      },
    ],
    relatedGuideIds: ['verify-pickup-and-receiver-otp'],
  },
];
