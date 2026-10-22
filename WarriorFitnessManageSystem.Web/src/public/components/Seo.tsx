import { siteName } from '../siteConfig';

/**
 * 設定每一頁的分頁標題。
 * React 19 會把元件裡的 <title> 自動搬到 <head>，不需要額外套件。
 * （如果專案是 React 18，改用 react-helmet-async）
 *
 * description 不在這裡設定：index.html 已經有一組，
 * 這裡再加一組會變成兩個 description 標籤。
 */
export function Seo({ title }: { title?: string }) {
  return <title>{title ? `${title}｜${siteName}` : siteName}</title>;
}
