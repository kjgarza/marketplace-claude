import type { NextConfig } from 'next';

const config: NextConfig = {
  transpilePackages: [
    '@monorepo/ui',
    '@monorepo/utils',
    '@monorepo/ai-elements',
  ],
};

export default config;
