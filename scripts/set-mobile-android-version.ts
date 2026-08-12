import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const [versionName, rawVersionCode] = Bun.argv.slice(2);
const versionCode = Number(rawVersionCode);

if (!versionName || !/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(versionName)) {
  throw new Error(`Invalid Android version name: ${versionName ?? '(missing)'}`);
}
if (!Number.isSafeInteger(versionCode) || versionCode <= 0 || versionCode > 2_100_000_000) {
  throw new Error(`Invalid Android version code: ${rawVersionCode ?? '(missing)'}`);
}

const buildFile = resolve('apps/mobile/android/app/build.gradle');
const current = readFileSync(buildFile, 'utf8');
const next = current
  .replace(/versionCode\s+\d+/, `versionCode ${versionCode}`)
  .replace(/versionName\s+"[^"]+"/, `versionName "${versionName}"`);

if (next === current || !next.includes(`versionCode ${versionCode}`)) {
  throw new Error('Unable to update the Android release version in build.gradle');
}

writeFileSync(buildFile, next);
console.log(`Android release version set to ${versionName} (${versionCode}).`);
