import SignInForm from '@/components/SignIn/SignInForm';
import LoginLowFiWireframe from '@/components/Wireframes/LoginScreen/LoginLowFiWireframe';
import scss from './Home.module.scss';
import toast, { Toaster } from 'react-hot-toast';
export default function Home() {
  return (
    <>
      <main className={scss.main}>
        <Toaster />
        <h1 style={{ textAlign: 'center' }}>Welcome to Course Connect!</h1>
        <p style={{ fontStyle: 'italic', textAlign: 'center' }}>
          Please note that while our core features are complete, we are still 🚧
          under development 🚧.
        </p>
        <LoginLowFiWireframe />
        {/* <SignInForm /> */}
      </main>
    </>
  );
}

export const metadata = {
  title: 'Course Connect',
  description: 'Hiring management for students, faculty, and administrators.',
};
