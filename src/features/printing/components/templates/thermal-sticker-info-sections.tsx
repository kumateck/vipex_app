import type { CSSProperties } from 'react';

export function InfoBlock({
  label,
  primary,
  secondary,
}: {
  label: string;
  primary?: string | null;
  secondary?: string | null;
}) {
  return (
    <section style={{ minWidth: 0, borderRight: '0.25mm solid #111', padding: '1.2mm 1.6mm' }}>
      <div
        style={{ fontSize: '2.5mm', fontWeight: 800, textTransform: 'uppercase', lineHeight: 1 }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: '1mm',
          fontSize: primaryFontSize(primary),
          fontWeight: 800,
          lineHeight: 1,
          overflowWrap: 'anywhere',
        }}
      >
        {primary || '-'}
      </div>
      <div
        style={{
          marginTop: '0.8mm',
          fontSize: '3.4mm',
          fontWeight: 700,
          lineHeight: 1.08,
          overflowWrap: 'anywhere',
        }}
      >
        {secondary || '-'}
      </div>
    </section>
  );
}

export function SenderBlock({
  senderName,
  senderTelephones,
}: {
  senderName: string;
  senderTelephones: string;
}) {
  return (
    <section
      style={{
        minWidth: 0,
        borderRight: '0.25mm solid #111',
        display: 'grid',
      }}
    >
      <PartyBlock label="Sender" name={senderName} telephones={senderTelephones} />
    </section>
  );
}

export function ParcelStack({
  parcelDetails,
}: {
  parcelContent?: string | null;
  parcelDetails: string;
}) {
  return (
    <section style={{ minWidth: 0, display: 'grid' }}>
      <ParcelBlock label="Parcel Details" value={parcelDetails} />
    </section>
  );
}

function PartyBlock({
  label,
  name,
  telephones,
  hasDivider = false,
}: {
  label: string;
  name: string;
  telephones: string;
  hasDivider?: boolean;
}) {
  return (
    <div
      style={{
        minWidth: 0,
        borderTop: hasDivider ? '0.25mm solid #111' : undefined,
        padding: '1mm 1.6mm',
      }}
    >
      <div
        style={{ fontSize: '2.5mm', fontWeight: 800, textTransform: 'uppercase', lineHeight: 1 }}
      >
        {label}
      </div>
      <div style={primaryValueStyle(name)}>{name || '-'}</div>
      <div style={{ marginTop: '0.7mm', fontSize: '3mm', fontWeight: 700, lineHeight: 1.05 }}>
        {telephones || '-'}
      </div>
    </div>
  );
}

function ParcelBlock({
  label,
  value,
  hasDivider = false,
}: {
  label: string;
  value?: string | null;
  hasDivider?: boolean;
}) {
  return (
    <div
      style={{
        minWidth: 0,
        borderTop: hasDivider ? '0.25mm solid #111' : undefined,
        padding: '1mm 1.6mm',
      }}
    >
      <div
        style={{ fontSize: '2.4mm', fontWeight: 800, textTransform: 'uppercase', lineHeight: 1 }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: '0.8mm',
          fontSize: '3.3mm',
          fontWeight: 700,
          lineHeight: 1,
          overflowWrap: 'anywhere',
        }}
      >
        {value || '-'}
      </div>
    </div>
  );
}

function primaryValueStyle(value?: string | null): CSSProperties {
  return {
    marginTop: '0.8mm',
    fontSize: primaryFontSize(value),
    fontWeight: 800,
    lineHeight: 1,
    overflowWrap: 'anywhere',
  };
}

function primaryFontSize(value?: string | null) {
  const length = value?.length ?? 0;
  if (length > 34) return '3.5mm';
  if (length > 24) return '4.1mm';
  return '5mm';
}
