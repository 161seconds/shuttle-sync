'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store';
import Dashboard from '@/views/Dashboard';

export default function HomePage() {
  const { user } = useAppStore();
  const router = useRouter();
  const destination = user?.role === 'court_owner' ? '/owner/dashboard' : user?.role === 'admin' ? '/admin' : null;
  useEffect(() => { if (destination) router.replace(destination); }, [destination, router]);
  return destination ? null : <Dashboard />;
}
