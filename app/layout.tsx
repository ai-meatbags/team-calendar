import './globals.css';
import './styles/tailwind.css';
import './styles/styles.css';
import type { ReactNode } from 'react';
import { ClientShell } from './_components/client-shell';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
