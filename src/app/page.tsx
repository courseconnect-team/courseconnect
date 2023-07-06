import SignInForm from '@/components/SignIn/SignInForm';
import scss from './Home.module.scss';

export default function Home() {
  return (
    <>
      <main className={scss.main}>
        <h1 style={{ textAlign: 'center' }}>Welcome to Course Connect!</h1>
        <p style={{ fontStyle: 'italic', textAlign: 'center' }}>
          Please note that while our core features are complete, we are still 🚧
          under development 🚧.
        </p>
        <SignInForm />
      </main>
    </>
  );
}
