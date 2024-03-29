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
  const [openDenyDialog, setOpenDenyDialog] = useState(false);
  const [openReviewDialog, setOpenReviewDialog] = useState(false);
  const [currentStu, setCurrentStu] = useState("null");

  const [expandedStates, setExpandedStates] = useState<{
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
      plan: string;
      gpa: string;
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
      plan: string;
      gpa: string;
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
      plan: string;
      gpa: string;
    }[]
  >([]);

  const [selection, setSelection] = useState<string>('Review');

  const toggleSelection = (select: string): void => {
    setSelection(select);
    setExpandedStates({})
  };

  const getDataByPositionAndStatus = async (position: string, status: string) => {
    try {
      let getQueryParams = query => {
        return query
          ? (/^[?#]/.test(query) ? query.slice(1) : query)
            .split('&')
            .reduce((params, param) => {
              let [key, value] = param.split('=');
              params[key] = value ? decodeURIComponent(value.replace(/\+/g, ' ')) : '';
              return params;
            }, {}
            )
          : {}
      };
      const { data } = getQueryParams(window.location.search);
      console.log(data);

      const snapshot = await db
        .collection('applications')
        .where(`courses.${data}`, ">=", "")
        .where('position', '==', position)
        .get();

      return snapshot.docs.filter(function(doc) {

        if (doc.data().courses[data] == "applied" && selection == "Review") {

          console.log(doc.data());
          return true;
        } else if (doc.data().courses[data] == "accepted" && selection == "Approved") {
          return true;
        } else if (doc.data().courses[data] == "denied" && selection == "Denied") {
          return true;
        } else {
          return false;
        }
      }).map((doc) => ({

        id: doc.id,
        uf_email: doc.data().email,
        firstname: doc.data().firstname,
        lastname: doc.data().lastname,
        number: doc.data().phonenumber,
        position: doc.data().position,
        semester: doc.data().available_semesters,
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
            />
          )}

          {selection === 'Approved' &&
            (
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
