import './globals.css';
import './styles/tailwind.css';
import './styles/styles.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ClientShell } from './_components/client-shell';

export const metadata: Metadata = {
  title: 'Team Calendar',
  icons: {
    icon: '/favicon.svg'
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
