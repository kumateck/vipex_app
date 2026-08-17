import type { HelpGuide } from '../../types/help-guide.types';

export const PARCEL_GUIDES: HelpGuide[] = [
  {
    id: 'create-a-parcel',
    categoryId: 'operations',
    title: 'Create a parcel booking',
    summary:
      'Record the sender, receiver, parcel details, destination, and payment responsibility correctly.',
    keywords: ['create parcel', 'booking', 'sender', 'receiver', 'destination', 'waybill'],
    estimatedMinutes: 6,
    pageName: 'Create Parcel',
    pageUrl: '/parcels/create',
    beforeYouStart: [
      'Have the sender’s and receiver’s correct names and telephone numbers.',
      'Confirm the destination branch and what is inside the parcel.',
      'Confirm who will pay: the sender now or the receiver later.',
    ],
    steps: [
      {
        title: 'Open Create Parcel',
        description:
          'From Booking & Shipping, select Create Parcel. Confirm the page title before entering information.',
      },
      {
        title: 'Enter sender details',
        description:
          'Search for an existing sender first. If no correct match exists, enter the sender’s full name and reachable telephone number.',
      },
      {
        title: 'Enter receiver details',
        description:
          'Enter the receiver’s full name and telephone number. Read the number back to the sender to confirm it.',
        note: 'A wrong receiver number can delay notification and collection.',
      },
      {
        title: 'Choose the destination',
        description:
          'Select the branch and location where the receiver will collect the parcel, or the correct delivery option when available.',
      },
      {
        title: 'Describe the parcel',
        description:
          'Enter a clear description, quantity, weight or size information, and any other required details. Do not use vague words such as “items” when a clearer description is possible.',
      },
      {
        title: 'Confirm payment responsibility',
        description:
          'Choose whether the sender is paying now or the receiver will pay. Confirm the amount with the customer before continuing.',
      },
      {
        title: 'Review and create',
        description:
          'Review names, telephone numbers, destination, contents, and payment choice. Select Create only once, then wait for confirmation and printing.',
      },
    ],
    expectedResult:
      'The booking is created with a parcel number, and the correct receipt or acknowledgement document is ready to print.',
    commonIssues: [
      {
        problem: 'The Create button is unavailable.',
        solution:
          'Look for a required field marked in red or an incomplete parcel line. Complete it, then review the form again.',
      },
      {
        problem: 'The sender or receiver details are wrong after creation.',
        solution:
          'Do not create a duplicate. Ask a supervisor to use the approved correction process.',
      },
      {
        problem: 'Nothing prints after the booking is created.',
        solution:
          'Confirm that the booking succeeded first. Then check the selected printer and ask support for help instead of creating the parcel again.',
      },
    ],
    relatedGuideIds: ['find-a-parcel', 'record-sender-payment'],
  },
  {
    id: 'find-a-parcel',
    categoryId: 'operations',
    title: 'Find a parcel and understand its status',
    summary: 'Search for a parcel before taking another action or answering a customer.',
    keywords: ['search parcel', 'track', 'status', 'parcel number', 'telephone'],
    estimatedMinutes: 3,
    pageName: 'Super Search',
    pageUrl: '/parcels',
    beforeYouStart: [
      'Ask for the parcel number first. If unavailable, use a verified sender or receiver telephone number.',
    ],
    steps: [
      {
        title: 'Open Super Search',
        description: 'Select Super Search from the Workspace section of the left menu.',
      },
      {
        title: 'Enter one reliable detail',
        description:
          'Search with the parcel number. If it is unavailable, use the complete telephone number or another supported detail.',
      },
      {
        title: 'Choose the correct result',
        description:
          'Compare the sender, receiver, destination, and date. Do not assume the first result is correct when several records appear.',
      },
      {
        title: 'Read the current status',
        description:
          'Use the latest status and branch information to explain where the parcel is and what action is expected next.',
      },
      {
        title: 'Open the parcel only when needed',
        description:
          'Select the matching parcel to view more detail or continue an operation permitted for your role.',
      },
    ],
    expectedResult:
      'You have identified the correct parcel and can explain its latest recorded status.',
    commonIssues: [
      {
        problem: 'No result appears for the parcel number.',
        solution:
          'Check letters and numbers carefully, remove accidental spaces, and confirm that the customer provided the complete number.',
      },
      {
        problem: 'Several parcels use the same telephone number.',
        solution:
          'Use the destination, receiver name, booking date, and parcel number to identify the correct record.',
      },
    ],
    relatedGuideIds: ['create-a-parcel', 'receive-an-incoming-parcel'],
  },
  {
    id: 'receive-an-incoming-parcel',
    categoryId: 'operations',
    title: 'Receive an incoming parcel',
    summary: 'Scan and confirm parcels that have physically arrived at your branch.',
    keywords: ['receive parcel', 'scan', 'incoming', 'arrival', 'manifest'],
    estimatedMinutes: 4,
    pageName: 'Scan to Receive',
    pageUrl: '/parcels/receive',
    beforeYouStart: [
      'The parcel must be physically present in front of you.',
      'Check the label and packaging for visible damage before confirming receipt.',
    ],
    steps: [
      {
        title: 'Open Scan to Receive',
        description: 'Under Parcel Receiving, select Scan to Receive.',
      },
      {
        title: 'Scan the parcel label',
        description:
          'Place the cursor in the scan field and scan the barcode. If scanning is unavailable, enter the complete parcel number carefully.',
      },
      {
        title: 'Confirm the parcel details',
        description:
          'Compare the parcel number, destination, and available description with the parcel in your hand.',
      },
      {
        title: 'Record any discrepancy',
        description:
          'If the parcel is damaged, missing, duplicated, or different from the record, stop and use the discrepancy process. Do not confirm a normal receipt.',
        note: 'Only confirm parcels that have physically arrived and match their records.',
      },
      {
        title: 'Confirm receipt',
        description:
          'Select the receive action once and wait for the success message before scanning the next parcel.',
      },
    ],
    expectedResult:
      'The parcel is recorded as received at your branch and becomes available for the next permitted operation.',
    commonIssues: [
      {
        problem: 'The scanner enters nothing.',
        solution:
          'Select the scan field, check that the scanner is connected, and try again. You may carefully enter the number manually.',
      },
      {
        problem: 'The parcel is already shown as received.',
        solution:
          'Do not receive it again. Verify the number and report the duplicate physical parcel or record to a supervisor.',
      },
      {
        problem: 'The app says the parcel belongs to another destination.',
        solution: 'Stop the normal receipt and report it through the discrepancy process.',
      },
    ],
    relatedGuideIds: ['find-a-parcel', 'create-support-ticket'],
  },
];
