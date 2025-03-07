'use client';
import { FC } from 'react';
import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import HeaderCard from '@/components/HeaderCard/HeaderCard';
import './style.css';
import CourseNavBar from '@/components/CourseNavBar/CourseNavBar';
import ApplicantCardApprovedeny from '@/components/ApplicantCardApprovedeny/ApplicantCardApprovedeny';
import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';
import Spinner from '@/components/Spinner/Spinner';
import ApplicantCardAssign from '@/components/ApplicantCardAssign/ApplicantCardAssign';
import ApplicantCardApprove from '@/components/ApplicantCardApprove/ApplicantCardApprove';
import ApplicantCardDeny from '@/components/ApplicantCardDeny/ApplicantCardDeny';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useUserRole } from '@/firebase/util/GetUserRole';
import { useSearchParams } from 'next/navigation';

interface pageProps {
  params: { className: string; semester: string };
}
interface QueryParams {
  [key: string]: string;
}
interface applicationData {
  id: string;
  uf_email: string;
  firstname: string;
  lastname: string;
  number: string;
  position: string;
  semester: string;
  availability: string;
  department: string;
  degree: string;
  collegestatus: string;
  qualifications: string;
  resume: string;
  plan: string;
  gpa: string;
}

// const [selectedItem, setSelectedItem] = useState('needsReview');

// const NeedsReviewApplicants = () => {
//   const [applicants, setApplicants] = useState([]);

//   useEffect(() => {
//     const fetchApplicants = async () => {
//       const needsReviewApplicants = await getNeedsReviewApplicants();

//     };

//     fetchApplicants();
//   }, []);
// }
// const handleNavBarItemClick = (item) => {
//   setSelectedItem(item);
// };

const CoursePage: FC<pageProps> = ({ params }) => {
  const db = firebase.firestore();
  const auth = getAuth();
  const user = auth.currentUser;
  const {
    role,
    loading: roleLoading,
    error: roleError,
  } = useUserRole(user?.uid);

  const [openApproveDialog, setOpenApproveDialog] = useState(false);
  const [openDenyDialog, setOpenDenyDialog] = useState(false);
  const [openReviewDialog, setOpenReviewDialog] = useState(false);
  const [currentStu, setCurrentStu] = useState('null');
  const [className, setClassName] = useState('none');
  const [loading, setLoading] = useState<boolean>(true);

  const [expandedStates, setExpandedStates] = useState<{
    [id: string]: boolean;
  }>({});

  const handleExpandToggle = (id: string) => {
    setExpandedStates((prevExpandedStates) => ({
      ...prevExpandedStates,
      [id]: !prevExpandedStates[id],
    }));
  };

  const [taData, setTaData] = useState<applicationData[]>([]);
  const [upiData, setupiData] = useState<applicationData[]>([]);
  const [graderData, setgraderData] = useState<applicationData[]>([]);
  const [selection, setSelection] = useState<string>('Review');
  const searchParams = useSearchParams();
  const courseTitle = searchParams.get('courseTitle');

  const toggleSelection = (select: string): void => {
    setSelection(select);
    setExpandedStates({});
  };

  const getDataByPositionAndStatus = async (
    position: string,
    status: string
  ) => {
    try {
      const snapshot = await db
        .collection('applications')
        .where(`courses.${className}`, '>=', '')
        .orderBy(`courses.${className}`)

        // .where('semesters', 'array-contains', params.semester )
        .get();

      const snapshot2 = await db
        .collection('assignments')
        .where('class_codes', '==', className)
        .where('position', '==', position)
        .get();

      if (selection == 'Assigned') {
        return snapshot2.docs.map((doc) => ({
          id: doc.id,
          uf_email: doc.data().email,
          firstname: doc.data().name,
          lastname: ' ',
          number: '',
          position: doc.data().position,
          semester: params.semester,
          availability: doc.data().hours,
          department: doc.data().department,
          degree: '',
          collegestatus: '',
          qualifications: '',
          resume: '',
          plan: '',
          gpa: '',
        }));
      }
      return snapshot.docs
        .filter(function (doc) {
          if (doc.data().position != position) {
            return false;
          }
          if (doc.data().status == 'Admin_approved') {
            return false;
          }
          if (doc.data().status == 'Admin_denied' && selection != 'Denied') {
            return false;
          }
          if (
            doc.data().courses[className] == 'applied' &&
            selection == 'Review'
          ) {
            return true;
          } else if (
            doc.data().courses[className] == 'accepted' &&
            selection == 'Approved'
          ) {
            return true;
          } else if (
            doc.data().courses[className] == 'denied' &&
            selection == 'Denied'
          ) {
            return true;
          } else {
            return false;
          }
        })
        .map((doc) => ({
          id: doc.id,
          uf_email: doc.data().email,
          firstname: doc.data().firstname,
          lastname: doc.data().lastname,
          number: doc.data().phonenumber,
          position: doc.data().position,
          semester: params.semester,
          availability: doc.data().available_hours,
          department: doc.data().department,
          degree: doc.data().degree,
          collegestatus: doc.data().semesterstatus,
          qualifications: doc.data().qualifications,
          resume: doc.data().resume_link,
          plan: doc.data().grad_plans,
          gpa: doc.data().gpa,
        }));
    } catch (error) {
      console.error(`Error getting ${className} applicants: `, error);
      return [];
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getDataByPositionAndStatus('TA', selection);
        const result2 = await getDataByPositionAndStatus('UPI', selection);
        const result3 = await getDataByPositionAndStatus('Grader', selection);
        setTaData(result);
        setupiData(result2);
        setgraderData(result3);
      } catch (error) {
        console.error('Error fetching data: ', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const getQueryParams = (query: string): QueryParams => {
      return query
        ? (/^[?#]/.test(query) ? query.slice(1) : query)
            .split('&')
            .reduce((params: QueryParams, param) => {
              let [key, value] = param.split('=');
              params[key] = value
                ? decodeURIComponent(value.replace(/\+/g, ' '))
                : '';
              return params;
            }, {})
        : {};
    };

    const params = getQueryParams(window.location.search);
    const data = params.data;

    setClassName(data);
  }, [selection, className]);

  const mapElement = (
    data: {
      id: string;
      uf_email: any;
      firstname: any;
      lastname: any;
      number: string;
      position: string;
      semester: string;
      availability: string;
      department: string;
      degree: string;
      collegestatus: string;
      qualifications: string;
      resume: string;
      plan: string;
      gpa: string;
    }[]
  ) => {
    return data.map((ta) => {
      return (
        <div key={ta.id} style={{ paddingBottom: '31px' }}>
          {selection === 'Review' && (
            <ApplicantCardApprovedeny
              id={ta.id}
              number={ta.number}
              position={ta.position}
              semester={ta.semester}
              availability={ta.availability}
              department={ta.department}
              degree={ta.degree}
              collegestatus={ta.collegestatus}
              qualifications={ta.qualifications}
              expanded={expandedStates[ta.id] || false}
              onExpandToggle={() => handleExpandToggle(ta.id)}
              uf_email={ta.uf_email}
              firstname={ta.firstname}
              lastname={ta.lastname}
              resume={ta.resume}
              plan={ta.plan}
              gpa={ta.gpa}
              openApprove={openApproveDialog}
              openDeny={openDenyDialog}
              setOpenApproveDialog={setOpenApproveDialog}
              setOpenDenyDialog={setOpenDenyDialog}
              currentStu={currentStu}
              setCurrentStu={setCurrentStu}
              className={className}
            />
          )}

          {selection === 'Approved' && (
            <ApplicantCardApprove
              id={ta.id}
              number={ta.number}
              position={ta.position}
              semester={ta.semester}
              availability={ta.availability}
              department={ta.department}
              degree={ta.degree}
              collegestatus={ta.collegestatus}
              qualifications={ta.qualifications}
              expanded={expandedStates[ta.id] || false}
              onExpandToggle={() => handleExpandToggle(ta.id)}
              uf_email={ta.uf_email}
              firstname={ta.firstname}
              lastname={ta.lastname}
              resume={ta.resume}
              plan={ta.plan}
              gpa={ta.gpa}
              openReview={openReviewDialog}
              setOpenReviewDialog={setOpenReviewDialog}
              currentStu={currentStu}
              setCurrentStu={setCurrentStu}
              className={className}
            />
          )}
          {selection === 'Assigned' && (
            <ApplicantCardAssign
              id={ta.id}
              number={ta.number}
              position={ta.position}
              semester={ta.semester}
              availability={ta.availability}
              department={ta.department}
              degree={ta.degree}
              collegestatus={ta.collegestatus}
              qualifications={ta.qualifications}
              expanded={expandedStates[ta.id] || false}
              onExpandToggle={() => handleExpandToggle(ta.id)}
              uf_email={ta.uf_email}
              firstname={ta.firstname}
              lastname={ta.lastname}
              resume={ta.resume}
              plan={ta.plan}
              gpa={ta.gpa}
              openReview={openReviewDialog}
              setOpenReviewDialog={setOpenReviewDialog}
              currentStu={currentStu}
              setCurrentStu={setCurrentStu}
              className={className}
            />
          )}

          {selection === 'Denied' && (
            <ApplicantCardDeny
              id={ta.id}
              number={ta.number}
              position={ta.position}
              semester={ta.semester}
              availability={ta.availability}
              department={ta.department}
              degree={ta.degree}
              collegestatus={ta.collegestatus}
              qualifications={ta.qualifications}
              expanded={expandedStates[ta.id] || false}
              onExpandToggle={() => handleExpandToggle(ta.id)}
              uf_email={ta.uf_email}
              firstname={ta.firstname}
              lastname={ta.lastname}
              resume={ta.resume}
              plan={ta.plan}
              gpa={ta.gpa}
              openReview={openReviewDialog}
              setOpenReviewDialog={setOpenReviewDialog}
              currentStu={currentStu}
              setCurrentStu={setCurrentStu}
              className={className}
            />
          )}
        </div>
      );
    });
  };

  if (roleError) {
    return <p>Error loading role</p>;
  }

  if (!user) {
    return <p>Please sign in.</p>;
  }

  if (role !== 'faculty' && role !== 'admin') {
    return <p>Loading.</p>;
  }

  return (
    <>
      <Toaster />
      <HeaderCard text="Applications" />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '380px',
        }}
      >
        <div className="classe">
          {className.substring(0, className.indexOf(' ')) +
            ': ' +
            courseTitle +
            className.substring(
              className.indexOf(' '),
              className.indexOf(')') + 1
            )}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center', // Center the content horizontally
          maxWidth: '40%', // Set the maximum width to 1/3 of the page
          margin: '0 auto',
        }}
      >
        <CourseNavBar handleClick={toggleSelection} />
      </div>

      {loading && <Spinner />}

      {taData.length != 0 && (
        <div className="TAtext" style={{ margin: '35px 0 24px 40px' }}>
          TA
        </div>
      )}
      {mapElement(taData)}

      {upiData.length != 0 && (
        <div className="TAtext" style={{ margin: '35px 0 24px 40px' }}>
          UPI
        </div>
      )}
      {mapElement(upiData)}

      {graderData.length != 0 && (
        <div className="TAtext" style={{ margin: '35px 0 24px 40px' }}>
          Grader
        </div>
      )}
      {mapElement(graderData)}
    </>
  );
};

export default CoursePage;
