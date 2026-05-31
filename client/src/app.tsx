import './app.css';
import { useState, useEffect, useRef } from 'react';
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
import GroupPlayPage from './pages/GroupPlay';
import AiCoach from './pages/AiCoach';
import Notifications from './pages/profile/Notifications';
import AppSidebar from './components/layout/Sidebar';
import AdminDashboard from './features/admin/AdminDashboard';
import MatchLeaderboard from './components/groups/MatchLeaderboard';
import RulesPage from './pages/RulesPage';
import SupplementaryPage from './pages/SupplementaryPage';
import ChatPage from './pages/chat/ChatPage';
import NewsPage from './pages/NewsPage';
import { Loader2 } from 'lucide-react';
import GlobalAlert from './components/GlobalAlert';

function PremiumBackground() {
  const lightRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    let rafId: number;
    const handleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (lightRef.current) {
          // Di chuyển đốm sáng đi theo chuột (trừ đi một nửa kích thước để căn giữa)
          lightRef.current.style.transform = `translate(${e.clientX - 400}px, ${e.clientY - 400}px)`;
        }
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#060809]">
      {/* 1. Aurora Gradient Glows (Góc trái trên và góc phải dưới) */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-500/10 blur-[150px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[150px]" />
      
      {/* 2. Micro-dot pattern cực mờ tạo cảm giác tinh tế */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] bg-[size:32px_32px] opacity-15" />

      {/* 3. Mouse Follower Glow (Ánh sáng mềm mại đi theo chuột) */}
      <div 
        ref={lightRef}
        className="absolute top-0 left-0 w-[800px] h-[800px] bg-emerald-400/5 rounded-full blur-[100px] will-change-transform"
      />
      
      {/* 4. Particle Field cũ được làm mờ bớt để không rối mắt */}
      <div className="opacity-20 mix-blend-screen">
        <ParticleField />
      </div>
    </div>
  );
}

function Shell() {
  const { page, setPage, bookingCourt, setBookingCourt, user, setUser, isSideBarOpen } = useAppStore();
  const [detailCourt, setDetailCourt] = useState<Court | null>(null);
  const { showOnboarding, showTour, completeOnboarding, skipOnboarding, completeTour } = useOnboarding();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await authApi.getMe();
        const userData = res.data?.data?.user || res.data?.data || res.data?.user || res.data;
        setUser(userData);
      } catch (error) {
        console.log("Phiên đăng nhập không tồn tại hoặc Cookie hết hạn");
        setUser(null);
        // Lưu ý: Không tự động đá về 'login' ở đây để khách vẫn xem được trang chủ khi chưa đăng nhập
      } finally {
        setIsCheckingAuth(false);
      }
    };
    initAuth();
  }, [setUser]);

  useEffect(() => {
    // Chỉ đá sang home nếu user ĐÃ đăng nhập mà lại rớt vào trang login
    if (user && page === 'login') {
      setPage('home');
    }
  }, [user, page, setPage]);

  // MÀN HÌNH CHỜ TRONG LÚC APP KIỂM TRA COOKIE (Tránh nháy giao diện)
  if (isCheckingAuth) {
    return (
      <div className="w-screen h-screen bg-[#0a0a0a] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
        <p className="text-emerald-400 font-medium text-sm">Đang tải dữ liệu ShuttleSync...</p>
      </div>
    );
  }

  if (detailCourt) {
    return <CourtDetail court={detailCourt} onBack={() => setDetailCourt(null)} />;
  }

  return (
    <div className={`min-h-screen ${DS.bg.base} relative overflow-hidden`}>

      <PremiumBackground />

      <AnimatePresence>
        {showOnboarding && <OnboardingModal onComplete={completeOnboarding} onSkip={skipOnboarding} />}
      </AnimatePresence>

      {!showOnboarding && (
        <div className="relative z-10 flex flex-col min-h-screen">

          {page !== 'login' && <Header />}
          {page !== 'login' && page !== 'map' && <AppSidebar />}

          <main
            className={`flex-1 transition-all duration-300 ease-in-out ${page !== 'login' ? 'pt-16' : ''} ${(isSideBarOpen && page !== 'login' && page !== 'map') ? 'md:pl-64 pl-0' : 'pl-0'
              } w-full min-h-screen`}
          >
            <AnimatePresence mode="wait">
              {page === 'login' && <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Login /></motion.div>}
              {page === 'home' && <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Dashboard /></motion.div>}
              {page === 'map' && <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><MapPage /></motion.div>}
              {page === 'search' && <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><SearchPage /></motion.div>}
              {page === 'profile' && <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><ProfilePage /></motion.div>}
              {page === 'groupplay' && <motion.div key="group-play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><GroupPlayPage /></motion.div>}
              {page === 'aicoach' && <motion.div key="aicoach" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><AiCoach /></motion.div>}
              {page === 'admin' && <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><AdminDashboard /></motion.div>}
              {page === 'notifications' && <motion.div key="noti" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Notifications onBack={() => setPage('home')} /></motion.div>}
              {page === 'match-leaderboard' && <motion.div key="leaderboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><MatchLeaderboard onBack={() => setPage('groupplay')} /></motion.div>}
              {page === 'rules' && <motion.div key="rules" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><RulesPage /></motion.div>}
              {page === 'supplementary' && <motion.div key="supplementary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><SupplementaryPage /></motion.div>}
              {page === 'chat' && <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><ChatPage /></motion.div>}
              {page === 'news' && <motion.div key="news" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><NewsPage /></motion.div>}
            </AnimatePresence>
          </main>

          {['home', 'map', 'search', 'groupplay', 'profile'].includes(page) && (
            <BottomNav />
          )}

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
      <GlobalAlert />
    </AppProvider>
  );
}