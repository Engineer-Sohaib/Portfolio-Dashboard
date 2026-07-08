/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // avoid double-invoking the legacy boot script's mount effect in dev
};

export default nextConfig;
