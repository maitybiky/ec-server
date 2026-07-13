import { homepageRepository } from './homepage.repository.js';

/** Sensible starting content so the homepage never renders empty. */
export const HOMEPAGE_DEFAULTS = {
  badge: 'New Season Arrivals',
  titleLine1: 'Shop Smarter,',
  titleLine2: 'Live Better.',
  subtitle: 'Everything you love',
  description:
    'From tech to fashion — quality products with dynamic discounts that reward bigger carts.',
  ctaText: 'View All Products',
  heroImage: 'https://loremflickr.com/900/700/headphones?lock=1001',
  cards: [
    {
      title: 'New Gen X-Buds',
      subtitle: 'True wireless, all-day battery',
      image: 'https://loremflickr.com/500/400/earbuds?lock=1002',
    },
    {
      title: 'Surface Headphones',
      subtitle: 'Boosted with bass',
      image: 'https://loremflickr.com/500/700/headphones,studio?lock=1003',
    },
  ],
};

export const homepageService = {
  async get() {
    const stored = await homepageRepository.get();
    // Merge so newly added fields fall back to defaults on old documents.
    return {
      ...HOMEPAGE_DEFAULTS,
      ...(stored ?? {}),
      cards: stored?.cards?.length ? stored.cards : HOMEPAGE_DEFAULTS.cards,
    };
  },

  async update(content) {
    const current = await homepageService.get();
    return homepageRepository.set({ ...current, ...content });
  },
};
