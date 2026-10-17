import type { Metadata } from 'next';
import { Suspense, type ReactNode } from 'react';
import Script from 'next/script';
import '@fontsource-variable/geist/index.css';
import '../app.css';
import App from '../app';
import Loading from './loading';

export const metadata: Metadata = {
  title: 'ShuttleSync',
  description: 'Đặt sân, ghép kèo và quản lý sân thể thao.',
  referrer: 'no-referrer',
  icons: { icon: { url: '/shuttlesync-mark.svg', type: 'image/svg+xml' } },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className="dark" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://unpkg.com/@vietmap/vietmap-gl-js@6.0.1/dist/vietmap-gl.css" />
      </head>
      <body>
        <Script src="https://unpkg.com/@vietmap/vietmap-gl-js@6.0.1/dist/vietmap-gl.js" strategy="beforeInteractive" />
        <Suspense fallback={<Loading />}>
          <App>{children}</App>
        </Suspense>
      </body>
    </html>
  );
}
