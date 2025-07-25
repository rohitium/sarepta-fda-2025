/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static exports for GitHub Pages when NODE_ENV is production
  ...(process.env.NODE_ENV === 'production' && {
    output: 'export',
    trailingSlash: true,
    images: {
      unoptimized: true
    }
  }),
  
  // Disable ESLint during builds to avoid blocking deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // Experimental features
  experimental: {
    // Enable server components
    serverComponentsExternalPackages: ['pdf-parse'],
  },

  // Webpack configuration for PDF processing
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    
    return config;
  },

  // Headers for CORS when serving PDFs
  async headers() {
    return [
      {
        source: '/pdf/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, HEAD, OPTIONS',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 