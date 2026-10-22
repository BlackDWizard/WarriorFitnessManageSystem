import { lazy, Suspense } from 'react';
import { getSiteKind } from './site';

// lazy 讓前台、後台各自打包成獨立的檔案：
// 一般訪客只會下載前台的程式，後台的程式碼與樣式不會被載入
const AdminApp = lazy(() => import('./AdminApp'));
const PublicApp = lazy(() => import('./public/PublicApp'));

const siteKind = getSiteKind();

export default function App() {
  return (
    <Suspense fallback={null}>
      {siteKind === 'admin' ? <AdminApp /> : <PublicApp />}
    </Suspense>
  );
}
