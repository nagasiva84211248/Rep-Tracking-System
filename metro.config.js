/**
 * Metro configuration for React Native
 * https://reactnative.dev/docs/metro
 *
 * @format
 */

const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

// Get the default configuration first
const defaultConfig = getDefaultConfig(__dirname);

// Customize it
const config = {
  resolver: {
    assetExts: [...defaultConfig.resolver.assetExts, 'lottie'], // add .lottie support
  },
};

// Export the merged configuration
module.exports = mergeConfig(defaultConfig, config);
