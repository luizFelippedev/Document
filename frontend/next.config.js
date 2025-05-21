/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    domains: ['localhost', 'example.com', 'cdn.example.com'],
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: false,
  },

  i18n: {
    locales: ['en-US', 'pt-BR', 'es'],
    defaultLocale: 'en-US',
    // ⚠️ `localeDetection: true` não é válido em Next.js 14 — REMOVIDO
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5001/api/:path*',
      },
    ];
  },

  async redirects() {
    return [
      {
        source: '/old-route',
        destination: '/new-route',
        permanent: true,
      },
    ];
  },

  output: 'standalone', // Ideal para Docker, Vercel ou hospedagem customizada
  trailingSlash: false, // URLs sem barra no final

  experimental: {
    // Ative opções experimentais aqui se necessário
  },
};

module.exports = nextConfig;
