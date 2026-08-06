/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');
const mobileSrcRoot = path.resolve(projectRoot, 'src');

const config = {
  watchFolders: [workspaceRoot],
  resolver: {
    disableHierarchicalLookup: false,
    extraNodeModules: {
      '@mobile': mobileSrcRoot,
      '@': mobileSrcRoot,
    },
    resolveRequest(context, moduleName, platform) {
      if (moduleName.startsWith('@mobile/')) {
        return context.resolveRequest(
          context,
          path.join(mobileSrcRoot, moduleName.slice('@mobile/'.length)),
          platform,
        );
      }

      if (moduleName.startsWith('@/')) {
        return context.resolveRequest(
          context,
          path.join(mobileSrcRoot, moduleName.slice(2)),
          platform,
        );
      }

      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
