/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // This allows production builds to successfully complete 
    // even if your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // This allows the build to continue even if there are
    // TypeScript type errors.
    ignoreBuildErrors: true,
  }
};
