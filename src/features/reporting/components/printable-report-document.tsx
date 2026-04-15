import { forwardRef } from 'react';
import { formatDateTime as sharedFormatDateTime } from '@/lib/dates';
import logoPng from '@/assets/logo.png';

export interface PrintableReportSection {
  heading: string;
  headers: string[];
  rows: string[][];
}

export interface PrintableReportDocumentProps {
  companyName: string;
  title: string;
  subtitle?: string | null;
  generatedAt: string;
  filters?: Array<{ label: string; value: string }>;
  sections: PrintableReportSection[];
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return sharedFormatDateTime(value);
}

export const PrintableReportDocument = forwardRef<HTMLDivElement, PrintableReportDocumentProps>(
  function PrintableReportDocument(
    { companyName, title, subtitle, generatedAt, filters = [], sections },
    ref,
  ) {
    return (
      <div ref={ref} className="bg-white text-black">
        <style>
          {`
            @page { size: Letter portrait; margin: 16mm; }
            @media print {
              body { margin: 0; }
            }
          `}
        </style>
        <div style={{ fontFamily: 'Arial, sans-serif', padding: '10mm', color: '#111827' }}>
          <header
            style={{
              borderBottom: '2px solid #111827',
              paddingBottom: '12px',
              marginBottom: '18px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img
                  src={logoPng}
                  alt="Vipex logo"
                  style={{ width: '42px', height: '42px', objectFit: 'contain' }}
                />
                <div style={{ fontSize: '24px', fontWeight: 700 }}>{companyName}</div>
              </div>
            </div>
            <div style={{ fontSize: '18px', marginTop: '8px', fontWeight: 600 }}>{title}</div>
            {subtitle ? <div style={{ marginTop: '4px', color: '#4b5563' }}>{subtitle}</div> : null}
            <div style={{ marginTop: '6px', fontSize: '12px', color: '#4b5563' }}>
              Generated: {formatDateTime(generatedAt)}
            </div>
          </header>

          {filters.length ? (
            <section style={{ marginBottom: '18px' }}>
              <div style={{ fontWeight: 700, marginBottom: '8px' }}>Filters</div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: '8px 16px',
                  fontSize: '12px',
                }}
              >
                {filters.map((filter) => (
                  <div key={`${filter.label}-${filter.value}`}>
                    <strong>{filter.label}:</strong> {filter.value}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {sections.map((section) => (
            <section key={section.heading} style={{ marginBottom: '20px' }}>
              <div style={{ fontWeight: 700, marginBottom: '8px' }}>{section.heading}</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr>
                    {section.headers.map((header) => (
                      <th
                        key={header}
                        style={{
                          border: '1px solid #d1d5db',
                          padding: '6px',
                          background: '#f3f4f6',
                          textAlign: 'left',
                        }}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {section.rows.length ? (
                    section.rows.map((row, rowIndex) => (
                      <tr key={`${section.heading}-${rowIndex}`}>
                        {row.map((cell, cellIndex) => (
                          <td
                            key={`${section.heading}-${rowIndex}-${cellIndex}`}
                            style={{ border: '1px solid #d1d5db', padding: '6px' }}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={section.headers.length}
                        style={{ border: '1px solid #d1d5db', padding: '6px' }}
                      >
                        No rows available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          ))}
        </div>
      </div>
    );
  },
);
