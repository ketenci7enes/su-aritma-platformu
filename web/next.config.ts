import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dinamik sayfalarda meta etiketlerinin ilk HTML yanıtında yer almasını sağlar.
  // Aksi halde Next.js metadata'yı stream eder ve Lighthouse/SEO tarayıcıları
  // /urunler gibi dinamik sayfalarda description etiketini göremeyebilir.
  htmlLimitedBots: /.*/,
};

export default nextConfig;
