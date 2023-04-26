/** @type {import('next').NextConfig} */
// window.self = 'this';

global.self = 'this';
const nextConfig = {
  reactStrictMode: true,
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
  webpack(config) {
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    };

    return config;
  },
  exportPathMap: async function (
    defaultPathMap,
    {dev, dir, outDir, distDir, buildId}
  ) {
    return {
      '/': {page: '/'},
    };
  },
};

module.exports = nextConfig;
