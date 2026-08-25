const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

const root = __dirname;
const workspaceRoot = path.resolve(root, '..');
const defaultConfig = getDefaultConfig(root);

module.exports = mergeConfig(defaultConfig, {
  watchFolders: [workspaceRoot],
  resolver: {
    nodeModulesPaths: [path.resolve(root, 'node_modules'), path.resolve(workspaceRoot, 'node_modules')],
    extraNodeModules: {
      '@berx/core': path.resolve(root, 'packages/core/src'),
      '@berx/api': path.resolve(root, 'packages/api/src'),
      '@berx/auth': path.resolve(root, 'packages/auth/src'),
      '@berx/domain': path.resolve(root, 'packages/domain/src'),
      '@berx/design-system': path.resolve(root, 'packages/design-system/src'),
      '@berx/platform': path.resolve(root, 'packages/platform/src')
    }
  }
});
