const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// lucide-react-native ships ESM by default which Metro can't resolve on Windows.
// Force it to use the CJS bundle instead.
config.resolver.extraNodeModules = {
  'lucide-react-native': path.resolve(
    __dirname,
    'node_modules/lucide-react-native/dist/cjs/lucide-react-native.js'
  ),
};

module.exports = config;
