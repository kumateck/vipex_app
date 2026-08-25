import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const VERSION_NAME_PATTERN = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;
const VERSION_CODE_LINE = /(\bversionCode\s*(?:=\s*)?)\d+\b/;
const VERSION_NAME_LINE = /(\bversionName\s*(?:=\s*)?)["'][^"']+["']/;

export function applyAndroidReleaseVersion(
  current: string,
  versionName: string | undefined,
  rawVersionCode: string | undefined,
) {
  const versionCode = Number(rawVersionCode);
  if (!versionName || !VERSION_NAME_PATTERN.test(versionName)) {
    throw new Error(`Invalid Android version name: ${versionName ?? '(missing)'}`);
  }
  if (!Number.isSafeInteger(versionCode) || versionCode <= 0 || versionCode > 2_100_000_000) {
    throw new Error(`Invalid Android version code: ${rawVersionCode ?? '(missing)'}`);
  }
  if (!VERSION_CODE_LINE.test(current) || !VERSION_NAME_LINE.test(current)) {
    throw new Error('Unable to locate the Android release version in build.gradle');
  }

  return current
    .replace(VERSION_CODE_LINE, `$1${versionCode}`)
    .replace(VERSION_NAME_LINE, `$1"${versionName}"`);
}

if (import.meta.main) {
  const [versionName, rawVersionCode] = Bun.argv.slice(2);
  const buildFile = resolve('apps/mobile/android/app/build.gradle');
  const current = readFileSync(buildFile, 'utf8');
  const next = applyAndroidReleaseVersion(current, versionName, rawVersionCode);

  if (next !== current) writeFileSync(buildFile, next);
  console.log(`Android release version set to ${versionName} (${rawVersionCode}).`);
}
