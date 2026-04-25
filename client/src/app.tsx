import './app.css';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AppProvider, useAppStore } from './store';
import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';
import Dashboard from './pages/Dashboard';
import MapPage from './pages/MapPage';
import SearchPage from './pages/SearchPage';
import ProfilePage from './pages/ProfilePage';
import CourtDetail from './pages/CourtDetail';
import BookingSheet from './features/booking/BookingSheet';
import { useOnboarding, OnboardingModal, GuidedTourOverlay } from './features/onboarding';
import { theme as DS } from './utils/theme';
import type { Court } from './types';

function Shell() {
  const { page, bookingCourt, setBookingCourt } = useAppStore();
  const [detailCourt, setDetailCourt] = useState<Court | null>(null);
  const { showOnboarding, showTour, completeOnboarding, skipOnboarding, completeTour } = useOnboarding();

  // Court detail full-screen view
  if (detailCourt) {
    return <CourtDetail court={detailCourt} onBack={() => setDetailCourt(null)} />;
  }

  return (
    <div className={`min-h-screen ${DS.bg.base}`}>
      {/* Onboarding modal — shown once for new users */}
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingModal
            onComplete={completeOnboarding}
            onSkip={skipOnboarding}
          />
        )}
      </AnimatePresence>

      {/* Main app — only visible after onboarding */}
      {!showOnboarding && (
        <>
          <Header />

          <AnimatePresence mode="wait">
            {page === 'home' && <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Dashboard /></motion.div>}
            {page === 'map' && <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><MapPage /></motion.div>}
            {page === 'search' && <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><SearchPage /></motion.div>}
            {page === 'profile' && <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><ProfilePage /></motion.div>}
          </AnimatePresence>

          <BottomNav />

          <AnimatePresence>
            {bookingCourt && <BookingSheet court={bookingCourt} onClose={() => setBookingCourt(null)} />}
          </AnimatePresence>

          {/* Guided tour — shown after onboarding completes */}
          <AnimatePresence>
            {showTour && <GuidedTourOverlay onComplete={completeTour} />}
          </AnimatePresence>
        </>
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