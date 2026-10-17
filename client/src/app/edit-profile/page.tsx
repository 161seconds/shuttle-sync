'use client';

import { useRouter } from 'next/navigation';
import EditProfile from '@/views/profile/EditProfile';

export default function Page() {
  const router = useRouter();
  return <EditProfile onBack={() => router.back()} />;
}
