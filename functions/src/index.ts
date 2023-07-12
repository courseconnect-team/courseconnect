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
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();

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
        englishproficiency: request.body.englishproficiency,
        position: request.body.position,
        available_hours: request.body.available_hours,
        available_semesters: request.body.available_semesters,
        courses: request.body.courses,
        qualifications: request.body.qualifications,
        uid: request.body.uid,
        date: request.body.date,
        status: request.body.status,
      };

      // Create the document within the "applications" collection
      db.collection('applications')
        .doc(applicationObject.uid)
        .set(applicationObject)
        .then(() => {
          response.status(200).send('Application created successfully');
        })
        .catch((error: any) => {
          response
            .status(500)
            .send('Error creating application: ' + error.message);
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

export const checkIfIDInDatabase = functions.https.onRequest(
  (request, response) => {
    response.set('Access-Control-Allow-Origin', '*');
    response.set('Access-Control-Allow-Methods', 'GET, POST');
    response.set('Access-Control-Allow-Headers', 'Content-Type');

    const userObject = {
      school_id: request.body.auth_id,
    };

    // check if ufid exists in database
    // if it does, return error
    // if it doesn't, create user

    const usersRef = db.collection('users');
    const snapshot = usersRef.where('ufid', '==', userObject.school_id).get();
    // this snapshot represents the users with the same ufid
    if (!snapshot.empty) {
      // there is a user with the same ufid
      // send an error response
      console.log('User with same school ID already exists!');
      response.status(500).send('User with same school ID already exists!');
    }
    // else, there are no users with the same ufid
    // send an ok response
    response.status(200).send('No user with that school ID found!');
  }
);
