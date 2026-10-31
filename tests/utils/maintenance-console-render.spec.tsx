import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { MaintenanceView } from '@/features/platform-configuration/maintenance/components/maintenance-console';
import type { MaintenanceConsoleState } from '@/features/platform-configuration/maintenance/hooks';
import { MAINTENANCE_SCRIPTS, type MaintenanceRun } from '@/shared/maintenance';

const noop = () => {};
const preview: MaintenanceRun = {
  id: 'preview',
  operationId: 'repair-credit-print-payment',
  params: { bookingCode: 'BOOK1' },
  mode: 'preview',
  status: 'succeeded',
  createdAt: '2026-10-26T12:00:00Z',
  result: {
    summary: 'Ready to void GHS 50.00. The credit charge is retained.',
    details: { code: 'BOOK1', amountPsw: 5000 },
    readyToApply: true,
  },
};
function fixture(overrides: Partial<MaintenanceConsoleState> = {}) {
  return {
    scripts: MAINTENANCE_SCRIPTS,
    runs: [],
    selected: MAINTENANCE_SCRIPTS[1],
    params: {},
    catalog: { isLoading: false, isError: false, refetch: noop },
    history: { isFetching: false, isError: false, refetch: noop },
    result: null,
    confirmed: false,
    busy: false,
    canPreview: false,
    canExecute: false,
    hasExecutablePreview: false,
    error: '',
    selectScript: noop,
    updateParam: noop,
    setConfirmed: noop,
    showResult: noop,
    run: async () => {},
    ...overrides,
  } as unknown as MaintenanceConsoleState;
}
const render = (state: MaintenanceConsoleState) =>
  renderToStaticMarkup(<MaintenanceView state={state} />);

describe('maintenance console rendering', () => {
  test('shows the supported catalog and booking field without an execute action before preview', () => {
    const html = render(fixture());
    expect(html).toContain('Maintenance Scripts');
    expect(html).toContain('Booking code');
    expect(html).toContain('Preview repair');
    expect(html).not.toContain('Execute repair');
    expect(html).toContain('No scripts have been run yet.');
    expect(html).not.toContain('Company ID');
  });
  test('a reviewed repair shows explicit no-cash confirmation and its result', () => {
    const html = render(fixture({ result: preview, hasExecutablePreview: true, canPreview: true }));
    expect(html).toContain(
      'I confirmed that printing created this payment and no cash was received.',
    );
    expect(html).toContain('Execute repair');
    expect(html).toContain('Ready to void GHS 50.00');
    expect(html).toContain('View record details');
  });
  test('viewing a historical preview cannot reveal an executable confirmation', () => {
    const html = render(fixture({ result: preview, runs: [preview] }));
    expect(html).toContain('View result');
    expect(html).not.toContain('Execute repair');
  });
  test('loading and catalog errors expose recovery states', () => {
    const loading = render(
      fixture({ catalog: { isLoading: true } as MaintenanceConsoleState['catalog'] }),
    );
    expect(loading).toContain('Loading maintenance scripts');
    const failed = render(
      fixture({
        catalog: { isError: true, refetch: noop } as unknown as MaintenanceConsoleState['catalog'],
      }),
    );
    expect(failed).toContain('The script catalog could not load.');
    expect(failed).toContain('Try again');
  });
  test('result data is escaped and run failures remain visible', () => {
    const html = render(
      fixture({
        error: 'Preview expired. Try again.',
        result: {
          ...preview,
          result: { ...preview.result!, details: { injected: '<script>danger()</script>' } },
        },
      }),
    );
    expect(html).toContain('Preview expired. Try again.');
    expect(html).not.toContain('<script>danger()');
    expect(html).toContain('&lt;script&gt;');
  });
  test('expanded catalog renders every operation and uses its specific repair confirmation', () => {
    for (const selected of MAINTENANCE_SCRIPTS) {
      const html = render(fixture({ selected, hasExecutablePreview: selected.kind === 'repair' }));
      expect(html).toContain(selected.title);
      expect(html).toContain('Booking');
      if (selected.kind === 'repair') expect(html).toContain(selected.confirmation!);
      if (selected.kind === 'repair' && selected.id !== 'repair-credit-print-payment')
        expect(html).not.toContain('I confirmed that printing created this payment');
    }
    expect(render(fixture())).toContain('Available scripts (10)');
  });
  test('receiving repair exposes its booking input, optional location and specific confirmation', () => {
    const selected = MAINTENANCE_SCRIPTS.find(
      (script) => script.id === 'repair-parcel-receiving-workflow',
    )!;
    const html = render(fixture({ selected, hasExecutablePreview: true }));
    expect(html).toContain('Repair parcel receiving workflow');
    expect(html).toContain('Pickup location ID');
    expect(html).toContain('awaiting collection');
    expect(html).toContain('Execute repair');
  });
});
