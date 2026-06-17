const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Firebase uses package.json "exports" fields that Metro doesn't support by default.
// Disable unstable_enablePackageExports so Metro falls back to the main/browser
// fields and picks up the React-Native-compatible builds.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
