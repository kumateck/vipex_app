/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('node:path');
const { VitePlugin } = require('@electron-forge/plugin-vite');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const logoBasePath = path.resolve(__dirname, '../../src/assets/logo');

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
  makers: [],
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
