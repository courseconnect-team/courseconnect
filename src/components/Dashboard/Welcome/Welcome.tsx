import Container from '@mui/material/Container';
import UnderDevelopment from '@/components/UnderDevelopment';
import { Toaster } from 'react-hot-toast';
import { ApplyCard } from "@/components/ApplyCard/ApplyCard";
import { EceLogoPng } from "@/components/EceLogoPng/EceLogoPng";
import { Bio } from "@/components/Bio/Bio";
import { Profile } from "@/components/Profile/Profile";
import { TopNavBarSigned } from "@/components/TopNavBarSigned/TopNavBarSigned";
import "./style.css";
import Link from 'next/link';
interface DashboardProps {
  user: any;
  userRole: string;
}

export default function DashboardWelcome(props: DashboardProps) {
  const { userRole, user } = props;

  return (
    <>
      <Toaster />
      <div className="student-landing-page">
        <div className="overlap-wrapper">
          <div className="overlap">
            <div className="overlap-2">
              <div className="color-block-frame">
                <div className="overlap-group-2">
                  <div className="color-block" />
                  <img className="GRADIENTS" alt="Gradients" src="https://c.animaapp.com/vYQBTcnO/img/gradients.png" />
                  <div className="glass-card" />
                </div>
              </div>
              <EceLogoPng className="ece-logo-png-2" />
              <Bio user={user} className="full-name-and-bio-instance" />
              <TopNavBarSigned className="top-nav-bar-signed-in" />
              <div className="text-wrapper-8">Home</div>
            </div>
            <Link href="/Profile">
              <Profile className="profile-instance" profile="https://c.animaapp.com/vYQBTcnO/img/profile@2x.png" />
            </Link>
            <Link href="/apply">
              <ApplyCard apply="https://c.animaapp.com/vYQBTcnO/img/apply@2x.png" className="apply-instance" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
