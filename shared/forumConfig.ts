export type ForumCategorySlug = 'news' | 'general' | 'builds' | 'bugs';

export type ForumLayout = 'announcements' | 'messenger' | 'classic';

export interface ForumCategoryConfig {
  slug: ForumCategorySlug;
  icon: string;
  layout: ForumLayout;
  /** Только администрация может создавать темы */
  staffOnlyTopics: boolean;
}

export const FORUM_CATEGORY_CONFIG: Record<ForumCategorySlug, ForumCategoryConfig> = {
  news: {
    slug: 'news',
    icon: '📢',
    layout: 'announcements',
    staffOnlyTopics: true,
  },
  general: {
    slug: 'general',
    icon: '💬',
    layout: 'messenger',
    staffOnlyTopics: false,
  },
  builds: {
    slug: 'builds',
    icon: '🏗',
    layout: 'classic',
    staffOnlyTopics: false,
  },
  bugs: {
    slug: 'bugs',
    icon: '🐛',
    layout: 'classic',
    staffOnlyTopics: false,
  },
};

export function getForumCategoryConfig(slug: string): ForumCategoryConfig | null {
  return FORUM_CATEGORY_CONFIG[slug as ForumCategorySlug] ?? null;
}

export function isForumStaffOnlyCategory(slug: string): boolean {
  return getForumCategoryConfig(slug)?.staffOnlyTopics ?? false;
}

export function isForumMessengerCategory(slug: string): boolean {
  return getForumCategoryConfig(slug)?.layout === 'messenger';
}

export function forumTopicPath(categorySlug: string, topicId: number): string {
  if (isForumMessengerCategory(categorySlug)) {
    return `/forum/general/topic/${topicId}`;
  }
  return `/forum/topic/${topicId}`;
}

export function forumCategoryPath(slug: string): string {
  if (isForumMessengerCategory(slug)) {
    return '/forum/general';
  }
  return `/forum/${slug}`;
}
