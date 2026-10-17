'use client';

import { useRouter } from 'next/navigation';
import Notifications from '@/views/profile/Notifications';

export default function Page() {
  const router = useRouter();
  return <Notifications onBack={() => router.back()} />;
}
