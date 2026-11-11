import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { ParcelHandoverNoteAction } from './parcel-handover-note-action';

describe('parcel handover note indicator', () => {
  test('marks an active note with a warning that respects reduced motion', () => {
    const html = renderToStaticMarkup(
      <ParcelHandoverNoteAction parcelId="parcel-1" hasHandoverNote handoverNoteCritical />,
    );
    expect(html).toContain('Critical note');
    expect(html).toContain('motion-safe:animate-pulse');
  });

  test('keeps a delivered parcel note readable without pulsing', () => {
    const html = renderToStaticMarkup(
      <ParcelHandoverNoteAction parcelId="parcel-1" hasHandoverNote />,
    );
    expect(html).toContain('Handover note');
    expect(html).not.toContain('animate-pulse');
  });

  test('keeps the operational parcel rows clear when there is no note', () => {
    expect(renderToStaticMarkup(<ParcelHandoverNoteAction parcelId="parcel-1" />)).toBe('');
  });
});
