import { Route, Routes } from 'react-router';
import './theme.css';
import PublicLayout from './PublicLayout';
import HomePage from './pages/HomePage';
import PlaceholderPage from './pages/PlaceholderPage';
import NotFoundPage from './pages/NotFoundPage';

export default function PublicApp() {
  return (
    <Routes>
      {/* 沒有 path 的 Route 只負責套版面，子路由會顯示在 Layout 的 <Outlet /> 位置 */}
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="events" element={<PlaceholderPage title="最新活動" />} />   {/* Day 3 */}
        <Route path="pricing" element={<PlaceholderPage title="課程費用" />} />  {/* Day 5 */}
        <Route path="coaches" element={<PlaceholderPage title="教練師資" />} />  {/* Day 6 */}
        <Route path="about" element={<PlaceholderPage title="關於我們" />} />    {/* Day 7 */}
        <Route path="faq" element={<PlaceholderPage title="常見問題" />} />      {/* Day 7 */}
        <Route path="contact" element={<PlaceholderPage title="聯絡我們" />} />  {/* Day 8 */}
        <Route path="form" element={<PlaceholderPage title="填寫表單" />} />     {/* Day 11 */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
