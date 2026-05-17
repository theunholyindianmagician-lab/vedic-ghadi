/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strict Mode disabled — R3F v9 render loop dies after Strict's double-mount in dev.
  // Production builds (which never double-mount) are unaffected.
  reactStrictMode: false,
  // Standalone output → minimal-deps server.js bundle, ~30MB Docker image vs ~500MB.
  // Required for Cloud Run / any container deploy that copies node_modules manually.
  output: "standalone",
  experimental: { typedRoutes: false },
  env: {
    NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE || "",
  },
}
export default nextConfig
