import { AccountingDailyCash } from './components/accounting-daily-cash';

export function AccountingDailyCashPage() {
  return <AccountingDailyCash view="main" />;
}

export function AccountingDailyCashDraftsPage() {
  return <AccountingDailyCash view="drafts" />;
}

export function AccountingDailyCashRecordedPage() {
  return <AccountingDailyCash view="recorded" />;
}

export function AccountingDailyCashApprovalsPage() {
  return <AccountingDailyCash view="approvals" />;
}
