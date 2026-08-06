/** @type {import('next').NextConfig} */
const path = require('path');

function getEnonicWebpackConfig(config, {buildId, dev, isServer, defaultLoaders, nextRuntime, webpack}) {
    config.resolve.fallback = {
        ...config.resolve.fallback,
        // client-side resolution for node modules
        fs: false
    }
    config.resolve.alias = {
        ...config.resolve.alias,
        "@phrases": path.resolve(__dirname, "src", "phrases")
    }
    return config;
}

async function getEnonicHeaders() {
    return [
        {
            // Apply these headers to all routes in your application.
            source: '/:path*',
            headers: [
                {
                    key: 'Content-Security-Policy',
                    value: `script-src 'self' 'unsafe-eval' 'unsafe-inline';`
                },
                {
                    key: 'Access-Control-Allow-Origin',
                    value: 'http://localhost:8080' // Can't be '*' when credentials are allowed
                },
                {
                    key: 'Access-Control-Allow-Credentials',
                    value: 'true' // Needed for cookies to be sent in cross-origin requests
                },
                {
                    key: 'Access-Control-Allow-Methods',
                    value: 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
                }
            ],
        },
    ]
}

const config = {
    reactStrictMode: true,
    trailingSlash: false,
    transpilePackages: ['@enonic/nextjs-adapter'],
    webpack: getEnonicWebpackConfig,
    turbopack: {
        resolveAlias: {
            "@phrases": path.resolve(__dirname, "src", "phrases")
        }
    },
    headers: getEnonicHeaders,
};

module.exports = config;
