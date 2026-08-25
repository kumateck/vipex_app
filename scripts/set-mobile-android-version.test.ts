import { describe, expect, it } from 'bun:test';
import { applyAndroidReleaseVersion } from './set-mobile-android-version';

describe('applyAndroidReleaseVersion', () => {
  it('accepts an already-current version without failing', () => {
    const current = 'versionCode 17\nversionName "1.0.17"\n';
    expect(applyAndroidReleaseVersion(current, '1.0.17', '17')).toBe(current);
  });

  it('updates standard Groovy version declarations', () => {
    const current = 'versionCode 16\nversionName "1.0.16"\n';
    expect(applyAndroidReleaseVersion(current, '1.0.17', '17')).toBe(
      'versionCode 17\nversionName "1.0.17"\n',
    );
  });

  it('updates assignment-style Gradle declarations', () => {
    const current = 'versionCode = 16\nversionName = "1.0.16"\n';
    expect(applyAndroidReleaseVersion(current, '1.0.17', '17')).toBe(
      'versionCode = 17\nversionName = "1.0.17"\n',
    );
  });
});
