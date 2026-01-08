/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Only enable WebAssembly on client side (browser)
    if (!isServer) {
      // Enable WebAssembly support for Rapier
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
      };

      // Handle .wasm files
      config.module.rules.push({
        test: /\.wasm$/,
        type: 'webassembly/async',
      });
    } else {
      // On server side, exclude Rapier to prevent SSR issues
      config.resolve.alias = {
        ...config.resolve.alias,
        '@dimforge/rapier3d': false,
      };
    }

    // Ensure WebGL and Canvas support
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };

    return config;
  },
};

module.exports = nextConfig;



