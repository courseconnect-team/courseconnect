// pages/course/[className].js
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
import ApplicantCardApprove from '@/components/ApplicantCardApprove/ApplicantCardApprove';
import ApplicantCardDeny from '@/components/ApplicantCardDeny/ApplicantCardDeny';
interface pageProps {
  params: { className: string };
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
  const [openApproveDialog, setOpenApproveDialog] = useState(false);
  const [openDenyDialog, setOpenDenyDialog] = useState(false);  const [expandedStates, setExpandedStates] = useState<{
    [id: string]: boolean;
  }>({});

  const handleExpandToggle = (id: string) => {
    setExpandedStates((prevExpandedStates) => ({
      ...prevExpandedStates,
      [id]: !prevExpandedStates[id],
    }));
  };

  const [taData, setTaData] = useState<
    {
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
      plan:string;
    }[]
  >([]);

  const [upiData, setupiData] = useState<
    {
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
      plan:string;
    }[]
  >([]);

  const [graderData, setgraderData] = useState<
    {
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
      plan:string;
    }[]
  >([]);

  const [selection, setSelection] = useState<string>('Review');

  const toggleSelection = (select: string): void => {
    setSelection(select);
  };

  const getDataByPositionAndStatus = async (position: string, status:string) => {
    try {
      const snapshot = await db
        .collection('applications')
        .where('courses', 'array-contains', params.className)
        .where('status', '==', status)
        .where('position', '==', position)
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        uf_email: doc.data().uf_email,
        firstname: doc.data().firstname,
        lastname: doc.data().lastname,
        number: doc.data().phone,
        position: doc.data().position,
        semester: doc.data().semesters,
        availability: doc.data().availability,
        department: doc.data().dept,
        degree: doc.data().degree,
        collegestatus: doc.data().upcoming_sem_status,
        qualifications: doc.data().qualifications,
        resume: doc.data().resume_link,
        plan:doc.data().grad_plans
      }));
    } catch (error) {
      console.error(`Error getting ${params.className} applicants: `, error);
      return [];
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getDataByPositionAndStatus('TA', selection);
        const result2 = await getDataByPositionAndStatus('UPI', selection);
        const result3 = await getDataByPositionAndStatus('Grader', selection);
        setTaData(result);
        setupiData(result2);
        setgraderData(result3);
      } catch (error) {
        console.error('Error fetching data: ', error);
      }
    };

    fetchData();
  }, [selection]);

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
              resume ={ta.resume}
              plan ={ta.plan}
              openApprove = {openApproveDialog}
              openDeny = {openDenyDialog}
              setOpenApproveDialog={setOpenApproveDialog}
              setOpenDenyDialog={setOpenDenyDialog}
            />
          )}

          {selection === 'Approved' &&
            (
              <ApplicantCardApprove
                uf_email={ta.uf_email}
                firstname={ta.firstname}
                lastname={ta.lastname}
              />
            )}

          {selection === 'Denied' && (
            <ApplicantCardDeny
              uf_email={ta.uf_email}
              firstname={ta.firstname}
              lastname={ta.lastname}
            />
          )}
        </div>
      );
    });
  };

  return (
    <>
      <Toaster />
      <HeaderCard text="Applications" />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '-20px',
        }}
      >
        <div className="classe">{params.className}</div>
        <div className="semester">Fall 2023</div>
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
