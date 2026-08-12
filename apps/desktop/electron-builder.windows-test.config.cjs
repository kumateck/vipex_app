const baseConfig = require('./electron-builder.config.cjs');

module.exports = {
  ...baseConfig,
  appId: 'com.vipex.desktop.test',
  productName: 'Vipex Desktop Test',
  artifactName: 'VipexDesktopTestSetup.${ext}',
  directories: {
    output: 'out/make/nsis-test',
  },
};
