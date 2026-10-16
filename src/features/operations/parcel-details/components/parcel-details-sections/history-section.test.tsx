import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { HistorySection } from './history-section';

describe('HistorySection', () => {
  test('shows each step with who did it and where', () => {
    const markup = renderToStaticMarkup(
      <HistorySection
        isLoading={false}
        isError={false}
        events={[
          {
            id: 'delivery:d1:assigned',
            occurredAt: '2026-10-06T09:34:00.000Z',
            category: 'delivery',
            title: 'Rider assigned',
            description: 'Rider: Evans Kwame Asamoah',
            actorName: 'Vipex Delivery Accra',
            branchName: 'Accra',
          },
        ]}
      />,
    );
    expect(markup).toContain('History (1)');
    expect(markup).toContain('Rider assigned');
    expect(markup).toContain('Rider: Evans Kwame Asamoah');
    expect(markup).toContain('by Vipex Delivery Accra');
    expect(markup).toContain('Accra');
  });

  test('explains an empty or failed history instead of rendering nothing', () => {
    expect(
      renderToStaticMarkup(<HistorySection events={[]} isLoading={false} isError={false} />),
    ).toContain('No recorded history.');
    expect(
      renderToStaticMarkup(<HistorySection events={[]} isLoading={false} isError />),
    ).toContain('History could not be loaded');
  });
});
