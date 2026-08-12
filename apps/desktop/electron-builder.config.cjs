const path = require('node:path');

const logoPath = path.resolve(__dirname, '../../src/assets/logo-512.png');
const updateFeedUrl =
  process.env.DESKTOP_UPDATE_FEED_URL ||
  'https://testing.app.vipexparcel.com/v1/desktop-updates/windows/latest/';

module.exports = {
  appId: 'com.vipex.desktop',
  electronVersion: require('electron/package.json').version,
  productName: 'Vipex Desktop',
  artifactName: 'vipex-desktop-${version}-Setup.${ext}',
  asar: true,
  directories: {
    output: 'out/make/nsis',
  },
  files: ['.vite/build/**/*', 'package.json'],
  win: {
    icon: logoPath,
    target: ['nsis'],
  },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowElevation: true,
  },
  publish: [
    {
      provider: 'generic',
      url: updateFeedUrl,
    },
  ],
};
