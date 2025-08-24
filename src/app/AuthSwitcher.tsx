'use client';

import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { LogInCard } from '@/componentsd/LogInCard/LogInCard';
import { SignUpCard } from '@/componentsd/SignUpCard/SignUpCard';

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
