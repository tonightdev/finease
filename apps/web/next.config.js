/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/ui", "@repo/types"],
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-select", "framer-motion", "recharts"],
  },
};

export default nextConfig;

