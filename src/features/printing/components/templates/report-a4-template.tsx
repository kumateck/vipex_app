type ReportA4TemplateProps = {
  title: string;
  subtitle?: string;
  columns: string[];
  rows: Array<Array<string | number>>;
};

export function ReportA4Template({ title, subtitle, columns, rows }: ReportA4TemplateProps) {
  return (
    <div
      className="bg-white text-black"
      style={{ width: '190mm', minHeight: '277mm', fontFamily: 'Arial, sans-serif' }}
    >
      <header style={{ marginBottom: '8mm' }}>
        <h1 style={{ margin: 0, fontSize: '20px' }}>{title}</h1>
        {subtitle ? <p style={{ margin: '2mm 0 0', fontSize: '12px' }}>{subtitle}</p> : null}
      </header>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                style={{ textAlign: 'left', borderBottom: '1px solid #111', padding: '2mm 1mm' }}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${index}-${row.join('-')}`}>
              {row.map((cell, cellIndex) => (
                <td
                  key={`${index}-${cellIndex}-${String(cell)}`}
                  style={{ borderBottom: '1px solid #ddd', padding: '2mm 1mm' }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
