import './app.css';
import { useState } from 'react';
import { AppProvider, useAppStore } from './store';
import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';
import Dashboard from './pages/Dashboard';
import MapPage from './pages/MapPage';
import SearchPage from './pages/SearchPage';
import ProfilePage from './pages/ProfilePage';
import Login from './pages/Login';
import CourtDetail from './pages/CourtDetail';
import BookingSheet from './features/booking/BookingSheet';
import AdminDashboard from './features/admin/AdminDashboard';
import type { Court } from './types';

function AppContent() {
  const { page, bookingCourt, setBookingCourt, user } = useAppStore();
  const [detailCourt, setDetailCourt] = useState<Court | null>(null);

  if (detailCourt) {
    return <CourtDetail court={detailCourt} onBack={() => setDetailCourt(null)} />;
  }
  // if (!user && page === 'login') {
  //   return <Login />;
  // }

  if (user?.role === 'admin' && page === 'admin') {
    return <AdminDashboard />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />

      <main>
        {page === 'home' && <Dashboard />}
        {page === 'map' && <MapPage />}
        {page === 'search' && <SearchPage />}
        {page === 'profile' && <ProfilePage />}

        {/* Thêm trang Login vào đây nếu bạn điều hướng nó qua biến 'page' */}
        {page === 'login' && <Login />}
      </main>

      <BottomNav />

      {/* Booking sheet overlay */}
      {bookingCourt && (
        <BookingSheet
          court={bookingCourt}
          onClose={() => setBookingCourt(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}