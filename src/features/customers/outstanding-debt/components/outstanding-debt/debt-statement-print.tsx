import type { RefObject } from 'react';
import type { Customer } from '@/features/customers/api';
import { formatDateTimeTZ } from '@/lib/dates';
import type { OutstandingDebtStatement } from '@/shared/customers/outstanding-debt';
import { PRINT_LOGO_DATA_URI } from '@/shared/printing/print-logo';
import { debtSummaryLines, OUTSTANDING_DEBT_TITLE } from '../../utils';
import { DebtParcelsTable } from './debt-parcels-table';

const STYLES = `
  .debt-document { color: #111827; background: #fff; font: 11pt Arial, sans-serif; }
  .debt-heading { display: flex; align-items: center; gap: 12px; border-bottom: 2px solid #111827; padding-bottom: 10px; }
  .debt-heading img { width: 40px; height: 40px; object-fit: contain; }
  .debt-document h1 { margin: 18px 0 5px; font-size: 22pt; }
  .debt-document h2 { margin: 0 0 6px; font-size: 12pt; }
  .debt-document p { margin: 4px 0; }
  .debt-customer { margin: 16px 0; }
  .debt-summary { border: 1px solid #d1d5db; padding: 10px; margin: 0 0 18px; break-inside: avoid; }
  .debt-summary div { display: flex; justify-content: space-between; gap: 16px; padding: 3px 0; }
  .debt-summary div:first-child { font-weight: 700; }
  .debt-summary dd { margin: 0; }
  .debt-document caption { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  .debt-parcels { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 9pt; }
  .debt-parcels thead { display: table-header-group; background: #f3f4f6; color: #111827; }
  .debt-parcels .text-muted-foreground { color: #4b5563; }
  .debt-parcels tr { break-inside: avoid; }
  .debt-parcels th, .debt-parcels td { text-align: left; vertical-align: top; padding: 7px 5px; border-bottom: 1px solid #d1d5db; overflow-wrap: anywhere; }
  .debt-parcels th:nth-child(3) { width: 37%; }
  .debt-parcels th:last-child, .debt-parcels td:last-child { width: 17%; text-align: right; }
`;

export function DebtStatementPrint({
  printRef,
  companyName,
  customer,
  statement,
}: {
  printRef: RefObject<HTMLDivElement | null>;
  companyName: string;
  customer: Customer;
  statement: OutstandingDebtStatement;
}) {
  const contact = [customer.telephone, customer.telephone2, customer.email]
    .filter(Boolean)
    .join(' · ');
  return (
    <div className="hidden">
      <div ref={printRef} className="debt-document">
        <style>{STYLES}</style>
        <header className="debt-heading">
          <img src={PRINT_LOGO_DATA_URI} alt="" />
          <strong>{companyName}</strong>
        </header>
        <h1>{OUTSTANDING_DEBT_TITLE}</h1>
        <p>Balance as of {formatDateTimeTZ(statement.generatedAt)} GMT</p>
        <section className="debt-customer">
          <h2>{customer.fullname}</h2>
          {customer.address ? <p>{customer.address}</p> : null}
          {contact ? <p>{contact}</p> : null}
        </section>
        <dl className="debt-summary">
          {debtSummaryLines(statement.summary).map(({ label, value }) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <DebtParcelsTable parcels={statement.parcels} />
      </div>
    </div>
  );
}
