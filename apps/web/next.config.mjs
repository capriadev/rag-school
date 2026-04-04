/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exclude training backend from production build
  experimental: {
    outputFileTracingExcludes: {
      "*": [
        "../train/**/*",
        "../train/**",
      ],
    },
  },
  transpilePackages: ["@rag/core", "@rag/data", "@rag/contracts", "@rag/ui"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), "canvas", "pdf-parse", "pdfjs-dist"]
    }
    // Ignore train folder in webpack
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /apps\/train\// },
    ]
    return config
  },
}

export default nextConfig
