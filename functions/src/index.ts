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
} from './nodemailer';

const admin = require('firebase-admin');
admin.initializeApp();
export const db = admin.firestore();
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
      const applicationObject = {
        firstname: request.body.firstname,
        lastname: request.body.lastname,
        email: request.body.email,
        ufid: request.body.ufid,
        phonenumber: request.body.phonenumber,
        gpa: request.body.gpa,
        department: request.body.department,
        degree: request.body.degree,
        semesterstatus: request.body.semesterstatus,
        additionalprompt: request.body.additionalprompt,
        nationality: request.body.nationality,
        englishproficiency: 'NA',
        position: request.body.position,
        available_hours: request.body.available_hours,
        available_semesters: request.body.available_semesters,
        courses: request.body.courses,
        qualifications: request.body.qualifications,
        uid: request.body.uid,
        date: request.body.date,
        status: request.body.status,
        resume_link: request.body.resume_link,
        classnumbers: 'NA',
      };

      // Create the document within the "applications" collection
      db.collection('applications')
        .doc(applicationObject.uid)
        .set(applicationObject)
        .then(() => {
          response.status(200).send('Application created successfully');
        })
        .catch((error: any) => {
          response.send('Error creating application: ' + error.message);
        });
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
