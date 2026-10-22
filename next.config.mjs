// `pnpm write` sets BLOG_WRITER=1 to run the local blog editor at /write/.
const writer = process.env.BLOG_WRITER === "1";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The editor needs server routes, which a static export cannot have.
  output: writer ? undefined : "export",
  // Editor-only files are named *.writer.ts(x), so `pnpm dev` and production builds skip them.
  pageExtensions: writer ? ["writer.tsx", "writer.ts", "tsx", "ts", "jsx", "js"] : ["tsx", "ts", "jsx", "js"],
  basePath: "",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
