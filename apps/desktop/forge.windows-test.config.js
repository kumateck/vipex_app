/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs');
const path = require('node:path');
const { MakerSquirrel } = require('@electron-forge/maker-squirrel');
const { VitePlugin } = require('@electron-forge/plugin-vite');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const logoBasePath = path.resolve(__dirname, '../../src/assets/logo');
const logoIcoPath = `${logoBasePath}.ico`;
const hasIco = fs.existsSync(logoIcoPath);

module.exports = {
  packagerConfig: {
    asar: true,
    icon: logoBasePath,
    name: 'Vipex Desktop Test',
    executableName: 'vipex-desktop-test',
    win32metadata: {
      CompanyName: 'Vipex Co. LTD',
      FileDescription: 'Vipex Desktop Test',
      ProductName: 'Vipex Desktop Test',
      InternalName: 'vipex-desktop-test',
      OriginalFilename: 'vipex-desktop-test.exe',
    },
  },
  makers: [
    new MakerSquirrel(
      hasIco
        ? {
            name: 'vipex_desktop_test',
            setupExe: 'VipexDesktopTestSetup.exe',
            setupIcon: logoIcoPath,
          }
        : {
            name: 'vipex_desktop_test',
            setupExe: 'VipexDesktopTestSetup.exe',
          },
    ),
  ],
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
