// Expo em monorepo: o Metro precisa vigiar a raiz do workspace e procurar
// módulos nos dois `node_modules`. Sem `disableHierarchicalLookup`, o Metro
// sobe a árvore sozinho e pode carregar duas cópias do React.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
