"use client";

import { lazy, Suspense, useState, useEffect, type ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AppProvider, useAppStore } from './store';
import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';
import { useOnboarding, OnboardingModal, GuidedTourOverlay } from './features/onboarding';
import PremiumBackground from './components/ui/PremiumBackground';
import { theme as DS } from './utils/theme';
import { authApi } from './api/auth.api';
import SplashScreen from './components/SplashScreen';

import ScrollEndEffect from './components/ScrollEndEffect';
import AppSidebar from './components/layout/Sidebar';
import GlobalAlert from './components/GlobalAlert';
import { WelcomeToast } from './components/layout/WelcomeToast';
import { useAlertStore } from './stores/useAlertStore';
import { socketService } from './utils/socket';
import { useSocialStore } from './stores/useSocialStore';
import { ThemeProvider } from './components/theme-provider';
import { usePathname, useRouter } from 'next/navigation';
import { ErrorBoundary } from './components/ErrorBoundary';

const BookingSheet = lazy(() => import('./features/booking/BookingSheet'));

function Shell({ children }: { children: ReactNode }) {
  const { bookingCourt, setBookingCourt, user, setUser, isSideBarOpen } = useAppStore();
  const { showOnboarding, showTour, completeOnboarding, skipOnboarding, completeTour } = useOnboarding();
  const { showAlert } = useAlertStore();
  const pathname = usePathname();
  const router = useRouter();

  const handleCompleteOnboarding = (prefs: any) => {
    completeOnboarding(prefs);
    router.push('/');
  };

  const handleSkipOnboarding = () => {
    skipOnboarding();
    router.push('/');
  };

  const [showSplash, setShowSplash] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    setShowSplash(!sessionStorage.getItem('splashShown'));
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

    initAuth();
  }, [setUser]);

  useEffect(() => {
    const clearSession = () => {
      setUser(null);
      setBookingCourt(null);
      socketService.disconnect();
    };
    window.addEventListener('auth:unauthorized', clearSession);
    return () => window.removeEventListener('auth:unauthorized', clearSession);
  }, [setUser, setBookingCourt]);

  useEffect(() => {
    if (!user) {
      socketService.disconnect();
      useSocialStore.setState(useSocialStore.getInitialState(), true);
      return;
    }
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
    const onNotification = (data: any) => handleNoti(data?.title || 'Thông báo mới', data?.message || 'Bạn có một thông báo mới.');
    
    socket.on('join_request_received', onJoinReq);
    socket.on('join_request_accepted', onJoinAcc);
    socket.on('join_request_rejected', onJoinRej);
    socket.on('friend:request', onFriendReq);
    socket.on('notification', onNotification);
    return () => {
        socket.off('join_request_received', onJoinReq);
        socket.off('join_request_accepted', onJoinAcc);
        socket.off('join_request_rejected', onJoinRej);
        socket.off('friend:request', onFriendReq);
        socket.off('notification', onNotification);
    };
  }, [user, showAlert]);

  const isLoginPage = pathname === '/login';

  return (
    <div className={`min-h-screen ${DS.bg.base} relative overflow-hidden`}>
      <AnimatePresence>
        {showSplash && <SplashScreen isLoading={isCheckingAuth} onComplete={() => {
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
          {!isLoginPage && user?.role !== 'court_owner' && <AppSidebar />}

          <main
            className={`flex-1 transition-all duration-300 ease-in-out ${!isLoginPage ? 'pt-16' : ''} pl-0 w-full min-h-screen`}
          >
            <Suspense fallback={
              <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
                <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin"></div>
              </div>
            }>
              {children}
            </Suspense>
          </main>
          
          <ScrollEndEffect />

          <AnimatePresence>
            {['/', '/map', '/search', '/profile', '/admin', '/groupplay'].includes(pathname) && !isSideBarOpen && (
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

export default function App({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <AppProvider>
          <GlobalAlert />
          <WelcomeToast />
          <Shell>{children}</Shell>
        </AppProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
