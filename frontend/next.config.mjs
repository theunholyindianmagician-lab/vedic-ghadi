/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strict Mode disabled — R3F v9 render loop dies after Strict's double-mount in dev.
  // Production builds (which never double-mount) are unaffected.
  reactStrictMode: false,
  experimental: { typedRoutes: false },
  env: {
    NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE || "",
  },
}
export default nextConfig
