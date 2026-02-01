'use client';

import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { LogInCard } from '@/component/LogInCard/LogInCard';
import { SignUpCard } from '@/component/SignUpCard/SignUpCard';

export default function AuthSwitcher() {
  const [signup, setSignup] = useState(false);

  return (
    <>
      <Toaster />
      {signup ? (
        <SignUpCard className="" setSignup={setSignup} />
      ) : (
        <LogInCard className="" setSignup={setSignup} />
      )}
    </>
  );
}
