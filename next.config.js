/** @type {import('next').NextConfig} */
// window.self = 'this';

global.self = 'this';
const nextConfig = {
  reactStrictMode: true,
  env:{
    OPENAI_API_KEY:process.env.OPENAI_API_KEY
  }
};

module.exports = nextConfig;
