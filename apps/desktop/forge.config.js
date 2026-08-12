/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs');
const path = require('node:path');
const { MakerDeb } = require('@electron-forge/maker-deb');
const { MakerRpm } = require('@electron-forge/maker-rpm');
const { MakerZIP } = require('@electron-forge/maker-zip');
const { VitePlugin } = require('@electron-forge/plugin-vite');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const logoBasePath = path.resolve(__dirname, '../../src/assets/logo');
const logoIcnsPath = `${logoBasePath}.icns`;
const hasMacNotaryEnv =
  Boolean(process.env.APPLE_ID) &&
  Boolean(process.env.APPLE_APP_SPECIFIC_PASSWORD) &&
  Boolean(process.env.APPLE_TEAM_ID);
const hasIcns = fs.existsSync(logoIcnsPath);

module.exports = {
  packagerConfig: {
    asar: true,
    icon: logoBasePath,
    executableName: 'vipex-desktop',
    win32metadata: {
      CompanyName: 'Vipex Co. LTD',
      FileDescription: 'Vipex Desktop',
      ProductName: 'Vipex Desktop',
      InternalName: 'vipex-desktop',
      OriginalFilename: 'vipex-desktop.exe',
    },
    appBundleId: 'com.vipex.desktop',
    appCategoryType: 'public.app-category.business',
    osxSign: process.env.APPLE_DEVELOPER_KEY
      ? {
          identity: process.env.APPLE_DEVELOPER_KEY,
        }
      : undefined,
    osxNotarize:
      hasMacNotaryEnv && hasIcns
        ? {
            tool: 'notarytool',
            appleId: process.env.APPLE_ID,
            appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
            teamId: process.env.APPLE_TEAM_ID,
          }
        : undefined,
  },
  makers: [new MakerZIP({}, ['darwin']), new MakerRpm({}), new MakerDeb({})],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: 'src/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [],
    }),
  ],
};
