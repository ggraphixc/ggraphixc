/** @type {import('next').NextConfig} */
const nextConfig = {
  // React Compiler is stable in Next 16 — automatic memoization, no useMemo needed.
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" }
    ]
  }
};

export default nextConfig;
