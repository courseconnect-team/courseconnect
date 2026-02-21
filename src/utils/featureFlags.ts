export const isE2EMode = (): boolean => {
  if (process.env.NEXT_PUBLIC_E2E_MODE === '1') return true;
  if (process.env.NEXT_PUBLIC_E2E === '1') return true;
  if (typeof window === 'undefined') return false;
  return Boolean(
    window.localStorage.getItem('e2e_role') ||
      window.localStorage.getItem('e2e_email') ||
      window.localStorage.getItem('e2e_name')
  );
};

export const getE2EUser = () => {
  if (typeof window === 'undefined') return null;
  const email =
    window.localStorage.getItem('e2e_email') ||
    process.env.NEXT_PUBLIC_E2E_EMAIL ||
    null;
  const displayName =
    window.localStorage.getItem('e2e_name') ||
    process.env.NEXT_PUBLIC_E2E_NAME ||
    'E2E Test User';
  if (!email) return null;
  return {
    uid: 'e2e-user',
    email,
    displayName,
  };
};

export const getE2ERole = () => {
  if (typeof window === 'undefined') return null;
  return (
    window.localStorage.getItem('e2e_role') ||
    process.env.NEXT_PUBLIC_E2E_ROLE ||
    null
  );
};
