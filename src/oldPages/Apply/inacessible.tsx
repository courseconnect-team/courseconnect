'use client';
import HeaderCard from '@/component/HeaderCard/HeaderCard';
import SmallHeader from '@/component/SmallHeader/SmallHeader';
import { Toaster } from 'react-hot-toast';
import Link from 'next/link';

export default function Application() {
  return (
    <>
      <Toaster />
      <SmallHeader />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          marginTop: '250px',
          fontFamily: 'SF Pro Display-Bold',
        }}
      >
        <div
          style={{
            padding: '40px',
            textAlign: 'center',
            maxWidth: '700px',
          }}
        >
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>
            Sorry, it looks like applications aren&apos;t open yet for the next
            semester!
          </div>
          <div style={{ fontSize: '20px', marginBottom: '8px' }}>
            Please check back later for more information regarding open
            positions.
          </div>

          <div style={{ fontSize: '20px', marginInline: '10px' }}>
            If you have any questions, please contact{' '}
            <a
              href="mailto:courseconnect.team@gmail.com"
              style={{ textDecoration: 'underline', color: 'black' }}
            >
              courseconnect.team@gmail.com
            </a>{' '}
            for further assistance.
          </div>
          <Link
            href="/dashboard"
            style={{
              textDecoration: 'underline',
              color: 'black',
              marginTop: '8px',
            }}
          >
            Return to Home
          </Link>
        </div>
      </div>
    </>
  );
}
