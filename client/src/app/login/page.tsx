'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store';
import Login from '@/views/Login';

export default function LoginPage() {
  const { user } = useAppStore();
  const router = useRouter();
  useEffect(() => { if (user) router.replace('/'); }, [user, router]);
  return user ? null : <Login />;
}
