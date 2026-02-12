// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Configure resolver to handle axios properly in React Native
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Force axios to use the browser build instead of node build
  if (moduleName === 'axios' || moduleName.startsWith('axios/')) {
    const axiosPath = require.resolve('axios/dist/browser/axios.cjs');
    return {
      filePath: axiosPath,
      type: 'sourceFile',
    };
  }

  // Fallback to default resolver
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
