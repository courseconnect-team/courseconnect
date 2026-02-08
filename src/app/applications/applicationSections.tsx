/* components/DashboardSections.tsx */
import { Role } from '@/types/User';
import { useState, useEffect, useCallback } from 'react';
import { DashboardCard } from '@/components/DashboardCard/DashboardCard';
import { NavbarItem } from '@/types/navigation';
import SemesterSelect from '@/components/SemesterSelect/SemesterSelect';
import { useSemesterData } from '@/hooks/Courses/useSemesterData';
import { CoursesGrid } from '@/components/CoursesGrid/CoursesGrid';
import { type SemesterName } from '@/hooks/useSemesterOptions';
import ApplicationCard from '@/components/Research/ApplicationCard';
import firebase from '@/firebase/firebase_config';
import { useAuth } from '@/firebase/auth/auth_context';

function ResearchApplicationsList() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const snapshot = await firebase
        .firestore()
        .collectionGroup('applications')
        .where('uid', '==', user.uid)
        .get();

      const results = await Promise.all(
        snapshot.docs.map(async (appDoc) => {
          const appData = appDoc.data();
          const listingRef = appDoc.ref.parent.parent;
          let listingData: any = {};
          if (listingRef) {
            const listingSnap = await listingRef.get();
            if (listingSnap.exists) {
              listingData = listingSnap.data();
            }
          }
          return {
            appId: appDoc.id,
            ...appData,
            listingData,
          };
        })
      );

      const mapped = results.map((doc: any) => ({
        appid: doc.appId,
        app_status: doc.app_status,
        terms_available: doc.listingData?.terms_available || 'N/A',
        date_applied: doc.date || 'N/A',
        department: doc.department || doc.listingData?.department || 'N/A',
        faculty_mentor: doc.listingData?.faculty_mentor,
        faculty_contact: doc.listingData?.faculty_contact,
        project_title: doc.listingData?.project_title || 'N/A',
        project_description:
          doc.listingData?.project_description || 'No description provided',
        degree: doc.degree || 'N/A',
      }));

      setApplications(mapped);
    } catch (error) {
      console.error('Error fetching research applications:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  if (loading) {
    return (
      <p className="text-sm text-gray-500">Loading research applications...</p>
    );
  }

  if (applications.length === 0) {
    return <p className="text-sm">No research applications at this time.</p>;
  }

  return (
    <div className="flex flex-wrap gap-4">
      {applications.map((item, index) => (
        <div key={index} className="w-full md:w-[calc(50%-8px)]">
          <ApplicationCard
            app_status={item.app_status}
            userRole="student_applied"
            project_title={item.project_title}
            department={item.department}
            date_applied={item.date_applied}
            faculty_mentor={item.faculty_mentor}
            faculty_contact={item.faculty_contact}
            terms_available={item.terms_available}
            student_level={item.degree}
            project_description={item.project_description}
          />
        </div>
      ))}
    </div>
  );
}

export default function ApplicationSections({
  role,
  navItems,
  uemail,
}: {
  role: Role;
  navItems: NavbarItem[];
  uemail: string;
}) {
  const [semester, setSemester] = useState<SemesterName | undefined>();
  const semesterArray = semester ? [semester] : undefined;
  const {
    currentSemester,
    options,
    courses,
    isLoading,
    isFetching,
    error,
    showSkeletons,
    skeletonCount,
  } = useSemesterData(role, uemail, semesterArray);

  switch (role) {
    case 'Student':
    case 'student_applied':
    case 'student_applying':
      return (
        <>
          <div className="mb-5">
            <h1 className="text-h6 mb-3 ">TA/UPI/Grader</h1>
            <div className="flex flex-wrap gap-6">
              {navItems
                .filter((item) => item.type === 'ta')
                .map(({ label, to, icon: Icon }: NavbarItem) => (
                  <DashboardCard key={to} icon={Icon} label={label} to={to} />
                ))}
            </div>
          </div>
          <div>
            <h1 className="text-h6 mb-3 ">Research</h1>
            <ResearchApplicationsList />
          </div>
        </>
      );

    case 'faculty':
    case 'admin':
      return (
        <>
          <div className="mb-5">
            <div className="text-h6 mb-3">TA/UPI/Grader </div>
            <SemesterSelect
              names={options}
              semester={semester}
              onChange={setSemester}
            />
            <CoursesGrid
              courses={courses}
              isLoading={isLoading}
              isFetching={isFetching}
              error={error}
              showSkeletons={showSkeletons}
              skeletonCount={skeletonCount}
              path={'applications'}
              semester={semesterArray}
            />
          </div>

          <div>
            <h1 className="text-h6 mb-3">Research</h1>
            <p className="text-sm">No available applications at this time.</p>
          </div>
        </>
      );

    default:
      return null; // or 404/unauthorised component
  }
}
