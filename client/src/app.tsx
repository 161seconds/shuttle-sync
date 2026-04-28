import './app.css';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AppProvider, useAppStore } from './store';
import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';
import Dashboard from './pages/Dashboard';
import MapPage from './pages/MapPage';
import SearchPage from './pages/SearchPage';
import ProfilePage from './pages/ProfilePage';
import CourtDetail from './pages/CourtDetail';
import Login from './pages/Login';
import BookingSheet from './features/booking/BookingSheet';
import { useOnboarding, OnboardingModal, GuidedTourOverlay } from './features/onboarding';
import { ParticleField } from './components/onboarding/Shared';
import { theme as DS } from './utils/theme';
import type { Court } from './types';
import { authApi } from './api/auth.api';

function Shell() {
  const { page, setPage, bookingCourt, setBookingCourt, user, setUser } = useAppStore();
  const [detailCourt, setDetailCourt] = useState<Court | null>(null);
  const { showOnboarding, showTour, completeOnboarding, skipOnboarding, completeTour } = useOnboarding();

  // TỰ ĐỘNG KHÔI PHỤC ĐĂNG NHẬP KHI TẢI LẠI TRANG (F5)
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token && !user) {
        try {
          const res = await authApi.getMe();
          setUser(res.data.user || res.data);
        } catch (error) {
          console.error("Phiên đăng nhập hết hạn:", error);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setUser(null);
          setPage('login');
        }
      }
    };
    initAuth();
  }, []);

  useEffect(() => {
    if (user && page === 'login') {
      setPage('home');
    }
  }, [user, page, setPage]);

  if (detailCourt) {
    return <CourtDetail court={detailCourt} onBack={() => setDetailCourt(null)} />;
  }

  return (
    // 👇 2. ĐẢM BẢO LỚP NỀN CÓ MÀU TỐI DS.bg.base
    <div className={`min-h-screen ${DS.bg.base} relative overflow-hidden`}>

      {/* 👇 3. CHÈN NỀN HẠT 3D TOÀN CỤC Ở ĐÂY 👇 */}
      {/* Chúng ta để pointer-events-none để nó không chặn cú click, và z-0 để nằm dưới cùng */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <ParticleField />
      </div>

      <AnimatePresence>
        {/* OnboardingModal bên trong đã có sẵn ParticleField riêng nên ko lo */}
        {showOnboarding && <OnboardingModal onComplete={completeOnboarding} onSkip={skipOnboarding} />}
      </AnimatePresence>

      {!showOnboarding && (
        // 👇 4. BỌC TOÀN BỘ NỘI DUNG VÀO relative z-10 ĐỂ NẰM TRÊN NỀN HẠT
        <div className="relative z-10 flex flex-col min-h-screen">
          {/* 3. ẨN HEADER Ở TRANG LOGIN */}
          {page !== 'login' && <Header />}

          <main className="flex-1">
            <AnimatePresence mode="wait">
              {/* 4. KHAI BÁO HIỂN THỊ TRANG LOGIN */}
              {page === 'login' && <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Login /></motion.div>}

              {page === 'home' && <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Dashboard /></motion.div>}
              {page === 'map' && <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><MapPage /></motion.div>}
              {page === 'search' && <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><SearchPage /></motion.div>}
              {page === 'profile' && <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><ProfilePage /></motion.div>}
              {/* {page === 'edit-profile' && <EditProfilePage key="edit" />}
              {page === 'favorites' && <FavoritesPage key="fav" />}
              {page === 'history' && <BookingHistoryPage key="history" />}
              {page === 'tournaments' && <TournamentsPage key="tour" />}
              {page === 'groups' && <GroupsPage key="groups" />}
              {page === 'notifications' && <NotificationsPage key="notif" />}
              {page === 'settings' && <SettingsPage key="settings" />} */}
            </AnimatePresence>
          </main>

          {/* 5. ẨN BOTTOM NAV Ở TRANG LOGIN */}
          {page !== 'login' && <BottomNav />}

          <AnimatePresence>
            {bookingCourt && <BookingSheet court={bookingCourt} onClose={() => setBookingCourt(null)} />}
          </AnimatePresence>

          <AnimatePresence>
            {showTour && page != 'login' && <GuidedTourOverlay onComplete={completeTour} />}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}