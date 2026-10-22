export type SiteKind = 'public' | 'admin';

/**
 * 依網域判斷要顯示前台還是後台。
 * 正式環境：admin.warrior-fitness.net → 後台，其他 → 前台
 * 本機開發：http://admin.localhost:5173 → 後台，http://localhost:5173 → 前台
 * （瀏覽器會把 *.localhost 自動解析到本機，不用改 hosts 檔）
 */
export function getSiteKind(): SiteKind {
  return window.location.hostname.startsWith('admin.') ? 'admin' : 'public';
}
