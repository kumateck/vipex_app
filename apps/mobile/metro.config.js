/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');
const mobileSrcRoot = path.resolve(projectRoot, 'src');
const workspaceSrcRoot = path.resolve(workspaceRoot, 'src');

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

      // Mirror tsconfig "@/*": ["./src/*", "../../src/*"] so shared root modules
      // (e.g. @/shared/shipments/*) resolve at runtime, not only at typecheck.
      if (moduleName.startsWith('@/')) {
        const subpath = moduleName.slice(2);
        try {
          return context.resolveRequest(context, path.join(mobileSrcRoot, subpath), platform);
        } catch {
          return context.resolveRequest(context, path.join(workspaceSrcRoot, subpath), platform);
        }
      }

      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
