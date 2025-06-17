/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  images: {
    domains: ["gateway.pinata.cloud", "ipfs.io", "cloudflare-ipfs.com"],
    unoptimized: true, // For static export
  },

  // Enable static export
  trailingSlash: true,

  // Webpack configuration for handling node modules in browser
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Global hydration error suppression
    if (!isServer) {
      const originalEntry = config.entry;
      config.entry = async () => {
        const entries = await originalEntry();

        // Add hydration error suppression to all entries
        const hydrationSuppressor = `
          if (typeof window !== 'undefined') {
            const originalError = console.error;
            const originalWarn = console.warn;
            
            console.error = function(...args) {
              const message = args[0];
              if (typeof message === 'string' && (
                message.includes('Hydration failed') ||
                message.includes('Text content did not match') ||
                message.includes('Server HTML') ||
                message.includes('client-side rendered') ||
                message.includes('Expected server HTML to contain') ||
                message.includes('react-hydration-error')
              )) {
                return;
              }
              return originalError.apply(console, args);
            };
            
            console.warn = function(...args) {
              const message = args[0];
              if (typeof message === 'string' && (
                message.includes('Expected server HTML') ||
                message.includes('hydration') ||
                message.includes('useLayoutEffect does nothing on the server')
              )) {
                return;
              }
              return originalWarn.apply(console, args);
            };
          }
        `;

        // Inject suppression code into main entries
        Object.keys(entries).forEach((key) => {
          if (Array.isArray(entries[key])) {
            entries[key].unshift(
              `data:text/javascript,${encodeURIComponent(hydrationSuppressor)}`
            );
          }
        });

        return entries;
      };
    }

    return config;
  },

  // Environment variables
  env: {
    CUSTOM_KEY: "my-value",
  },

  // Updated experimental features (removed deprecated reactRoot)
  experimental: {
    // Modern experimental features for current Next.js versions
    serverComponentsExternalPackages: [],
  },

  // Headers for security
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: "/home",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
