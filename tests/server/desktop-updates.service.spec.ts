import { describe, expect, test } from 'bun:test';
import {
  getWindowsDesktopUpdateResponseSvc,
  normalizeWindowsUpdateFile,
} from '../../src/server/features/desktop-updates/service';

describe('desktop update artifact service', () => {
  test('streams update metadata through the app server', async () => {
    const reads: Array<{
      key: string;
      options?: { cacheControl?: string; contentType?: string };
    }> = [];
    const expected = new Response('version: 0.0.2');

    const response = await getWindowsDesktopUpdateResponseSvc(
      'latest.yml',
      async (key, options) => {
        reads.push({ key, options });
        return expected;
      },
    );

    expect(response).toBe(expected);
    expect(reads).toEqual([
      {
        key: 'desktop/windows/latest/latest.yml',
        options: {
          cacheControl: 'private, no-store',
          contentType: 'text/yaml; charset=utf-8',
        },
      },
    ]);
  });

  test('streams installers with the correct content type', async () => {
    let contentType = '';

    await getWindowsDesktopUpdateResponseSvc('Vipex Setup 0.0.2.exe', async (_key, options) => {
      contentType = options?.contentType ?? '';
      return new Response();
    });

    expect(contentType).toBe('application/vnd.microsoft.portable-executable');
  });

  test('rejects nested or unsupported update paths', () => {
    expect(() => normalizeWindowsUpdateFile('../latest.yml')).toThrow(
      'Invalid desktop update file path',
    );
    expect(() => normalizeWindowsUpdateFile('notes.txt')).toThrow(
      'Unsupported desktop update file',
    );
  });
});
