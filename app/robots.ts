import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/app', '/login', '/register', '/api/'] }],
    sitemap: 'https://documind-zeta-fawn.vercel.app/sitemap.xml',
  };
}
