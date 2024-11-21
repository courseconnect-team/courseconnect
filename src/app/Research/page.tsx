import React from 'react';
import { Toaster } from 'react-hot-toast';
import HeaderCard from '@/components/HeaderCard/HeaderCard';
import { Bio } from '@/components/Bio/Bio';
import { useUserRole } from '@/firebase/util/GetUserRole';
interface ResearchPageProps {
  user: {
    uid: string;
    fullName: string;
    bio: string;
  };
}

const ResearchPage: React.FC<ResearchPageProps> = ({ user }) => {
  const {
    role,
    loading: roleLoading,
    error: roleError,
  } = useUserRole(user?.uid);

  if (roleLoading) {
    return <div>Loading user role...</div>;
  }

  if (roleError) {
    return <div>Error loading user role</div>;
  }

  return (
    <>
      <Toaster />
      <HeaderCard text="Courses" />
      <Bio user={user} className="full-name-and-bio-instance" />
      <div className="page-container">
        {role === 'faculty' && (
          <div className="faculty-component">
            {/* Replace this with your actual component */}
            <h2>Welcome, Faculty Member!</h2>
            <p>
              Here you can manage your research activities and collaborations.
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default ResearchPage;
