import { describe, expect, it } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { AppUpdateProgress } from '@/features/company-modules/components/app-updates';

describe('AppUpdateProgress', () => {
  it('renders a rounded percentage and accessible progress value', () => {
    const markup = renderToStaticMarkup(<AppUpdateProgress progress={47.6} />);

    expect(markup).toContain('48%');
    expect(markup).toContain('aria-valuenow="48"');
    expect(markup).toContain('width:47.6%');
  });

  it('clamps invalid progress values to the valid range', () => {
    const belowZero = renderToStaticMarkup(<AppUpdateProgress progress={-20} />);
    const aboveMaximum = renderToStaticMarkup(<AppUpdateProgress progress={140} />);
    const missing = renderToStaticMarkup(<AppUpdateProgress />);

    expect(belowZero).toContain('aria-valuenow="0"');
    expect(aboveMaximum).toContain('aria-valuenow="100"');
    expect(missing).toContain('aria-valuenow="0"');
  });
});
