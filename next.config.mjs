/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'canvas', 'pdf-parse', 'pdfjs-dist']
    }
    return config
  },
}

export default nextConfig
