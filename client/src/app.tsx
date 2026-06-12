import './app.css';
import { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AppProvider, useAppStore } from './store';
import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';
const Dashboard = lazy(() => import('./pages/Dashboard'));
const MapPage = lazy(() => import('./pages/MapPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const CourtDetail = lazy(() => import('./pages/CourtDetail'));
const Login = lazy(() => import('./pages/Login'));
const BookingSheet = lazy(() => import('./features/booking/BookingSheet'));
const GroupPlayPage = lazy(() => import('./pages/GroupPlay'));
const AiCoach = lazy(() => import('./pages/AiCoach'));
const Notifications = lazy(() => import('./pages/profile/Notifications'));
const EditProfile = lazy(() => import('./pages/profile/EditProfile'));
const AdminDashboard = lazy(() => import('./features/admin/AdminDashboard'));
const MatchLeaderboard = lazy(() => import('./components/groups/MatchLeaderboard'));
const RulesPage = lazy(() => import('./pages/RulesPage'));
const SupplementaryPage = lazy(() => import('./pages/SupplementaryPage'));
const ChatPage = lazy(() => import('./pages/chat/ChatPage'));
const NewsPage = lazy(() => import('./pages/NewsPage'));
const SupportPage = lazy(() => import('./pages/SupportPage'));

import { useOnboarding, OnboardingModal, GuidedTourOverlay } from './features/onboarding';
import { ParticleField } from './components/onboarding/Shared';
import { theme as DS } from './utils/theme';
import type { Court } from './types';
import { authApi } from './api/auth.api';
import SplashScreen from './components/SplashScreen';
import AppSidebar from './components/layout/Sidebar';
import GlobalAlert from './components/GlobalAlert';
import { useAlertStore } from './stores/useAlertStore';
import { socketService } from './utils/socket';

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
  const { showAlert } = useAlertStore();

  const [showSplash, setShowSplash] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Đảm bảo không bị treo quá 5s nếu backend bị đứng
        const res: any = await Promise.race([
          authApi.getMe(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
        ]);
        const userData = res.data?.data?.user || res.data?.data || res.data?.user || res.data;
        setUser(userData);
      } catch (error) {
        console.log("Phiên đăng nhập không tồn tại hoặc lỗi kết nối");
        setUser(null);
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

    // Yêu cầu đăng nhập nếu vào trang chat
    if (!user && page === 'chat' && !isCheckingAuth) {
      showAlert('Vui lòng đăng nhập để sử dụng tính năng Trò chuyện', 'Yêu cầu đăng nhập', 'warning');
      setPage('login');
    }
  }, [user, page, setPage, isCheckingAuth, showAlert]);

  // Global Socket cho Thông báo
  useEffect(() => {
    if (!user) return;

    socketService.connect('');
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleNoti = (title: string, message: string) => {
        showAlert(message, title, 'success');
        window.dispatchEvent(new Event('refresh_notifications'));
        window.dispatchEvent(new Event('refresh_chat_rooms')); // Update chat rooms too
    };

    const onJoinReq = () => handleNoti('Yêu cầu tham gia mới', 'Có người vừa xin vào nhóm của bạn!');
    const onJoinAcc = () => handleNoti('Đã được duyệt!', 'Chủ sân đã đồng ý cho bạn vào nhóm. Vào chat ngay!');
    const onJoinRej = () => handleNoti('Bị từ chối', 'Rất tiếc, chủ sân đã từ chối yêu cầu của bạn.');

    socket.on('join_request_received', onJoinReq);
    socket.on('join_request_accepted', onJoinAcc);
    socket.on('join_request_rejected', onJoinRej);

    return () => {
        socket.off('join_request_received', onJoinReq);
        socket.off('join_request_accepted', onJoinAcc);
        socket.off('join_request_rejected', onJoinRej);
    };
  }, [user, showAlert]);

  // Gộp chung thời gian check Auth vào Splash Screen để không bị nháy giao diện

  if (detailCourt) {
    return <CourtDetail court={detailCourt} onBack={() => setDetailCourt(null)} />;
  }

  return (
    <div className={`min-h-screen ${DS.bg.base} relative overflow-hidden`}>
      <AnimatePresence>
        {(showSplash || isCheckingAuth) && <SplashScreen isLoading={isCheckingAuth} onComplete={() => setShowSplash(false)} />}
      </AnimatePresence>

      <PremiumBackground />

      <AnimatePresence>
        {showOnboarding && !isCheckingAuth && <OnboardingModal onComplete={completeOnboarding} onSkip={skipOnboarding} />}
      </AnimatePresence>

      {!showOnboarding && !isCheckingAuth && (
        <div className="relative z-10 flex flex-col min-h-screen">

          {page !== 'login' && <Header />}
          {page !== 'login' && page !== 'map' && <AppSidebar />}

          <main
            className={`flex-1 transition-all duration-300 ease-in-out ${page !== 'login' ? 'pt-16' : ''} ${(isSideBarOpen && page !== 'login' && page !== 'map') ? 'md:pl-64 pl-0' : 'pl-0'
              } w-full min-h-screen`}
          >
            <Suspense fallback={
              <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
                <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin"></div>
              </div>
            }>
              <AnimatePresence mode="wait">
                {page === 'login' && <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Login /></motion.div>}
                {page === 'home' && <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Dashboard /></motion.div>}
                {page === 'map' && <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><MapPage /></motion.div>}
                {page === 'search' && <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><SearchPage /></motion.div>}
                {page === 'profile' && <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><ProfilePage /></motion.div>}
                {page === 'edit-profile' && <motion.div key="edit-profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><EditProfile onBack={() => setPage('profile')} /></motion.div>}
                {page === 'groupplay' && <motion.div key="group-play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><GroupPlayPage /></motion.div>}
                {page === 'aicoach' && <motion.div key="aicoach" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><AiCoach /></motion.div>}
                {page === 'admin' && <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><AdminDashboard /></motion.div>}
                {page === 'notifications' && <motion.div key="noti" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Notifications onBack={() => setPage('home')} /></motion.div>}
                {page === 'match-leaderboard' && <motion.div key="leaderboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><MatchLeaderboard onBack={() => setPage('groupplay')} /></motion.div>}
                {page === 'rules' && <motion.div key="rules" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><RulesPage /></motion.div>}
                {page === 'supplementary' && <motion.div key="supplementary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><SupplementaryPage /></motion.div>}
                {page === 'chat' && <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><ChatPage /></motion.div>}
                {page === 'news' && <motion.div key="news" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><NewsPage /></motion.div>}
                {page === 'support' && <motion.div key="support" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><SupportPage /></motion.div>}
              </AnimatePresence>
            </Suspense>
          </main>

          <AnimatePresence>
            {['home', 'map', 'search', 'profile'].includes(page) && !isSideBarOpen && (
              <BottomNav key="bottom-nav" />
            )}
          </AnimatePresence>

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