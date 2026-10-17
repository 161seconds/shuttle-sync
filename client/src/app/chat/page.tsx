'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store';
import Chat from '@/views/chat/ChatPage';

export default function ChatPage() {
  const { user } = useAppStore();
  const router = useRouter();
  useEffect(() => { if (!user) router.replace('/login'); }, [user, router]);
  return user ? <Chat /> : null;
}
