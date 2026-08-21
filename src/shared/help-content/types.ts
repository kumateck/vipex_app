export type HelpCategoryId =
  | 'workspace'
  | 'operations'
  | 'commercial'
  | 'finance'
  | 'human-capital'
  | 'supply-chain'
  | 'governance'
  | 'insights'
  | 'technology'
  | 'support'
  | 'faq';

export type HelpGuideStep = {
  title: string;
  description: string;
  note?: string;
};

export type HelpGuideIssue = {
  problem: string;
  solution: string;
};

export type HelpModulePage = {
  name: string;
  url: string;
  description: string;
};

export type HelpGuide = {
  id: string;
  categoryId: HelpCategoryId;
  title: string;
  summary: string;
  keywords: string[];
  estimatedMinutes: number;
  pageName?: string;
  pageUrl?: string;
  beforeYouStart: string[];
  steps: HelpGuideStep[];
  expectedResult: string;
  commonIssues: HelpGuideIssue[];
  modulePages?: HelpModulePage[];
  relatedGuideIds?: string[];
};

export type HelpCategory = {
  id: HelpCategoryId;
  name: string;
  description: string;
  icon:
    | 'LayoutGrid'
    | 'Package'
    | 'BriefcaseBusiness'
    | 'Wallet'
    | 'UsersRound'
    | 'Boxes'
    | 'Scale'
    | 'ChartBar'
    | 'Cpu'
    | 'LifeBuoy'
    | 'CircleQuestionMark';
};
