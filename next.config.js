/** @type {import('next').NextConfig} */
// window.self = 'this';

global.self = 'this';
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, {isServer}) => {

    // Include the 'gpt-3-encoder' package in the client and server builds
    config.resolve.alias['gpt-3-encoder'] = 'gpt-3-encoder/browser';
    
    return config;
  },
  env:{
    OPENAI_API_KEY:process.env.OPENAI_API_KEY
  }
};

module.exports = nextConfig;
