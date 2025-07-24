const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.resolver.alias = {
  "@": path.resolve(__dirname, "frontend/src"),
  "@components": path.resolve(__dirname, "frontend/src/components"),
  "@screens": path.resolve(__dirname, "frontend/src/screens"),
  "@styles": path.resolve(__dirname, "frontend/src/styles"),
  "@services": path.resolve(__dirname, "frontend/src/services"),
  "@assets": path.resolve(__dirname, "frontend/assets"),
};

module.exports = config;
