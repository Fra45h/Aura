import type {NextConfig} from 'next';
import {genkit} from 'genkit';

const nextConfig: NextConfig = {
  // Standard Next.js configuration options
  reactStrictMode: true, // Assuming this is a desired config
  swcMinify: true, // Assuming this is a desired config
  // Any other standard Next.js configs go here

  // Genkit specific configurations are now handled by the genkit() function
  // and should not be directly in the nextConfig object.

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Any other standard Next.js configs go here
};

export default nextConfig;
