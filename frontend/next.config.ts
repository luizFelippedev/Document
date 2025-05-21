import { NextConfig } from 'next';

const nextConfig = {
  reactStrictMode: true,

  images: {
    domains: ['localhost', 'example.com', 'cdn.example.com'], // ajuste os domínios conforme necessário
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: false,
    // contentSecurityPolicy NÃO é opção válida no Next.js images
  },

  i18n: {
    locales: ['en-US', 'pt-BR', 'es'],
    defaultLocale: 'en-US',
    localeDetection: true,
  },

  // Remover console.log no prod (Next.js >=13.3 suporta isso via compiler)
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://api.example.com/:path*',
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

  output: 'standalone',
  trailingSlash: false,

  experimental: {
    // Aqui você pode ativar flags experimentais se quiser, ou deixar vazio
  },
};

export default nextConfig;
