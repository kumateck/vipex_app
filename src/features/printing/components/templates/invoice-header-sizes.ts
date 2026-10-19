const full = {
  direction: 'row',
  align: 'flex-start',
  logo: '16mm',
  company: '6.8mm',
  companyLineHeight: 1,
  titleMinWidth: '50mm',
  title: '6.8mm',
  duplicate: '4.7mm',
  tin: '5mm',
  subtitle: '4.4mm',
  infoAlign: 'right',
  info: '3.1mm',
  infoMinWidth: '46mm',
  contacts: '3.6mm',
} as const;
const compact = {
  direction: 'column',
  align: 'center',
  logo: '10mm',
  company: '3.8mm',
  companyLineHeight: 1.2,
  titleMinWidth: undefined,
  title: '3.5mm',
  duplicate: '3mm',
  tin: '2.7mm',
  subtitle: '3mm',
  infoAlign: 'center',
  info: '2.7mm',
  infoMinWidth: undefined,
  contacts: '2.4mm',
} as const;
export function invoiceHeaderSizes(isCompact: boolean) {
  return isCompact ? compact : full;
}
