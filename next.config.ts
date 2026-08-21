import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Deployed as a pre-rendered site on GitHub Pages: no Node server at runtime,
  // so no route handlers, middleware, server actions or ISR.
  output: "export",

  // Nothing resizes images at request time once exported. Source images in
  // public/img/ must already be at the dimensions they are served at.
  images: { unoptimized: true },

  // GitHub Pages serves directories via index.html, so /blog/foo/ must resolve
  // to blog/foo/index.html rather than a bare blog/foo file.
  trailingSlash: true,
};

export default nextConfig;
