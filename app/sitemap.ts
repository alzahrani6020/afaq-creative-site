import type { MetadataRoute } from 'next';
import { blogPosts } from '@/lib/blog';

const BASE = 'https://afaq-global.com';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE}/delete-account`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    ...blogPosts.map((post) => ({
      url: `${BASE}/blog/${post.slug}`,
      lastModified: new Date(post.dateISO),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];
}
