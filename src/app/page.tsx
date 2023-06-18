import SignInForm from '@/components/SignIn/SignInForm';
import scss from './Home.module.scss';

export default function Home() {
  return (
    <>
      <main className={scss.main}>
        <h1>This is a test</h1>
        <SignInForm />
      </main>
    </>
  );
}
