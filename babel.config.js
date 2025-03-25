module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // NativeWind v4 doesn't use a babel plugin
    plugins: ['react-native-reanimated/plugin'],
  };
};
