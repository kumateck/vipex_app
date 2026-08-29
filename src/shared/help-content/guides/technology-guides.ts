import type { HelpGuide } from '../types';

export const TECHNOLOGY_GUIDES: HelpGuide[] = [
  {
    id: 'set-a-users-password',
    categoryId: 'technology',
    title: 'Set a user’s password (System Admin only)',
    summary:
      'Directly set a new password for a user who is locked out or cannot complete their own password reset.',
    keywords: [
      'set user password',
      'password management',
      'system admin',
      'reset password',
      'locked out',
    ],
    estimatedMinutes: 2,
    pageName: 'Set User Password',
    pageUrl: '/users/password-management',
    beforeYouStart: [
      'This page is only visible to accounts with the System Admin role — it cannot be granted to any other role.',
      'Confirm the user’s identity before changing their password; never do this on request from an unverified email or chat message.',
    ],
    steps: [
      {
        title: 'Open Set User Password',
        description: 'Under User Administration, select Set User Password.',
      },
      {
        title: 'Search for and select the user',
        description: 'Search and select the exact user account you intend to change.',
      },
      {
        title: 'Enter the new password twice',
        description:
          'Type the new password, then type it again in Confirm password. Both must match exactly.',
      },
      {
        title: 'Save and tell the user',
        description:
          'Save the change, then tell the user their new password through a channel you trust. Ask them to sign in and change it to something only they know.',
        note: 'Setting a password here bypasses the user’s own current password — use it only for genuine account-recovery cases.',
      },
    ],
    expectedResult: 'The selected user can sign in immediately with the new password.',
    commonIssues: [
      {
        problem: 'I cannot see Set User Password at all.',
        solution:
          'This page is restricted to the System Admin role by design. Ask whoever holds System Admin access to perform the change or grant that role.',
      },
      {
        problem: 'The user still cannot sign in after the change.',
        solution:
          'Confirm they are using the exact new password with no extra spaces, and that their account is active, not inactive or invited-only.',
      },
    ],
    relatedGuideIds: ['change-your-password', 'create-support-ticket'],
  },
];
