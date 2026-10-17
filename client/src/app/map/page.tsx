'use client';

import dynamic from 'next/dynamic';
import Loading from '../loading';

export default dynamic(() => import('@/views/MapPage'), { ssr: false, loading: Loading });
