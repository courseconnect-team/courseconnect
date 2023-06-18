import './globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/firebase/auth/auth_context';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Course Connect',
  description: 'Hiring management for students, faculty, and administrators.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
