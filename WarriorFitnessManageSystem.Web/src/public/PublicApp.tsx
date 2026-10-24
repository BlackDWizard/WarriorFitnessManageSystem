import { Route, Routes } from 'react-router';
import './theme.css';
import PublicLayout from './PublicLayout';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import FaqPage from './pages/FaqPage';
import ContactPage from './pages/ContactPage';
import BookingFormPage from './pages/BookingFormPage';
import NotFoundPage from './pages/NotFoundPage';
import EventsPage from './pages/EventsPage';
import PricingPage from './pages/PricingPage';
import CoachesPage from './pages/CoachesPage';

export default function PublicApp() {
  return (
    <Routes>
      {/* 沒有 path 的 Route 只負責套版面，子路由會顯示在 Layout 的 <Outlet /> 位置 */}
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="coaches" element={<CoachesPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="faq" element={<FaqPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="form" element={<BookingFormPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
