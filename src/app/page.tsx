import Header from '@/components/Header';
import Login from '@/components/Login';
import SideMenu from '@/components/SideMenu';
import Dashboard from './dashboard/page';

export default function Home() {
  return (
    <>
      <main className="">
        <Header />
        <Login />
      </main>
    </>
  );
}
