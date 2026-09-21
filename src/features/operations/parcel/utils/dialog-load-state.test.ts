import { describe, expect, test } from 'bun:test';
import { getDialogLoadState, type DialogResourceState } from './dialog-load-state';

const readyResource: DialogResourceState = {
  required: true,
  hasData: true,
  isLoading: false,
  isFetching: false,
  isError: false,
};

describe('getDialogLoadState', () => {
  test('keeps the dialog loading while a required resource has no data', () => {
    expect(
      getDialogLoadState([readyResource, { ...readyResource, hasData: false, isFetching: true }]),
    ).toEqual({ isLoading: true, hasError: false });
  });

  test('ignores resources that are not required for the selected parcel', () => {
    expect(
      getDialogLoadState([
        readyResource,
        { ...readyResource, required: false, hasData: false, isLoading: true },
      ]),
    ).toEqual({ isLoading: false, hasError: false });
  });

  test('reports a completed request failure instead of loading forever', () => {
    expect(getDialogLoadState([{ ...readyResource, hasData: false, isError: true }])).toEqual({
      isLoading: false,
      hasError: true,
    });
  });
});
