'use client';

import { useRouter } from 'next/navigation';
import MatchLeaderboard from '@/components/groups/MatchLeaderboard';

export default function Page() {
  const router = useRouter();
  return <MatchLeaderboard onBack={() => router.back()} />;
}
