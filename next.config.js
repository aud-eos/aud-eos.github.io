/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  distDir: "dist",
  reactStrictMode: true,
  images: {

    // Image Optimization using the default loader is not compatible with `{ output: 'export' }`.
    // Possible solutions:
    //   - Remove `{ output: 'export' }` and run "next start" to run server mode including the Image Optimization API.
    //   - Configure `{ images: { unoptimized: true } }` in `next.config.js` to disable the Image Optimization API.
    // Read more: https://nextjs.org/docs/messages/export-image-api
    unoptimized: true,

    // next/image Un-configured Host
    // https://nextjs.org/docs/messages/next-image-unconfigured-host
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.ctfassets.net",
        port: "",
        pathname: "/pvyz1kbxgmyk/**",
      },
      {
        protocol: "https",
        hostname: "i.scdn.co",
        port: "",
        pathname: "/image/**",
      },
    ],
  },
};


module.exports = nextConfig;
