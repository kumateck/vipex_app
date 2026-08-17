import type { HelpGuide } from '../../types/help-guide.types';

export const GETTING_STARTED_GUIDES: HelpGuide[] = [
  {
    id: 'sign-in-and-open-dashboard',
    categoryId: 'workspace',
    title: 'Sign in and open your dashboard',
    summary:
      'Learn how to enter the app safely and confirm that you are using the correct account.',
    keywords: ['login', 'sign in', 'password', 'dashboard', 'account'],
    estimatedMinutes: 2,
    pageName: 'Dashboard',
    pageUrl: '/dashboard',
    beforeYouStart: [
      'Use the email address or telephone number registered for your account.',
      'Keep your password private. Support staff should never ask you to reveal it.',
    ],
    steps: [
      {
        title: 'Enter your account details',
        description:
          'On the sign-in screen, enter your registered email or telephone number and your password.',
      },
      {
        title: 'Select Sign in',
        description:
          'Wait for the app to confirm your details. Do not select the button repeatedly.',
      },
      {
        title: 'Confirm your workplace',
        description:
          'Check the name and branch shown in the top-right corner. This confirms the account and workplace you are using.',
      },
      {
        title: 'Use your dashboard',
        description:
          'Your dashboard shows shortcuts and information available for your role. The left menu contains the operations you are allowed to perform.',
      },
    ],
    expectedResult:
      'You are signed in and can see your dashboard, workplace, and permitted menu items.',
    commonIssues: [
      {
        problem: 'The app says the password is incorrect.',
        solution:
          'Check Caps Lock, re-enter the password carefully, or use Forgot password. Do not keep guessing many times.',
      },
      {
        problem: 'A menu item mentioned by a colleague is missing.',
        solution:
          'Menus depend on your role. Ask your supervisor to confirm that the operation is part of your assigned duties.',
      },
    ],
    relatedGuideIds: ['find-an-operation', 'change-your-password'],
  },
  {
    id: 'find-an-operation',
    categoryId: 'workspace',
    title: 'Find the operation you need',
    summary: 'Use the left menu and page names to quickly reach the correct operation.',
    keywords: ['menu', 'navigation', 'find page', 'sidebar', 'operation'],
    estimatedMinutes: 2,
    beforeYouStart: [
      'Know the result you want, for example “receive a parcel” or “request leave”.',
    ],
    steps: [
      {
        title: 'Choose the work area',
        description:
          'Look at the main sections in the left menu, such as Operations, Finance, Human Capital, or Technology.',
      },
      {
        title: 'Open the matching group',
        description:
          'Select the group whose name is closest to your task. For example, parcel receiving tasks are under Parcel Receiving.',
      },
      {
        title: 'Select the operation',
        description:
          'Choose the page named after the action you want to take, such as Create Parcel, Scan to Receive, or Leave Requests.',
      },
      {
        title: 'Check the page title',
        description:
          'Before entering information, confirm that the page title matches the task you intended to perform.',
      },
    ],
    expectedResult: 'The correct operation page is open and ready for you to work.',
    commonIssues: [
      {
        problem: 'The left menu is too narrow or hidden.',
        solution: 'Select the menu button near the top-left of the work area to expand it.',
      },
      {
        problem: 'You cannot find the operation.',
        solution:
          'Search this Help Center by the action you want. If the operation is still missing, it may not be available to your role.',
      },
    ],
    relatedGuideIds: ['sign-in-and-open-dashboard', 'create-support-ticket'],
  },
  {
    id: 'change-your-password',
    categoryId: 'workspace',
    title: 'Change your password safely',
    summary: 'Replace your current password without sharing it with anyone.',
    keywords: ['password', 'security', 'change password', 'account'],
    estimatedMinutes: 3,
    pageName: 'Change Password',
    pageUrl: '/settings/change-password',
    beforeYouStart: [
      'Know your current password.',
      'Choose a new password that is difficult for other people to guess.',
    ],
    steps: [
      {
        title: 'Open Change Password',
        description: 'Open your account or settings area, then select Change Password.',
      },
      {
        title: 'Enter the current password',
        description:
          'Type the password you use now. This confirms that the account belongs to you.',
      },
      {
        title: 'Enter the new password twice',
        description:
          'Type the new password, then type it again exactly the same way in the confirmation field.',
      },
      {
        title: 'Save the change',
        description: 'Select the save button once and wait for the success message.',
        note: 'Do not write your password on a desk, parcel, receipt, or shared notebook.',
      },
    ],
    expectedResult: 'The new password is saved and will be required the next time you sign in.',
    commonIssues: [
      {
        problem: 'The two new passwords do not match.',
        solution:
          'Clear both new-password fields and type the same password carefully in each one.',
      },
      {
        problem: 'You cannot remember the current password.',
        solution:
          'Sign out and use Forgot password, or contact support if you cannot access your registered email.',
      },
    ],
    relatedGuideIds: ['sign-in-and-open-dashboard', 'create-support-ticket'],
  },
];
