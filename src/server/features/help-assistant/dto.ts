export type HelpAssistantAskInput = {
  companyId: string;
  userId: string;
  question: string;
};

export type HelpAssistantAskSource = {
  guideId: string;
  title: string;
};

export type HelpAssistantAskResult = {
  answer: string;
  sources: HelpAssistantAskSource[];
  provider: string;
  grounded: boolean;
};

export type HelpAssistantLogInput = {
  companyId: string;
  userId: string;
  question: string;
  answer: string | null;
  provider?: string | null;
  matchedGuideIds: string[];
  succeeded: boolean;
  errorReason?: string | null;
};
