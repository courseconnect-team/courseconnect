/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
import * as functions from 'firebase-functions';
import { DocumentSnapshot } from 'firebase-functions/v2/firestore';
// import * as cors from 'cors';
import {
  sendForgotPasswordEmail,
  sendApplicationConfirmationEmail,
  sendApplicationStatusApprovedEmail,
  sendApplicationStatusDeniedEmail,
  sendFacultyNotificationEmail,
  sendUnapprovedUserNotificationEmail,
  sendFacultyAssignedNotificationEmail,
  sendRenewTAEmail,
  sendApplicantToFaculty,
  sendStatusUpdateToApplicant,
} from './nodemailer';

const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();
db.settings({ ignoreUndefinedProperties: true });

exports.sendEmail = functions.https.onRequest((req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
  } else {
    const { type, data } = req.body;
    switch (type) {
      case 'sendApplicantToFaculty':
        sendApplicantToFaculty(data.project_title);
        break;
      case 'sendStatusUpdateToApplicant':
        sendStatusUpdateToApplicant(data.project_title, data.status);
        break;
      case 'forgotPassword':
        sendForgotPasswordEmail(data.user, data.resetLink);
        break;
      case 'applicationConfirmation':
        sendApplicationConfirmationEmail(
          data.user,
          data.position,
          data.classCode
        );
        break;
      case 'applicationStatusApproved':
        sendApplicationStatusApprovedEmail(
          data.user,
          data.position,
          data.classCode
        );

        break;
      case 'applicationStatusDenied':
        sendApplicationStatusDeniedEmail(
          data.user,
          data.position,
          data.classCode
        );
        break;
      case 'facultyNotification':
        sendFacultyNotificationEmail(data.user, data.position, data.classCode);
        break;
      case 'facultyAssignment':
        sendFacultyAssignedNotificationEmail(
          data.userEmail,
          data.position,
          data.classCode,
          data.semester
        );
        break;
      case 'unapprovedUser':
        sendUnapprovedUserNotificationEmail(data.user);
        break;
      case 'renewTA':
        sendRenewTAEmail(data.userEmail, data.message, data.subject);
        break;
      default:
        res.status(400).json({ message: 'Invalid email type' });
        return;
    }

    res.status(200).json({ success: true });
  }
});

// const corsHandler = cors({ origin: true });

export const processSignUpForm = functions.https.onRequest(
  (request, response) => {
    response.set('Access-Control-Allow-Origin', '*');
    response.set('Access-Control-Allow-Methods', 'GET, POST');
    response.set('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') {
      // Handle preflight request
      response.status(204).send('');
    } else {
      // Handle other requests

      // Extract user object data from post request
      const userObject = {
        firstname: request.body.firstname,
        lastname: request.body.lastname,
        email: request.body.email,
        password: request.body.password,
        department: request.body.department,
        role: request.body.role,
        ufid: request.body.ufid,
        uid: request.body.uid,
      };

      // Create the document within the "users" collection
      db.collection('users')
        .doc(userObject.uid)
        .set(userObject)
        .then(() => {
          response.status(200).send('User created successfully');
        })
        .catch((error: any) => {
          response.status(500).send('Error creating user: ' + error.message);
        });
    }
  }
);

export const processApplicationForm = functions.https.onRequest(
  async (request, response) => {
    response.set('Access-Control-Allow-Origin', '*');
    response.set('Access-Control-Allow-Methods', 'GET, POST');
    response.set('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') {
      // Handle preflight request
      response.status(204).send('');
      return;
    }

    try {
      // Determine application type (supervised_teaching sends this, course_assistant defaults)
      const applicationType =
        request.body.application_type || 'course_assistant';
      const uid = request.body.uid;

      if (!uid) {
        response.status(400).send('Error: uid is required');
        return;
      }

      // Extract user object data from post request
      const applicationObject = {
        ...request.body,
        application_type: applicationType,
      };

      // For course_assistant, ensure all expected fields are present
      if (applicationType === 'course_assistant') {
        applicationObject.phonenumber = request.body.phonenumber;
        applicationObject.gpa = request.body.gpa;
        applicationObject.department = request.body.department;
        applicationObject.degree = request.body.degree;
        applicationObject.semesterstatus = request.body.semesterstatus;
        applicationObject.additionalprompt = request.body.additionalprompt;
        applicationObject.nationality = request.body.nationality;
        applicationObject.englishproficiency = 'NA';
        applicationObject.position = request.body.position;
        applicationObject.available_hours = request.body.available_hours;
        applicationObject.available_semesters =
          request.body.available_semesters;
        applicationObject.courses = request.body.courses;
        applicationObject.qualifications = request.body.qualifications;
        applicationObject.resume_link = request.body.resume_link;
        applicationObject.classnumbers = 'NA';
      }

      // Common fields for all application types
      applicationObject.firstname = request.body.firstname;
      applicationObject.lastname = request.body.lastname;
      applicationObject.email = request.body.email;
      applicationObject.ufid = request.body.ufid;
      applicationObject.uid = uid;
      applicationObject.date = request.body.date;
      applicationObject.status = request.body.status;

      // DUAL-WRITE MODE: Write to both old and new structures for backward compatibility

      // 1. Write to new structure: applications/{userId}/{applicationType}/{auto-generated-id}
      const newStructureRef = await db
        .collection('applications')
        .doc(uid)
        .collection(applicationType)
        .add({
          ...applicationObject,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });

      console.log(
        `Created application in new structure: ${newStructureRef.id}`
      );

      // 2. Also write to old flat structure for backward compatibility (temporary)
      // This allows existing code to continue working during migration
      await db
        .collection('applications')
        .doc(uid)
        .set(applicationObject, { merge: true });

      response.status(200).send('Application created successfully');
    } catch (error: any) {
      console.error('Error creating application:', error);
      response.status(500).send('Error creating application: ' + error.message);
    }
  }
);

export const processCreateCourseForm = functions.https.onRequest(
  (request, response) => {
    response.set('Access-Control-Allow-Origin', '*');
    response.set('Access-Control-Allow-Methods', 'GET, POST');
    response.set('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') {
      // Handle preflight request
      response.status(204).send('');
    } else {
      // Handle other requests

      // Extract user object data from post request
      const courseObject = {
        code: request.body.code,
        title: request.body.title,
        id: request.body.id,
        professor_names: request.body.professor_names,
        professor_emails: request.body.professor_emails,
        helper_names: request.body.helper_names,
        helper_emails: request.body.helper_emails,
        credits: request.body.credits,
        enrollment_cap: request.body.enrollment_cap,
        num_enrolled: request.body.num_enrolled,
      };

      // Create the document within the "courses" collection
      db.collection('courses')
        .doc(courseObject.id)
        .set(courseObject)
        .then(() => {
          response.status(200).send('Course created successfully');
        })
        .catch((error: any) => {
          response.status(500).send('Error creating course: ' + error.message);
        });
    }
  }
);

export const deleteUserFromID = functions.https.onRequest(
  (request, response) => {
    response.set('Access-Control-Allow-Origin', '*');
    response.set('Access-Control-Allow-Methods', 'GET, POST');
    response.set('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') {
      // Handle preflight request
      response.status(204).send('');
    } else {
      // Extract user object data from post request
      const userObject = {
        auth_id: request.body.auth_id,
      };

      // If there is any data associated with the user in the database, delete it
      // This must be done for the users, applications, and assignments collections
      const userDocRef = db.collection('users').doc(userObject.auth_id);
      const applicationDocRef = db
        .collection('applications')
        .doc(userObject.auth_id);
      const assignmentDocRef = db
        .collection('assignments')
        .doc(userObject.auth_id);

      userDocRef
        .get()
        .then((doc: DocumentSnapshot) => {
          if (doc.exists) {
            userDocRef
              .delete()
              .then(() => {
                console.log('Document successfully deleted.');
              })
              .catch((error: any) => {
                console.error('Error deleting document: ', error);
              });
          } else {
            console.log('Document does not exist.');
          }
        })
        .catch((error: any) => {
          console.error('Error getting document: ', error);
        });

      applicationDocRef
        .get()
        .then((doc: DocumentSnapshot) => {
          if (doc.exists) {
            applicationDocRef
              .delete()
              .then(() => {
                console.log('Document successfully deleted.');
              })
              .catch((error: any) => {
                console.error('Error deleting document: ', error);
              });
          } else {
            console.log('Document does not exist.');
          }
        })
        .catch((error: any) => {
          console.error('Error getting document: ', error);
        });

      assignmentDocRef
        .get()
        .then((doc: DocumentSnapshot) => {
          if (doc.exists) {
            assignmentDocRef
              .delete()
              .then(() => {
                console.log('Document successfully deleted.');
              })
              .catch((error: any) => {
                console.error('Error deleting document: ', error);
              });
          } else {
            console.log('Document does not exist.');
          }
        })
        .catch((error: any) => {
          console.error('Error getting document: ', error);
        });

      // Delete the user from firebase auth
      auth
        .deleteUser(userObject.auth_id)
        .then(() => {
          response.status(200).send('User deleted successfully');
        })
        .catch((error: any) => {
          response.status(500).send('Error deleting user: ' + error.message);
        });
    }
  }
);
