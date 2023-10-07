import SignUpForm from '@/components/SignUp/SignUpForm';
import toast, { Toaster } from 'react-hot-toast';

export default function SignUpPage() {
  return (
    <>
      <main className="">
        <Toaster />
        <SignUpForm />
      </main>
    </>
  );
}
