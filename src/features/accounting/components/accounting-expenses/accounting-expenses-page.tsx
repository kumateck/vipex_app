import { AccountingExpenses } from './components/accounting-expenses';

export function AccountingExpensesPage() {
  return <AccountingExpenses view="main" />;
}

export function AccountingExpensesDraftsPage() {
  return <AccountingExpenses view="drafts" />;
}

export function AccountingExpensesApprovalsPage() {
  return <AccountingExpenses view="approvals" />;
}

export function AccountingExpensesPaymentsPage() {
  return <AccountingExpenses view="payments" />;
}

export function AccountingExpensesPostingPage() {
  return <AccountingExpenses view="posting" />;
}

export function AccountingExpensesHistoryPage() {
  return <AccountingExpenses view="history" />;
}
