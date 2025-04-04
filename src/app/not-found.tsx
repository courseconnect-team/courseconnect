'use client';
import HeaderCard from '@/components/HeaderCard/HeaderCard';
import Link from 'next/link';
import { Toaster } from 'react-hot-toast';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';
import SmallHeader from '@/components/SmallHeader/SmallHeader';

export default function NotFound() {
  useEffect(() => {
    const timer = setTimeout(() => {
      redirect('/dashboard');
    }, 100000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <>
      <Toaster />
      <SmallHeader />

      <div
        style={{
          display: 'flex',
          textAlign: 'center',
          marginTop: '280px',
          flexDirection: 'column',
        }}
      >
        <div style={{ fontSize: '36px', fontFamily: 'SF Pro Display-Bold' }}>
          🚧
        </div>
        <div style={{ fontSize: '36px', fontFamily: 'SF Pro Display-Bold' }}>
          404
        </div>
        <div style={{ fontSize: '36px', fontFamily: 'SF Pro Display-Bold' }}>
          This page could not be found.
        </div>
        <div style={{ fontSize: '20px', fontFamily: 'SF Pro Display-Bold' }}>
          Please contact{' '}
          <a
            href="mailto:courseconnect.team@gmail.com"
            style={{ color: 'black', textDecoration: 'underline' }}
          >
            courseconnect.team@gmail.com
          </a>{' '}
          for further assistance.{' '}
        </div>
        <Link
          href="/dashboard"
          style={{ color: 'black', textDecoration: 'underline' }}
        >
          Return to Home
        </Link>
      </div>
    </>
  );
}
