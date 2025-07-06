const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Enable network access for simulators
config.resolver.platforms = ["ios", "android", "native", "web"];

// Configure network settings for better simulator support
config.server = {
  ...config.server,
  port: 8081,
  host: "0.0.0.0", // Allow connections from all interfaces
};

// Enable source maps for better debugging
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

module.exports = config;
