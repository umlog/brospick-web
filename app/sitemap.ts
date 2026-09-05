import type { MetadataRoute } from 'next';
import { productList, getProductHref } from '@/lib/products';
import { supabase } from '@/lib/supabase';
import { SITE_URL } from '@/lib/constants';

export const revalidate = 3600;

const STATIC_PATHS = ['', '/apparel', '/bootskin', '/interviews', '/ebook', '/returns', '/tracking', '/review'];
const DAILY_PATHS = ['', '/apparel', '/bootskin'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: DAILY_PATHS.includes(path) ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.7,
  }));

  const productEntries: MetadataRoute.Sitemap = productList.map((product) => ({
    url: `${SITE_URL}${getProductHref(product)}`,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const { data: posts } = await supabase.from('blog_posts').select('id, created_at');
  const blogEntries: MetadataRoute.Sitemap = (posts ?? []).map((post) => ({
    url: `${SITE_URL}/interviews/${post.id}`,
    lastModified: post.created_at ? new Date(post.created_at) : undefined,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticEntries, ...productEntries, ...blogEntries];
}
