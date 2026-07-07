import './app.css';
import { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AppProvider, useAppStore } from './store';
import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';
export const pageImports = {
  Dashboard: () => import('./pages/Dashboard'),
  MapPage: () => import('./pages/MapPage'),
  SearchPage: () => import('./pages/SearchPage'),
  ProfilePage: () => import('./pages/ProfilePage'),
  CourtDetail: () => import('./pages/CourtDetail'),
  Login: () => import('./pages/Login'),
  BookingSheet: () => import('./features/booking/BookingSheet'),
  GroupPlayPage: () => import('./pages/GroupPlay'),
  AiCoach: () => import('./pages/AiCoach'),
  Notifications: () => import('./pages/profile/Notifications'),
  EditProfile: () => import('./pages/profile/EditProfile'),
  AdminDashboard: () => import('./features/admin/AdminDashboard'),
  MatchLeaderboard: () => import('./components/groups/MatchLeaderboard'),
  RulesPage: () => import('./pages/RulesPage'),
  SupplementaryPage: () => import('./pages/SupplementaryPage'),
  ChatPage: () => import('./pages/chat/ChatPage'),
  NewsPage: () => import('./pages/NewsPage'),
  SupportPage: () => import('./pages/SupportPage'),
};

const Dashboard = lazy(pageImports.Dashboard);
const MapPage = lazy(pageImports.MapPage);
const SearchPage = lazy(pageImports.SearchPage);
const ProfilePage = lazy(pageImports.ProfilePage);
const CourtDetail = lazy(pageImports.CourtDetail);
const Login = lazy(pageImports.Login);
const BookingSheet = lazy(pageImports.BookingSheet);
const GroupPlayPage = lazy(pageImports.GroupPlayPage);
const AiCoach = lazy(pageImports.AiCoach);
const Notifications = lazy(pageImports.Notifications);
const EditProfile = lazy(pageImports.EditProfile);
const AdminDashboard = lazy(pageImports.AdminDashboard);
const MatchLeaderboard = lazy(pageImports.MatchLeaderboard);
const RulesPage = lazy(pageImports.RulesPage);
const SupplementaryPage = lazy(pageImports.SupplementaryPage);
const ChatPage = lazy(pageImports.ChatPage);
const NewsPage = lazy(pageImports.NewsPage);
const SupportPage = lazy(pageImports.SupportPage);

import { useOnboarding, OnboardingModal, GuidedTourOverlay } from './features/onboarding';
import { ParticleField } from './components/onboarding/Shared';
import DotField from './components/ui/DotField';
import { theme as DS } from './utils/theme';
import type { Court } from './types';
import { authApi } from './api/auth.api';
import SplashScreen from './components/SplashScreen';

import ScrollEndEffect from './components/ScrollEndEffect';
import AppSidebar from './components/layout/Sidebar';
import GlobalAlert from './components/GlobalAlert';
import { useAlertStore } from './stores/useAlertStore';
import { socketService } from './utils/socket';
import { ThemeProvider } from './components/theme-provider';

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
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-background">
      {/* 1. Aurora Gradient Glows (Góc trái trên và góc phải dưới) */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-500/10 blur-[150px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[150px]" />

      {/* 2. Interactive DotField (Hidden on mobile) */}
      <div className="absolute inset-0 opacity-70 dark:opacity-100 z-0 hidden md:block">
        <DotField
          dotRadius={1.2}
          dotSpacing={22}
          bulgeStrength={20}
          glowRadius={120}
          sparkle={false}
          waveAmplitude={0}
          cursorRadius={120}
          cursorForce={1}
          bulgeOnly
          gradientFrom="#10B981"
          gradientTo="#3b82f6"
          glowColor="transparent"
        />
      </div>

      {/* 3. Mouse Follower Glow (Ánh sáng mềm mại đi theo chuột) (Hidden on mobile) */}
      <div
        ref={lightRef}
        className="absolute top-0 left-0 w-[800px] h-[800px] bg-emerald-500/10 dark:bg-emerald-400/5 rounded-full blur-[100px] will-change-transform hidden md:block"
      />

      {/* 4. Particle Field cũ được điều chỉnh (Hidden on mobile) */}
      <div className="opacity-40 dark:opacity-20 dark:mix-blend-screen hidden md:block">
        <ParticleField />
      </div>
    </div>
  );
}

import { BrowserRouter, Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';

function Shell() {
  const { bookingCourt, setBookingCourt, user, setUser, isSideBarOpen } = useAppStore();
  const [detailCourt, setDetailCourt] = useState<Court | null>(null);
  const { showOnboarding, showTour, completeOnboarding, skipOnboarding, completeTour } = useOnboarding();
  const { showAlert } = useAlertStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleCompleteOnboarding = (prefs: any) => {
    completeOnboarding(prefs);
    navigate('/');
  };

  const handleSkipOnboarding = () => {
    skipOnboarding();
    navigate('/');
  };

  const [showSplash, setShowSplash] = useState(() => !sessionStorage.getItem('splashShown'));
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isPreloading, setIsPreloading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const res: any = await Promise.race([
          authApi.getMe(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 25000))
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

    const preloadPages = () => {
      // Bỏ preload tất cả trang cùng lúc để tránh giật lag (chặn luồng main thread).
      // Các chunk sẽ được load lazy khi user bấm vào.
      setIsPreloading(false);
    };

    initAuth();
    if (showSplash) {
      preloadPages();
    } else {
      setIsPreloading(false);
    }
  }, [setUser, showSplash]);

  useEffect(() => {
    if (!user) return;
    socketService.connect('');
    const socket = socketService.getSocket();
    if (!socket) return;
    const handleNoti = (title: string, message: string) => {
        showAlert(message, title, 'success');
        window.dispatchEvent(new Event('refresh_notifications'));
        window.dispatchEvent(new Event('refresh_chat_rooms'));
    };
    const onJoinReq = () => handleNoti('Yêu cầu tham gia mới', 'Có người vừa xin vào nhóm của bạn!');
    const onJoinAcc = () => handleNoti('Đã được duyệt!', 'Chủ sân đã đồng ý cho bạn vào nhóm. Vào chat ngay!');
    const onJoinRej = () => handleNoti('Bị từ chối', 'Rất tiếc, chủ sân đã từ chối yêu cầu của bạn.');
    const onFriendReq = (data: any) => handleNoti('Lời mời kết bạn', `${data?.requesterName || 'Ai đó'} đã gửi cho bạn lời mời kết bạn.`);
    
    socket.on('join_request_received', onJoinReq);
    socket.on('join_request_accepted', onJoinAcc);
    socket.on('join_request_rejected', onJoinRej);
    socket.on('friend:request', onFriendReq);
    return () => {
        socket.off('join_request_received', onJoinReq);
        socket.off('join_request_accepted', onJoinAcc);
        socket.off('join_request_rejected', onJoinRej);
        socket.off('friend:request', onFriendReq);
    };
  }, [user, showAlert]);

  if (detailCourt) {
    return <CourtDetail court={detailCourt} onBack={() => setDetailCourt(null)} />;
  }

  const isLoginPage = location.pathname === '/login';

  return (
    <div className={`min-h-screen ${DS.bg.base} relative overflow-hidden`}>
      <AnimatePresence>
        {showSplash && <SplashScreen isLoading={isCheckingAuth || isPreloading} onComplete={() => {
            setShowSplash(false);
            sessionStorage.setItem('splashShown', 'true');
        }} />}
      </AnimatePresence>

      <PremiumBackground />

      <AnimatePresence>
        {showOnboarding && !isCheckingAuth && <OnboardingModal onComplete={handleCompleteOnboarding} onSkip={handleSkipOnboarding} />}
      </AnimatePresence>

      {!showOnboarding && !isCheckingAuth && (
        <div className="relative z-10 flex flex-col min-h-screen">
          {!isLoginPage && <Header />}
          {!isLoginPage && <AppSidebar />}

          <main
            className={`flex-1 transition-all duration-300 ease-in-out ${!isLoginPage ? 'pt-16' : ''} pl-0 w-full min-h-screen`}
          >
            <Suspense fallback={
              <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
                <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin"></div>
              </div>
            }>
              <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                  <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/map" element={<MapPage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/edit-profile" element={<EditProfile onBack={() => window.history.back()} />} />
                  <Route path="/groupplay" element={<GroupPlayPage />} />
                  <Route path="/aicoach" element={<AiCoach />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/notifications" element={<Notifications onBack={() => window.history.back()} />} />
                  <Route path="/match-leaderboard" element={<MatchLeaderboard onBack={() => window.history.back()} />} />
                  <Route path="/rules" element={<RulesPage />} />
                  <Route path="/supplementary" element={<SupplementaryPage />} />
                  <Route path="/chat" element={user ? <ChatPage /> : <Navigate to="/login" replace />} />
                  <Route path="/news" element={<NewsPage />} />
                  <Route path="/support" element={<SupportPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AnimatePresence>
            </Suspense>
          </main>
          
          <ScrollEndEffect />

          <AnimatePresence>
            {['/', '/map', '/search', '/profile'].includes(location.pathname) && !isSideBarOpen && (
              <BottomNav key="bottom-nav" />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {bookingCourt && <BookingSheet court={bookingCourt} onClose={() => setBookingCourt(null)} />}
          </AnimatePresence>

          <AnimatePresence>
            {showTour && !isLoginPage && <GuidedTourOverlay onComplete={completeTour} />}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <BrowserRouter>
          <AppProvider>
            <Shell />
            <GlobalAlert />
          </AppProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}