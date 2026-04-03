/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exclude training backend from production build (Vercel)
  // The train/ folder is ONLY for local development with `npm run train`
  experimental: {
    outputFileTracingExcludes: {
      '*': [
        './train/**/*',
        './train/**',
      ],
    },
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'canvas', 'pdf-parse', 'pdfjs-dist']
    }
    // Ignore train folder in webpack
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /train\// },
    ]
    return config
  },
}

export default nextConfig
