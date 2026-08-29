import type { HelpGuide } from '../types';

export const AI_GUIDES: HelpGuide[] = [
  {
    id: 'use-ai-insights-chat',
    categoryId: 'workspace',
    title: 'Ask AI Insights Chat about your operation',
    summary:
      'Ask questions in plain language about parcels, cashier sessions, fleet, and other operational data.',
    keywords: ['AI insights chat', 'ai chat', 'ask ai', 'llm', 'insights'],
    estimatedMinutes: 3,
    pageName: 'AI Insights Chat',
    pageUrl: '/ai-chat',
    beforeYouStart: [
      'AI Insights Chat can only see data your account already has permission to view.',
      'Treat its answers as a starting point, not a final source of truth — always confirm a figure against the actual page before acting on it.',
    ],
    steps: [
      {
        title: 'Open AI Insights Chat',
        description: 'Under Workspace, select AI Insights Chat.',
      },
      {
        title: 'Ask a specific question',
        description:
          'Ask about a specific thing — a date range, a branch, a metric — rather than a vague question. Specific questions get more useful answers.',
      },
      {
        title: 'Review any tool steps shown',
        description:
          'When the assistant looks something up, it shows the steps it took inline. Check that it queried the area you actually asked about.',
      },
      {
        title: 'Verify before you rely on the answer',
        description:
          'For anything you will act on — a report, a decision, a number you will repeat to someone else — open the real page and confirm the figure.',
      },
    ],
    expectedResult:
      'You get a plain-language answer about your operational data, grounded in the same records the application shows on its normal pages.',
    commonIssues: [
      {
        problem: 'The assistant says it cannot find or access something.',
        solution:
          'It only sees what your role can see. If you believe you should have access, ask a supervisor rather than rephrasing the question repeatedly.',
      },
      {
        problem: 'A figure in the chat does not match the report page.',
        solution:
          'Trust the report page. Note the exact question you asked and report the mismatch through IT support so it can be checked.',
      },
    ],
    relatedGuideIds: ['use-ai-daily-briefs', 'create-support-ticket'],
  },
  {
    id: 'use-ai-daily-briefs',
    categoryId: 'workspace',
    title: 'Read the AI daily briefs on your dashboard',
    summary:
      'Generate a short AI-written summary of exceptions, anomalies, or the overall business, shown alongside the real figures on your dashboard.',
    keywords: [
      'ai brief',
      'management daily brief',
      'operations exceptions brief',
      'fleet anomaly brief',
      'dashboard',
    ],
    estimatedMinutes: 2,
    pageName: 'Dashboard',
    pageUrl: '/dashboard',
    beforeYouStart: [
      'Briefs are generated on request, not automatically refreshed — generate a new one if the data has since changed.',
      'Every brief explicitly states it is not an authoritative report.',
    ],
    steps: [
      {
        title: 'Find the brief panel for your role',
        description:
          'Depending on your dashboard, you may see the AI Management Daily Brief, AI Operations Exceptions Brief, or AI Fleet Anomaly Brief.',
      },
      {
        title: 'Generate the brief',
        description:
          'Select Generate. The assistant reads the same figures already shown in the cards on that dashboard and writes a short summary.',
      },
      {
        title: 'Spot-check the figures it cites',
        description:
          'Every number the brief mentions also appears in the cards above it — compare before repeating a figure from the brief elsewhere.',
      },
      {
        title: 'Note stale sections',
        description:
          'The Management Daily Brief marks any section built from data older than 48 hours as stale — treat those sections with extra caution.',
      },
    ],
    expectedResult:
      'A short written summary appears, highlighting what most needs your attention, backed by the figures already on the dashboard.',
    commonIssues: [
      {
        problem: 'The brief says it is not available right now.',
        solution:
          'The cards above the brief panel are still accurate on their own — use those, and try generating the brief again shortly.',
      },
      {
        problem: 'The brief and the dashboard cards seem to disagree.',
        solution:
          'The dashboard cards are the authoritative figures. Generate a fresh brief; if the disagreement continues, report it to IT support.',
      },
    ],
    relatedGuideIds: ['use-ai-insights-chat'],
  },
];
