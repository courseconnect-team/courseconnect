import * as React from 'react';
import './style.css';
import { useCallback } from 'react';

import ThumbDownOffAltIcon from '@mui/icons-material/ThumbDownOffAlt';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import firebase from '@/firebase/firebase_config';
import 'firebase/firestore';
import { GridRowId } from '@mui/x-data-grid';

export interface AppViewProps {
  uid: string;
  close: () => void;
  handleDenyClick: (id: GridRowId) => void;
  handleOpenAssignmentDialog: (id: GridRowId) => void;
}

// Walk the canonical nested shape `{ [semester]: { [courseId]: status } }`
// (and the legacy `${semester}|||${courseId}` flat shape) into a list of
// per-(semester, course) entries. Iterating Object.entries on the outer
// shape returns [semester, bucket] pairs — a previous version of this
// view treated those as [courseId, status], so the "All" column rendered
// semester names and the "Faculty Approved" column was always empty.
interface AppViewCourseEntry {
  semester: string;
  courseId: string;
  status: string;
}
function flattenAppViewCourses(courses: any): AppViewCourseEntry[] {
  if (!courses || typeof courses !== 'object') return [];
  const out: AppViewCourseEntry[] = [];
  for (const [key, val] of Object.entries(courses)) {
    if (val && typeof val === 'object') {
      for (const [courseId, status] of Object.entries(
        val as Record<string, unknown>
      )) {
        if (typeof status === 'string')
          out.push({ semester: key, courseId, status });
      }
    } else if (typeof val === 'string') {
      const sepIdx = key.indexOf('|||');
      if (sepIdx !== -1) {
        out.push({
          semester: key.slice(0, sepIdx),
          courseId: key.slice(sepIdx + 3),
          status: val,
        });
      } else {
        out.push({ semester: '', courseId: key, status: val });
      }
    }
  }
  return out;
}
function formatAppViewLabel(e: AppViewCourseEntry): string {
  return e.semester ? `${e.courseId} (${e.semester})` : e.courseId;
}

export default function AppView({
  close,
  uid,
  handleDenyClick,
  handleOpenAssignmentDialog,
}: AppViewProps) {
  const [docData, setDocData] = React.useState<any>(null);

  const onThumbUpClick = useCallback(
    (event: any) => {
      event?.stopPropagation();
      handleOpenAssignmentDialog(uid);
    },
    [handleOpenAssignmentDialog, uid]
  );

  const onThumbDownIconClick = useCallback(
    (event: any) => {
      event?.stopPropagation();
      handleDenyClick(uid);
    },
    [handleDenyClick, uid]
  );

  React.useEffect(() => {
    // Applications live under `applications/course_assistant/uid/{uid}`,
    // not at the top level — fetching from `applications/{uid}` returns
    // a non-existent doc and leaves the view blank.
    const docRef = firebase
      .firestore()
      .collection('applications')
      .doc('course_assistant')
      .collection('uid')
      .doc(uid);
    docRef
      .get()
      .then((doc) => {
        if (doc.exists) {
          setDocData(doc.data());
        } else {
          console.log('No such document!');
        }
      })
      .catch((error) => {
        console.log('Error getting document:', error);
      });
  }, [uid]);
  return (
    <Box sx={{}}>
      {docData && (
        <>
          <div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                marginTop: '10px',
              }}
            >
              <div className="ellipse5">
                <div className="initials">
                  {docData.firstname[0].toUpperCase() +
                    docData.lastname[0].toUpperCase()}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="name5">
                  {docData.firstname} {docData.lastname}
                </div>

                <div style={{ position: 'absolute' }}>
                  <div className="email1">{docData.email}</div>
                  <div className="number">{docData.phonenumber}</div>
                </div>
              </div>
              <div className="thumbsContainer3">
                <ThumbUpOffAltIcon
                  onClick={onThumbUpClick}
                  className="thumbsUpIcon"
                  style={{
                    fontSize: '41px',
                  }}
                />
                <ThumbDownOffAltIcon
                  onClick={onThumbDownIconClick}
                  className="thumbsDownIcon"
                  style={{
                    fontSize: '41px',
                  }}
                />
                <div className="applicantStatus231" onClick={close}>
                  <div className="review23">Review</div>
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                marginLeft: '120px',
                flexWrap: 'wrap',
                marginRight: '95px',
              }}
            >
              <div style={{ display: 'flex', gap: '61px' }}>
                <div className="label50">Applying for:</div>
                <div>{docData.position}</div>
              </div>
              <div style={{ display: 'flex', gap: '61px' }}>
                <div className="label50">Semester(s):</div>
                <div>{docData.available_semesters.join(', ')}</div>
              </div>
              <div style={{ display: 'flex', gap: '75px' }}>
                <div className="label50">Availability:</div>
                <div className="availability2">
                  {docData.available_hours.join(', ')}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '75px' }}>
                <div className="label50"> All Course(s):</div>
                <div className="availability2">
                  {flattenAppViewCourses(docData.courses)
                    .map(formatAppViewLabel)
                    .join(', ') || '—'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '75px' }}>
                <div className="label50">Faculty Approved Course(s):</div>
                <div className="availability2">
                  {flattenAppViewCourses(docData.courses)
                    .filter((e) => e.status === 'approved')
                    .map(formatAppViewLabel)
                    .join(', ') || '—'}
                </div>
              </div>

              <br />
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row', // Keep it as 'row' for a horizontal row layout
                  gap: '144px', // Adjust the gap as needed
                  marginBottom: '20px',
                }}
              >
                <div>
                  <div className="label50">Department:</div>
                  <div
                    style={{ textAlign: 'center' }}
                    className="availability2"
                  >
                    {docData.department}
                  </div>
                </div>

                <div>
                  <div className="label50">Degree:</div>
                  <div
                    style={{ textAlign: 'center' }}
                    className="availability2"
                  >
                    {docData.degree}
                  </div>
                </div>

                <div>
                  <div className="label50">GPA:</div>
                  <div
                    style={{ textAlign: 'center' }}
                    className="availability2"
                  >
                    {docData.gpa}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '10px' }} className="label50">
                Qualifications:
              </div>
              <div className="availability2" style={{ marginBottom: '31px' }}>
                {docData.qualifications}
              </div>
              <div style={{ marginBottom: '10px' }} className="label50">
                Graduate Plan:
              </div>
              <div className="availability2" style={{ marginBottom: '31px' }}>
                {docData.additionalprompt}
              </div>
              <div style={{ marginBottom: '10px' }} className="label50">
                Resume Link:
              </div>
              {docData.resume_link ? (
                <a style={{ marginBottom: '60px' }} href={docData.resume_link}>
                  {docData.resume_link}
                </a>
              ) : (
                <div
                  style={{
                    marginBottom: '104px',
                    fontSize: '20px',
                    color: '#9e9e9e',
                  }}
                >
                  No resume link provided.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </Box>
  );
}
