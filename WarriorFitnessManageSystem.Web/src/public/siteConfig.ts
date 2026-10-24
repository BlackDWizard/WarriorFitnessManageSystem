import { siteContent } from './siteContent';

export const siteName = siteContent.brandName;

export interface NavItem {
  to: string;
  label: string;
}

// 頁首的主要選單
export const mainNav: NavItem[] = [
  { to: '/events', label: '最新活動' },
  { to: '/pricing', label: '課程費用' },
  { to: '/form', label: '填寫表單' },
  { to: '/coaches', label: '教練師資' },
];

// 頁尾的資訊連結
export const footerNav: NavItem[] = [
  { to: '/about', label: '關於我們' },
  { to: '/contact', label: '聯絡我們' },
  { to: '/faq', label: '常見問題' },
];

// 後台可選的社群平台。新增平台時，SocialIcons.tsx 的 platformMeta 也要補上，
// 否則 TypeScript 會報錯提醒你
export type SocialPlatform = 'facebook' | 'instagram' | 'threads' | 'line' | 'youtube' | 'tiktok';

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
}

// 從 siteContent 的社群設定產生，網址是空字串的平台不會出現
export const socialLinks: SocialLink[] = (
  Object.entries(siteContent.social) as [SocialPlatform, string][]
)
  .filter(([, url]) => url.trim() !== '')
  .map(([platform, url]) => ({ platform, url }));
